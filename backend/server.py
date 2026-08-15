from fastapi import FastAPI, APIRouter, Depends, HTTPException, Header, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import bcrypt
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ----------------------------- Helpers -----------------------------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def make_session_token() -> str:
    return uuid.uuid4().hex + uuid.uuid4().hex


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


async def create_session(user_id: str) -> str:
    token = make_session_token()
    await db.user_sessions.insert_one({
        "session_token": token,
        "user_id": user_id,
        "created_at": now_utc(),
        "expires_at": now_utc() + timedelta(days=7),
    })
    return token


async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1].strip()
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now_utc():
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ----------------------------- Models -----------------------------
class RegisterInput(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "athlete"  # athlete | trainer


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class SessionInput(BaseModel):
    session_id: str


class ProfileInput(BaseModel):
    name: str
    age: int
    sex: str  # male | female
    sport: str
    weight_category: Optional[str] = None
    surgery_type: str
    time_since_surgery_weeks: int
    dominant_arm: str  # left | right
    operated_arm: str  # left | right


class SideValue(BaseModel):
    operated: float = 0
    healthy: float = 0


class AssessmentInput(BaseModel):
    profile_id: str
    # Block 1 - Psychology (SIRSI 12 questions 0-100)
    sirsi: List[float] = Field(default_factory=list)
    # Block 2 - ROM & Apprehension
    rom_flexion: SideValue = Field(default_factory=SideValue)
    rom_abduction: SideValue = Field(default_factory=SideValue)
    rom_external_rotation: SideValue = Field(default_factory=SideValue)
    rom_internal_rotation: SideValue = Field(default_factory=SideValue)
    apprehension_fear: bool = False
    # Block 3 - Strength LSI
    ash_i: SideValue = Field(default_factory=SideValue)
    ash_y: SideValue = Field(default_factory=SideValue)
    ash_t: SideValue = Field(default_factory=SideValue)
    dyn_er: SideValue = Field(default_factory=SideValue)
    dyn_ir: SideValue = Field(default_factory=SideValue)
    # Block 4 - Functional / Plyometric
    ckcuest: SideValue = Field(default_factory=SideValue)
    ybt: SideValue = Field(default_factory=SideValue)
    mbt: SideValue = Field(default_factory=SideValue)
    # Block 5 - Sport specific (0-100 subjective)
    breakfall: float = 0
    static_push_pull: float = 0
    sparring: float = 0


# ----------------------------- Scoring Engine -----------------------------
def lsi(v: Dict[str, float]) -> float:
    """Limb Symmetry Index (operated / healthy) * 100, floored at 0."""
    op = float(v.get("operated", 0) or 0)
    he = float(v.get("healthy", 0) or 0)
    if he <= 0:
        return 0.0
    return max(0.0, (op / he) * 100.0)


def clamp(x: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, x))


def compute_scores(a: AssessmentInput) -> Dict[str, Any]:
    d = a.dict()

    # Block 1: Psychology
    sirsi_vals = a.sirsi if a.sirsi else []
    sirsi_score = clamp(sum(sirsi_vals) / len(sirsi_vals)) if sirsi_vals else 0.0

    # Block 2: ROM
    rom_items = {
        "Сгибание": lsi(d["rom_flexion"]),
        "Отведение": lsi(d["rom_abduction"]),
        "Наружная ротация": lsi(d["rom_external_rotation"]),
        "Внутренняя ротация": lsi(d["rom_internal_rotation"]),
    }
    rom_avg = sum(min(100.0, v) for v in rom_items.values()) / len(rom_items)
    apprehension_penalty = 25.0 if a.apprehension_fear else 0.0
    rom_score = clamp(rom_avg - apprehension_penalty)

    # Block 3: Strength LSI
    strength_items = {
        "ASH позиция I": lsi(d["ash_i"]),
        "ASH позиция Y": lsi(d["ash_y"]),
        "ASH позиция T": lsi(d["ash_t"]),
        "Наружная ротация (сила)": lsi(d["dyn_er"]),
        "Внутренняя ротация (сила)": lsi(d["dyn_ir"]),
    }
    strength_score = clamp(sum(min(100.0, v) for v in strength_items.values()) / len(strength_items))

    def er_ir_ratio(side: str) -> Optional[float]:
        er = float(d["dyn_er"].get(side, 0) or 0)
        ir = float(d["dyn_ir"].get(side, 0) or 0)
        if ir <= 0:
            return None
        return round(er / ir, 2)

    # Block 4: Functional
    ckcuest_lsi = lsi(d["ckcuest"])
    ybt_lsi = lsi(d["ybt"])
    mbt_lsi = lsi(d["mbt"])
    stability_score = clamp((min(100.0, ckcuest_lsi) + min(100.0, ybt_lsi)) / 2)
    power_score = clamp(min(100.0, mbt_lsi))
    functional_score = clamp((stability_score + power_score) / 2)

    functional_items = {
        "CKCUEST (стабильность)": ckcuest_lsi,
        "Y-Balance Test": ybt_lsi,
        "Бросок мяча (мощность)": mbt_lsi,
    }

    # Block 5: Sport specific
    sport_vals = [a.breakfall, a.static_push_pull, a.sparring]
    sport_score = clamp(sum(sport_vals) / len(sport_vals))
    sport_items = {
        "Амортизация падения (Укэми)": clamp(a.breakfall),
        "Статическая тяга/толчок": clamp(a.static_push_pull),
        "Контролируемый спарринг": clamp(a.sparring),
    }

    # Final RTS Score
    rts = (0.15 * sirsi_score + 0.15 * rom_score + 0.25 * strength_score +
           0.25 * functional_score + 0.20 * sport_score)
    rts = round(clamp(rts), 1)

    if rts >= 90:
        zone = "green"
    elif rts >= 75:
        zone = "yellow"
    else:
        zone = "red"

    radar = [
        {"axis": "Психология", "value": round(sirsi_score, 1)},
        {"axis": "Мобильность", "value": round(rom_score, 1)},
        {"axis": "Сила", "value": round(strength_score, 1)},
        {"axis": "Стабильность", "value": round(stability_score, 1)},
        {"axis": "Мощность", "value": round(power_score, 1)},
    ]

    # Weak links: LSI < 90%
    weak_links = []
    all_lsi = {}
    all_lsi.update(rom_items)
    all_lsi.update(strength_items)
    all_lsi.update(functional_items)
    for name, val in all_lsi.items():
        if val < 90:
            weak_links.append({
                "name": name,
                "lsi": round(val, 0),
                "deficit": round(max(0, 100 - val), 0),
                "type": "lsi",
            })
    if a.apprehension_fear:
        weak_links.append({
            "name": "Apprehension / страх повторного вывиха",
            "lsi": None, "deficit": None, "type": "clinical",
        })
    for name, val in sport_items.items():
        if val < 80:
            weak_links.append({
                "name": name, "lsi": round(val, 0),
                "deficit": round(max(0, 100 - val), 0), "type": "sport",
            })
    if sirsi_score < 75:
        weak_links.append({
            "name": "Низкая психологическая уверенность (SIRSI)",
            "lsi": round(sirsi_score, 0),
            "deficit": round(max(0, 100 - sirsi_score), 0), "type": "psych",
        })
    weak_links.sort(key=lambda x: (x["deficit"] if x["deficit"] is not None else 100), reverse=True)

    return {
        "rts_score": rts,
        "zone": zone,
        "components": {
            "psychology": round(sirsi_score, 1),
            "rom": round(rom_score, 1),
            "strength_lsi": round(strength_score, 1),
            "functional_lsi": round(functional_score, 1),
            "stability": round(stability_score, 1),
            "power": round(power_score, 1),
            "sport_specific": round(sport_score, 1),
        },
        "er_ir_ratio": {
            "operated": er_ir_ratio("operated"),
            "healthy": er_ir_ratio("healthy"),
        },
        "radar": radar,
        "weak_links": weak_links,
        "detail_lsi": {k: round(v, 0) for k, v in all_lsi.items()},
    }


# ----------------------------- AI Roadmap -----------------------------
async def generate_roadmap(profile: Dict[str, Any], scores: Dict[str, Any]) -> Dict[str, Any]:
    fallback = {
        "summary": "Продолжайте структурированную реабилитацию, фокусируясь на выявленных слабых звеньях. Обязательно согласуйте нагрузку с лечащим врачом.",
        "exercises": [
            {"title": "Изометрическая наружная ротация", "description": "3 подхода по 5 удержаний по 5 сек с эластичной лентой, локоть прижат к корпусу.", "target": "Сила наружной ротации"},
            {"title": "CKCUEST-прогрессия в планке", "description": "Касания плеч в планке, 3 подхода по 20 сек, контролируемый темп.", "target": "Динамическая стабильность"},
            {"title": "Ритмическая стабилизация I/Y/T", "description": "3 подхода по 30 сек в позициях I/Y/T для нейромышечного контроля.", "target": "Проприоцепция плеча"},
        ],
        "retest_weeks": 3,
        "retest_date": (now_utc() + timedelta(weeks=3)).strftime("%d.%m.%Y"),
        "ai_generated": False,
    }
    if not EMERGENT_LLM_KEY:
        return fallback

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage

        weak = ", ".join(
            [f"{w['name']} (дефицит {w['deficit']}%)" if w.get("deficit") is not None else w["name"]
             for w in scores["weak_links"]]
        ) or "выраженных дефицитов нет"

        system = (
            "Ты — ведущий спортивный реабилитолог и ортопедический хирург. "
            "Формируешь короткий научно обоснованный план реабилитации плеча на 2-4 недели. "
            "Отвечай СТРОГО в формате JSON без markdown, без пояснений вне JSON. "
            "Структура: {\"summary\": string (2-3 предложения, мотивирующе но клинически строго), "
            "\"exercises\": [{\"title\": string, \"description\": string (подходы/повторы/частота), \"target\": string}] (ровно 3 упражнения, нацеленных на слабые звенья), "
            "\"retest_weeks\": number (2, 3 или 4)}. Пиши на русском языке."
        )
        prompt = (
            f"Профиль атлета: спорт {profile.get('sport')}, операция {profile.get('surgery_type')}, "
            f"{profile.get('time_since_surgery_weeks')} недель после операции, оперированная рука {profile.get('operated_arm')}.\n"
            f"Итоговый RTS Score: {scores['rts_score']}% (зона {scores['zone']}).\n"
            f"Компоненты: психология {scores['components']['psychology']}%, мобильность {scores['components']['rom']}%, "
            f"сила LSI {scores['components']['strength_lsi']}%, функц. LSI {scores['components']['functional_lsi']}%, "
            f"спец.блок {scores['components']['sport_specific']}%.\n"
            f"Слабые звенья: {weak}.\n"
            "Составь план из ровно 3 упражнений для устранения главных дефицитов и порекомендуй срок ретеста (2-4 недели)."
        )
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=new_id("rts"),
                       system_message=system).with_model("openai", "gpt-5.4")
        resp = await chat.send_message(UserMessage(text=prompt))

        import json, re
        text = resp if isinstance(resp, str) else str(resp)
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            data = json.loads(match.group(0))
            weeks = int(data.get("retest_weeks", 3))
            weeks = weeks if weeks in (2, 3, 4) else 3
            exercises = data.get("exercises", [])[:3]
            if exercises and data.get("summary"):
                return {
                    "summary": data["summary"],
                    "exercises": exercises,
                    "retest_weeks": weeks,
                    "retest_date": (now_utc() + timedelta(weeks=weeks)).strftime("%d.%m.%Y"),
                    "ai_generated": True,
                }
    except Exception as e:
        logger.warning(f"AI roadmap generation failed: {e}")
    return fallback


# ----------------------------- Auth Routes -----------------------------
def _public_user(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user.get("role", "athlete"),
        "picture": user.get("picture"),
    }


@api_router.post("/auth/register")
async def register(inp: RegisterInput):
    existing = await db.users.find_one({"email": inp.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
    user_id = new_id("user")
    role = inp.role if inp.role in ("athlete", "trainer") else "athlete"
    user_doc = {
        "user_id": user_id,
        "email": inp.email.lower(),
        "name": inp.name,
        "role": role,
        "password_hash": hash_password(inp.password),
        "picture": None,
        "auth_provider": "email",
        "created_at": now_utc(),
    }
    await db.users.insert_one(user_doc)
    token = await create_session(user_id)
    return {"session_token": token, "user": _public_user(user_doc)}


@api_router.post("/auth/login")
async def login(inp: LoginInput):
    user = await db.users.find_one({"email": inp.email.lower()})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    if not verify_password(inp.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    token = await create_session(user["user_id"])
    return {"session_token": token, "user": _public_user(user)}


@api_router.post("/auth/session")
async def auth_session(inp: SessionInput):
    async with httpx.AsyncClient(timeout=15) as http:
        r = await http.get(EMERGENT_AUTH_URL, headers={"X-Session-ID": inp.session_id})
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = r.json()
    email = (data.get("email") or "").lower()
    name = data.get("name") or email.split("@")[0]
    picture = data.get("picture")

    user = await db.users.find_one({"email": email})
    if user:
        user_id = user["user_id"]
    else:
        user_id = new_id("user")
        user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "role": "athlete",
            "password_hash": None,
            "picture": picture,
            "auth_provider": "google",
            "created_at": now_utc(),
        }
        await db.users.insert_one(user)

    token = await create_session(user_id)
    return {"session_token": token, "user": _public_user(user)}


@api_router.get("/auth/me")
async def me(user: Dict[str, Any] = Depends(get_current_user)):
    return {"user": _public_user(user)}


@api_router.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        await db.user_sessions.delete_one({"session_token": token})
    return {"ok": True}


class RoleInput(BaseModel):
    role: str


@api_router.put("/auth/role")
async def set_role(inp: RoleInput, user: Dict[str, Any] = Depends(get_current_user)):
    role = inp.role if inp.role in ("athlete", "trainer") else "athlete"
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"role": role}})
    user["role"] = role
    return {"user": _public_user(user)}


# ----------------------------- Profile Routes -----------------------------
@api_router.get("/profiles")
async def list_profiles(user: Dict[str, Any] = Depends(get_current_user)):
    profiles = await db.profiles.find({"owner_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    for p in profiles:
        latest = await db.assessments.find_one(
            {"profile_id": p["profile_id"]}, {"_id": 0}, sort=[("created_at", -1)])
        p["latest_rts"] = latest["rts_score"] if latest else None
        p["latest_zone"] = latest["zone"] if latest else None
        p["assessment_count"] = await db.assessments.count_documents({"profile_id": p["profile_id"]})
        if isinstance(p.get("created_at"), datetime):
            p["created_at"] = p["created_at"].isoformat()
    return {"profiles": profiles}


@api_router.post("/profiles")
async def create_profile(inp: ProfileInput, user: Dict[str, Any] = Depends(get_current_user)):
    profile_id = new_id("prof")
    doc = inp.dict()
    doc.update({
        "profile_id": profile_id,
        "owner_id": user["user_id"],
        "created_at": now_utc(),
    })
    await db.profiles.insert_one(dict(doc))
    doc.pop("_id", None)
    doc["created_at"] = doc["created_at"].isoformat()
    return {"profile": doc}


@api_router.get("/profiles/{profile_id}")
async def get_profile(profile_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    p = await db.profiles.find_one({"profile_id": profile_id, "owner_id": user["user_id"]}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Профиль не найден")
    if isinstance(p.get("created_at"), datetime):
        p["created_at"] = p["created_at"].isoformat()
    return {"profile": p}


@api_router.delete("/profiles/{profile_id}")
async def delete_profile(profile_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    res = await db.profiles.delete_one({"profile_id": profile_id, "owner_id": user["user_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Профиль не найден")
    await db.assessments.delete_many({"profile_id": profile_id})
    return {"ok": True}


# ----------------------------- Assessment Routes -----------------------------
@api_router.post("/assessments")
async def create_assessment(inp: AssessmentInput, user: Dict[str, Any] = Depends(get_current_user)):
    profile = await db.profiles.find_one({"profile_id": inp.profile_id, "owner_id": user["user_id"]}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Профиль не найден")

    scores = compute_scores(inp)
    roadmap = await generate_roadmap(profile, scores)

    assessment_id = new_id("asmt")
    doc = {
        "assessment_id": assessment_id,
        "profile_id": inp.profile_id,
        "owner_id": user["user_id"],
        "profile_name": profile.get("name"),
        "sport": profile.get("sport"),
        "raw": inp.dict(),
        "rts_score": scores["rts_score"],
        "zone": scores["zone"],
        "components": scores["components"],
        "er_ir_ratio": scores["er_ir_ratio"],
        "radar": scores["radar"],
        "weak_links": scores["weak_links"],
        "detail_lsi": scores["detail_lsi"],
        "roadmap": roadmap,
        "created_at": now_utc(),
    }
    await db.assessments.insert_one(dict(doc))
    doc.pop("_id", None)
    doc["created_at"] = doc["created_at"].isoformat()
    return {"assessment": doc}


@api_router.get("/assessments")
async def list_assessments(profile_id: Optional[str] = None, user: Dict[str, Any] = Depends(get_current_user)):
    q = {"owner_id": user["user_id"]}
    if profile_id:
        q["profile_id"] = profile_id
    items = await db.assessments.find(q, {"_id": 0, "raw": 0, "roadmap": 0}).sort("created_at", -1).to_list(500)
    for it in items:
        if isinstance(it.get("created_at"), datetime):
            it["created_at"] = it["created_at"].isoformat()
    return {"assessments": items}


@api_router.get("/assessments/{assessment_id}")
async def get_assessment(assessment_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    it = await db.assessments.find_one({"assessment_id": assessment_id, "owner_id": user["user_id"]}, {"_id": 0})
    if not it:
        raise HTTPException(status_code=404, detail="Оценка не найдена")
    if isinstance(it.get("created_at"), datetime):
        it["created_at"] = it["created_at"].isoformat()
    return {"assessment": it}


@api_router.delete("/assessments/{assessment_id}")
async def delete_assessment(assessment_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    res = await db.assessments.delete_one({"assessment_id": assessment_id, "owner_id": user["user_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Оценка не найдена")
    return {"ok": True}


@api_router.get("/")
async def root():
    return {"message": "ShoulderReady RTS API"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.user_sessions.create_index("user_id")
    await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
    await db.profiles.create_index("owner_id")
    await db.assessments.create_index("owner_id")
    await db.assessments.create_index("profile_id")
    logger.info("Indexes ready")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

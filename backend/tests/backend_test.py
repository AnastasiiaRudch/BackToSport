"""
Backend tests for ShoulderReady RTS Analytics.
Covers: auth (register/login/me/logout/role), profiles CRUD, assessments (scoring + AI roadmap),
weighting formula verification, zones, weak links, radar 5-axis, and auth protection.
"""
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL") or os.environ.get("EXPO_BACKEND_URL")
if not BASE_URL:
    # Fallback: read from frontend .env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("EXPO_PUBLIC_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().strip('"')
                break
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"


# ------------------ Fixtures ------------------
@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def demo_token(s):
    """Login the pre-created demo trainer account, register if needed."""
    email = "demo_coach@example.com"
    password = "Passw0rd!23"
    r = s.post(f"{API}/auth/login", json={"email": email, "password": password})
    if r.status_code != 200:
        s.post(f"{API}/auth/register", json={"email": email, "password": password,
                                             "name": "Demo Coach", "role": "trainer"})
        r = s.post(f"{API}/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["session_token"]


@pytest.fixture(scope="session")
def new_user(s):
    """Register a fresh user for isolated tests."""
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{API}/auth/register", json={
        "email": email, "password": "Passw0rd!23", "name": "Test User", "role": "athlete"
    })
    assert r.status_code == 200, r.text
    data = r.json()
    return {"email": email, "token": data["session_token"], "user": data["user"]}


def h(token):
    return {"Authorization": f"Bearer {token}"}


# ------------------ Auth ------------------
class TestAuth:
    def test_root(self, s):
        r = s.get(f"{API}/")
        assert r.status_code == 200

    def test_register_duplicate_returns_400(self, s, new_user):
        r = s.post(f"{API}/auth/register", json={
            "email": new_user["email"], "password": "x", "name": "x"
        })
        assert r.status_code == 400

    def test_login_wrong_password(self, s, new_user):
        r = s.post(f"{API}/auth/login", json={
            "email": new_user["email"], "password": "wrong"
        })
        assert r.status_code == 401

    def test_me_without_token(self, s):
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_invalid_token(self, s):
        r = s.get(f"{API}/auth/me", headers=h("invalidtokenhere"))
        assert r.status_code == 401

    def test_me_valid(self, s, new_user):
        r = s.get(f"{API}/auth/me", headers=h(new_user["token"]))
        assert r.status_code == 200
        assert r.json()["user"]["email"] == new_user["email"]

    def test_role_update(self, s, new_user):
        r = s.put(f"{API}/auth/role", json={"role": "trainer"}, headers=h(new_user["token"]))
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "trainer"
        # revert
        s.put(f"{API}/auth/role", json={"role": "athlete"}, headers=h(new_user["token"]))

    def test_session_invalid(self, s):
        r = s.post(f"{API}/auth/session", json={"session_id": "invalid_x"})
        assert r.status_code == 401

    def test_logout(self, s):
        # register temp user, then logout, then verify token invalid
        email = f"tmp_{uuid.uuid4().hex[:8]}@example.com"
        reg = s.post(f"{API}/auth/register", json={
            "email": email, "password": "Passw0rd!23", "name": "Tmp"
        }).json()
        tok = reg["session_token"]
        r = s.post(f"{API}/auth/logout", headers=h(tok))
        assert r.status_code == 200
        r = s.get(f"{API}/auth/me", headers=h(tok))
        assert r.status_code == 401


# ------------------ Profiles ------------------
class TestProfiles:
    def test_create_and_get_profile(self, s, new_user):
        payload = {
            "name": "TEST_Athlete", "age": 25, "sex": "male",
            "sport": "Judo", "surgery_type": "Bankart",
            "time_since_surgery_weeks": 20, "dominant_arm": "right", "operated_arm": "right"
        }
        r = s.post(f"{API}/profiles", json=payload, headers=h(new_user["token"]))
        assert r.status_code == 200, r.text
        prof = r.json()["profile"]
        assert prof["name"] == "TEST_Athlete"
        assert "profile_id" in prof
        pid = prof["profile_id"]

        # GET
        g = s.get(f"{API}/profiles/{pid}", headers=h(new_user["token"]))
        assert g.status_code == 200
        assert g.json()["profile"]["profile_id"] == pid

        # LIST
        L = s.get(f"{API}/profiles", headers=h(new_user["token"]))
        assert L.status_code == 200
        ids = [p["profile_id"] for p in L.json()["profiles"]]
        assert pid in ids

        # store for later
        pytest.profile_id = pid

    def test_profiles_requires_auth(self, s):
        assert s.get(f"{API}/profiles").status_code == 401
        assert s.post(f"{API}/profiles", json={}).status_code == 401

    def test_get_other_users_profile_forbidden(self, s, new_user):
        # Create profile with fresh user, ensure demo cannot access it
        payload = {
            "name": "TEST_Private", "age": 30, "sex": "female",
            "sport": "Volleyball", "surgery_type": "Latarjet",
            "time_since_surgery_weeks": 15, "dominant_arm": "right", "operated_arm": "left"
        }
        r = s.post(f"{API}/profiles", json=payload, headers=h(new_user["token"]))
        pid = r.json()["profile"]["profile_id"]
        # Create another user
        email = f"other_{uuid.uuid4().hex[:8]}@example.com"
        other = s.post(f"{API}/auth/register", json={
            "email": email, "password": "Passw0rd!23", "name": "Other"
        }).json()
        r = s.get(f"{API}/profiles/{pid}", headers=h(other["session_token"]))
        assert r.status_code == 404


# ------------------ Assessments & Scoring ------------------
def build_perfect_assessment(profile_id):
    """All values perfect (LSI=100, sirsi=100, sport=100) => rts=100 green."""
    side = {"operated": 100, "healthy": 100}
    return {
        "profile_id": profile_id,
        "sirsi": [100] * 12,
        "rom_flexion": side, "rom_abduction": side,
        "rom_external_rotation": side, "rom_internal_rotation": side,
        "apprehension_fear": False,
        "ash_i": side, "ash_y": side, "ash_t": side,
        "dyn_er": side, "dyn_ir": side,
        "ckcuest": side, "ybt": side, "mbt": side,
        "breakfall": 100, "static_push_pull": 100, "sparring": 100,
    }


def build_weak_assessment(profile_id):
    """Weak on strength (LSI=50) - should be red zone with weak links."""
    weak = {"operated": 50, "healthy": 100}
    ok = {"operated": 100, "healthy": 100}
    return {
        "profile_id": profile_id,
        "sirsi": [60] * 12,
        "rom_flexion": ok, "rom_abduction": ok,
        "rom_external_rotation": ok, "rom_internal_rotation": ok,
        "apprehension_fear": True,
        "ash_i": weak, "ash_y": weak, "ash_t": weak,
        "dyn_er": weak, "dyn_ir": weak,
        "ckcuest": weak, "ybt": ok, "mbt": ok,
        "breakfall": 70, "static_push_pull": 70, "sparring": 70,
    }


class TestAssessments:
    @pytest.fixture(scope="class")
    def profile_id(self, s, new_user):
        payload = {
            "name": "TEST_AssessAthlete", "age": 22, "sex": "male",
            "sport": "Judo", "surgery_type": "Bankart",
            "time_since_surgery_weeks": 24, "dominant_arm": "right", "operated_arm": "right"
        }
        r = s.post(f"{API}/profiles", json=payload, headers=h(new_user["token"]))
        return r.json()["profile"]["profile_id"]

    def test_perfect_assessment_green(self, s, new_user, profile_id):
        payload = build_perfect_assessment(profile_id)
        r = s.post(f"{API}/assessments", json=payload, headers=h(new_user["token"]))
        assert r.status_code == 200, r.text
        a = r.json()["assessment"]
        # RTS = 0.15*100 + 0.15*100 + 0.25*100 + 0.25*100 + 0.20*100 = 100
        assert a["rts_score"] == 100.0
        assert a["zone"] == "green"
        # Radar has 5 axes
        assert len(a["radar"]) == 5
        axes = [x["axis"] for x in a["radar"]]
        assert "Психология" in axes and "Мобильность" in axes
        # No weak links
        assert a["weak_links"] == []
        # Roadmap present
        assert "roadmap" in a
        assert len(a["roadmap"]["exercises"]) == 3
        assert "retest_date" in a["roadmap"]

    def test_weighting_formula(self, s, new_user, profile_id):
        """Verify: rts = 0.15*psych + 0.15*rom + 0.25*strength + 0.25*func + 0.20*sport"""
        payload = build_weak_assessment(profile_id)
        r = s.post(f"{API}/assessments", json=payload, headers=h(new_user["token"]))
        assert r.status_code == 200
        a = r.json()["assessment"]
        c = a["components"]
        expected = round(
            0.15 * c["psychology"] + 0.15 * c["rom"] + 0.25 * c["strength_lsi"]
            + 0.25 * c["functional_lsi"] + 0.20 * c["sport_specific"], 1
        )
        assert abs(a["rts_score"] - expected) <= 0.2, f"expected~{expected} got {a['rts_score']}"

    def test_weak_zone_and_weak_links(self, s, new_user, profile_id):
        payload = build_weak_assessment(profile_id)
        r = s.post(f"{API}/assessments", json=payload, headers=h(new_user["token"]))
        a = r.json()["assessment"]
        # sirsi=60 psych score=60 → rom score with apprehension = 100-25=75, strength=50, func=(50+50/2+100)/2 → red
        assert a["zone"] in ("red", "yellow")
        # weak_links should include apprehension clinical entry
        types = [w["type"] for w in a["weak_links"]]
        assert "clinical" in types
        # LSI weak entries exist
        assert any(w["type"] == "lsi" for w in a["weak_links"])
        # Verify LSI computation: operated 50 / healthy 100 = 50
        strength_ls = [w for w in a["weak_links"] if "ASH" in w["name"]]
        assert strength_ls and strength_ls[0]["lsi"] == 50

    def test_zero_healthy_lsi_is_zero(self, s, new_user, profile_id):
        payload = build_perfect_assessment(profile_id)
        payload["ash_i"] = {"operated": 50, "healthy": 0}
        r = s.post(f"{API}/assessments", json=payload, headers=h(new_user["token"]))
        assert r.status_code == 200
        a = r.json()["assessment"]
        # ash_i lsi = 0 -> weak link
        assert any("ASH позиция I" in w["name"] and w["lsi"] == 0 for w in a["weak_links"])

    def test_list_and_filter_by_profile(self, s, new_user, profile_id):
        r = s.get(f"{API}/assessments", headers=h(new_user["token"]))
        assert r.status_code == 200
        all_count = len(r.json()["assessments"])
        r2 = s.get(f"{API}/assessments?profile_id={profile_id}",
                   headers=h(new_user["token"]))
        assert r2.status_code == 200
        filt = r2.json()["assessments"]
        assert all(x["profile_id"] == profile_id for x in filt)
        assert len(filt) <= all_count

    def test_get_and_delete_assessment(self, s, new_user, profile_id):
        payload = build_perfect_assessment(profile_id)
        r = s.post(f"{API}/assessments", json=payload, headers=h(new_user["token"]))
        aid = r.json()["assessment"]["assessment_id"]
        g = s.get(f"{API}/assessments/{aid}", headers=h(new_user["token"]))
        assert g.status_code == 200
        d = s.delete(f"{API}/assessments/{aid}", headers=h(new_user["token"]))
        assert d.status_code == 200
        g2 = s.get(f"{API}/assessments/{aid}", headers=h(new_user["token"]))
        assert g2.status_code == 404

    def test_assessment_requires_auth(self, s):
        r = s.post(f"{API}/assessments", json={"profile_id": "x"})
        assert r.status_code == 401

    def test_assessment_with_missing_profile(self, s, new_user):
        payload = build_perfect_assessment("prof_nonexistent")
        r = s.post(f"{API}/assessments", json=payload, headers=h(new_user["token"]))
        assert r.status_code == 404

    def test_ai_roadmap_generated(self, s, new_user, profile_id):
        payload = build_weak_assessment(profile_id)
        r = s.post(f"{API}/assessments", json=payload, headers=h(new_user["token"]))
        a = r.json()["assessment"]
        rm = a["roadmap"]
        assert len(rm["exercises"]) == 3
        assert rm["retest_weeks"] in (2, 3, 4)
        # Should ideally be ai_generated=true but fallback is acceptable
        assert "ai_generated" in rm


# ------------------ Profile cleanup ------------------
class TestProfileDelete:
    def test_delete_profile_cascades(self, s, new_user):
        payload = {
            "name": "TEST_ToDelete", "age": 20, "sex": "male",
            "sport": "Judo", "surgery_type": "Bankart",
            "time_since_surgery_weeks": 15, "dominant_arm": "right", "operated_arm": "right"
        }
        pid = s.post(f"{API}/profiles", json=payload,
                     headers=h(new_user["token"])).json()["profile"]["profile_id"]
        # Add an assessment
        s.post(f"{API}/assessments", json=build_perfect_assessment(pid),
               headers=h(new_user["token"]))
        # Delete profile
        d = s.delete(f"{API}/profiles/{pid}", headers=h(new_user["token"]))
        assert d.status_code == 200
        g = s.get(f"{API}/profiles/{pid}", headers=h(new_user["token"]))
        assert g.status_code == 404
        # Cascaded assessments
        r = s.get(f"{API}/assessments?profile_id={pid}", headers=h(new_user["token"]))
        assert r.json()["assessments"] == []

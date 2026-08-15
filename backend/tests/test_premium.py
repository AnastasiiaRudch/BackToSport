"""
Premium feature tests for ShoulderReady RTS:
- PUT /api/auth/pro toggles is_pro and GET /api/auth/me reflects it
- POST /api/assessments/{id}/chat returns 403 for non-pro, 200 for pro
- GET /api/assessments/{id}/chat returns persisted history
- POST /api/assessments stores top-level retest_date; GET list contains retest_date
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL") or os.environ.get("EXPO_BACKEND_URL")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("EXPO_PUBLIC_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().strip('"')
                break
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"


def h(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def non_pro(s):
    email = f"nonpro_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{API}/auth/register", json={
        "email": email, "password": "Passw0rd!23", "name": "NonPro User", "role": "athlete"
    })
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["is_pro"] is False, "new user should default to is_pro=false"
    return {"email": email, "token": data["session_token"], "user": data["user"]}


@pytest.fixture(scope="module")
def profile_id(s, non_pro):
    payload = {
        "name": "TEST_PremProfile", "age": 25, "sex": "male",
        "sport": "Judo", "surgery_type": "Bankart",
        "time_since_surgery_weeks": 20, "dominant_arm": "right", "operated_arm": "right"
    }
    r = s.post(f"{API}/profiles", json=payload, headers=h(non_pro["token"]))
    assert r.status_code == 200, r.text
    return r.json()["profile"]["profile_id"]


@pytest.fixture(scope="module")
def assessment_id(s, non_pro, profile_id):
    side = {"operated": 80, "healthy": 100}
    payload = {
        "profile_id": profile_id,
        "sirsi": [70] * 12,
        "rom_flexion": side, "rom_abduction": side,
        "rom_external_rotation": side, "rom_internal_rotation": side,
        "apprehension_fear": False,
        "ash_i": side, "ash_y": side, "ash_t": side,
        "dyn_er": side, "dyn_ir": side,
        "ckcuest": side, "ybt": side, "mbt": side,
        "breakfall": 80, "static_push_pull": 80, "sparring": 80,
        "lang": "en",
    }
    r = s.post(f"{API}/assessments", json=payload, headers=h(non_pro["token"]))
    assert r.status_code == 200, r.text
    a = r.json()["assessment"]
    # Verify top-level retest_date persisted on new assessments
    assert "retest_date" in a and a["retest_date"], "retest_date should be present at top level"
    return a["assessment_id"]


# ------------------- Pro toggle -------------------
class TestProToggle:
    def test_new_user_default_not_pro(self, s, non_pro):
        r = s.get(f"{API}/auth/me", headers=h(non_pro["token"]))
        assert r.status_code == 200
        assert r.json()["user"]["is_pro"] is False

    def test_pro_toggle_on(self, s, non_pro):
        r = s.put(f"{API}/auth/pro", json={"is_pro": True}, headers=h(non_pro["token"]))
        assert r.status_code == 200
        assert r.json()["user"]["is_pro"] is True
        m = s.get(f"{API}/auth/me", headers=h(non_pro["token"]))
        assert m.json()["user"]["is_pro"] is True

    def test_pro_toggle_off(self, s, non_pro):
        r = s.put(f"{API}/auth/pro", json={"is_pro": False}, headers=h(non_pro["token"]))
        assert r.status_code == 200
        assert r.json()["user"]["is_pro"] is False
        m = s.get(f"{API}/auth/me", headers=h(non_pro["token"]))
        assert m.json()["user"]["is_pro"] is False

    def test_pro_requires_auth(self, s):
        r = s.put(f"{API}/auth/pro", json={"is_pro": True})
        assert r.status_code == 401


# ------------------- Chat gating -------------------
class TestChatGating:
    def test_post_chat_403_when_not_pro(self, s, non_pro, assessment_id):
        # Ensure user is NOT pro
        s.put(f"{API}/auth/pro", json={"is_pro": False}, headers=h(non_pro["token"]))
        r = s.post(f"{API}/assessments/{assessment_id}/chat",
                   json={"message": "Hi coach", "lang": "en"},
                   headers=h(non_pro["token"]))
        assert r.status_code == 403, r.text

    def test_get_chat_ok_when_not_pro_empty(self, s, non_pro, assessment_id):
        # GET is not gated by pro per current server code; should return empty history
        r = s.get(f"{API}/assessments/{assessment_id}/chat", headers=h(non_pro["token"]))
        assert r.status_code == 200
        assert isinstance(r.json().get("messages", None), list)

    def test_chat_requires_auth(self, s, assessment_id):
        r = s.post(f"{API}/assessments/{assessment_id}/chat",
                   json={"message": "hi", "lang": "en"})
        assert r.status_code == 401

    def test_chat_unknown_assessment_when_pro(self, s, non_pro):
        s.put(f"{API}/auth/pro", json={"is_pro": True}, headers=h(non_pro["token"]))
        r = s.post(f"{API}/assessments/asmt_doesnotexist/chat",
                   json={"message": "hi", "lang": "en"},
                   headers=h(non_pro["token"]))
        assert r.status_code == 404

    def test_post_chat_pro_returns_reply_and_persists(self, s, non_pro, assessment_id):
        # Activate pro
        r0 = s.put(f"{API}/auth/pro", json={"is_pro": True}, headers=h(non_pro["token"]))
        assert r0.status_code == 200 and r0.json()["user"]["is_pro"] is True

        r = s.post(f"{API}/assessments/{assessment_id}/chat",
                   json={"message": "What should I focus on this week?", "lang": "en"},
                   headers=h(non_pro["token"]), timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "messages" in data
        msgs = data["messages"]
        assert len(msgs) >= 2
        roles = [m["role"] for m in msgs]
        assert "user" in roles and "assistant" in roles
        last = msgs[-1]
        assert last["role"] == "assistant"
        assert isinstance(last["content"], str) and len(last["content"]) > 0

    def test_get_chat_returns_history(self, s, non_pro, assessment_id):
        r = s.get(f"{API}/assessments/{assessment_id}/chat", headers=h(non_pro["token"]))
        assert r.status_code == 200
        msgs = r.json()["messages"]
        assert len(msgs) >= 2
        # sorted chronologically
        assert msgs[0]["role"] == "user"
        assert any(m["role"] == "assistant" for m in msgs)


# ------------------- retest_date top-level -------------------
class TestRetestDate:
    def test_top_level_retest_date_on_create(self, s, non_pro, assessment_id):
        # We already asserted in fixture. Now GET single and confirm.
        r = s.get(f"{API}/assessments/{assessment_id}", headers=h(non_pro["token"]))
        assert r.status_code == 200
        a = r.json()["assessment"]
        assert a.get("retest_date"), "retest_date missing on GET assessment"

    def test_retest_date_in_list(self, s, non_pro, assessment_id):
        r = s.get(f"{API}/assessments", headers=h(non_pro["token"]))
        assert r.status_code == 200
        items = r.json()["assessments"]
        target = [x for x in items if x["assessment_id"] == assessment_id]
        assert target, "created assessment missing from list"
        assert target[0].get("retest_date"), "retest_date missing from list item"

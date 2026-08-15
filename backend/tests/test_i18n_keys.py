"""
Regression tests for i18n additions:
- radar items now expose stable `key` + `axis` + `value`
- weak_links items expose `key` + `name` + `deficit`
- POST /api/assessments accepts `lang` and AI summary is localized (en/he/ru)
- GET /api/assessments/{id} preserves the stored keys
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
def user():
    s = requests.Session()
    email = f"test_i18n_{uuid.uuid4().hex[:8]}@example.com"
    r = s.post(f"{API}/auth/register", json={
        "email": email, "password": "Passw0rd!23", "name": "I18N User"
    })
    assert r.status_code == 200, r.text
    return {"s": s, "token": r.json()["session_token"]}


@pytest.fixture(scope="module")
def profile_id(user):
    s = user["s"]
    r = s.post(f"{API}/profiles", json={
        "name": "TEST_I18N_Athlete", "age": 26, "sex": "male",
        "sport": "Judo", "surgery_type": "Bankart",
        "time_since_surgery_weeks": 20, "dominant_arm": "right", "operated_arm": "right"
    }, headers=h(user["token"]))
    assert r.status_code == 200, r.text
    return r.json()["profile"]["profile_id"]


def _weak_payload(pid, lang):
    weak = {"operated": 55, "healthy": 100}
    ok = {"operated": 100, "healthy": 100}
    return {
        "profile_id": pid,
        "sirsi": [65] * 12,
        "rom_flexion": ok, "rom_abduction": ok,
        "rom_external_rotation": ok, "rom_internal_rotation": ok,
        "apprehension_fear": True,
        "ash_i": weak, "ash_y": weak, "ash_t": weak,
        "dyn_er": weak, "dyn_ir": weak,
        "ckcuest": weak, "ybt": ok, "mbt": ok,
        "breakfall": 75, "static_push_pull": 75, "sparring": 75,
        "lang": lang,
    }


class TestRadarAndWeakKeys:
    """Radar items should have key/axis/value; weak_links should have key/name/deficit"""

    def test_radar_has_stable_keys(self, user, profile_id):
        r = user["s"].post(f"{API}/assessments",
                           json=_weak_payload(profile_id, "ru"),
                           headers=h(user["token"]))
        assert r.status_code == 200, r.text
        a = r.json()["assessment"]

        expected_keys = {"psychology", "mobility", "strength", "stability", "power"}
        radar_keys = {item["key"] for item in a["radar"]}
        assert radar_keys == expected_keys, f"radar keys mismatch: {radar_keys}"

        for item in a["radar"]:
            assert "axis" in item and isinstance(item["axis"], str) and item["axis"]
            assert "value" in item and isinstance(item["value"], (int, float))

    def test_weak_links_have_keys_and_deficit(self, user, profile_id):
        r = user["s"].post(f"{API}/assessments",
                           json=_weak_payload(profile_id, "ru"),
                           headers=h(user["token"]))
        a = r.json()["assessment"]
        assert len(a["weak_links"]) > 0
        for w in a["weak_links"]:
            assert "key" in w and isinstance(w["key"], str) and w["key"]
            assert "name" in w and isinstance(w["name"], str) and w["name"]
            assert "deficit" in w  # may be None only for clinical (apprehension)

        # LSI/sport/psych items must have numeric deficit
        for w in a["weak_links"]:
            if w["type"] in ("lsi", "sport", "psych"):
                assert w["deficit"] is not None
                assert 0 <= w["deficit"] <= 100

        # Apprehension key must be present (fear=True)
        assert any(w["key"] == "apprehension" for w in a["weak_links"])
        # Strength weak keys should include ash_i/ash_y/ash_t/er_str/ir_str
        keys = {w["key"] for w in a["weak_links"]}
        for k in ("ash_i", "ash_y", "ash_t", "er_str", "ir_str"):
            assert k in keys, f"missing weak key: {k}"

    def test_get_assessment_preserves_keys(self, user, profile_id):
        create = user["s"].post(f"{API}/assessments",
                                json=_weak_payload(profile_id, "ru"),
                                headers=h(user["token"]))
        aid = create.json()["assessment"]["assessment_id"]
        got = user["s"].get(f"{API}/assessments/{aid}", headers=h(user["token"]))
        assert got.status_code == 200
        a = got.json()["assessment"]
        assert all("key" in x for x in a["radar"])
        assert all("key" in w for w in a["weak_links"])


class TestLangParam:
    """POST /api/assessments with lang= should produce localized roadmap.summary"""

    def test_lang_en_english_summary(self, user, profile_id):
        r = user["s"].post(f"{API}/assessments",
                           json=_weak_payload(profile_id, "en"),
                           headers=h(user["token"]))
        assert r.status_code == 200
        rm = r.json()["assessment"]["roadmap"]
        assert "summary" in rm and rm["summary"]
        # English summary must contain at least one Latin letter and no Cyrillic
        assert any("a" <= ch.lower() <= "z" for ch in rm["summary"])
        assert not any("\u0400" <= ch <= "\u04FF" for ch in rm["summary"]), \
            f"English roadmap contains Cyrillic: {rm['summary']}"

    def test_lang_he_hebrew_summary(self, user, profile_id):
        r = user["s"].post(f"{API}/assessments",
                           json=_weak_payload(profile_id, "he"),
                           headers=h(user["token"]))
        assert r.status_code == 200
        rm = r.json()["assessment"]["roadmap"]
        assert "summary" in rm and rm["summary"]
        # Hebrew summary must contain at least one Hebrew character
        assert any("\u0590" <= ch <= "\u05FF" for ch in rm["summary"]), \
            f"Hebrew roadmap missing Hebrew chars: {rm['summary']}"

    def test_lang_ru_russian_summary(self, user, profile_id):
        r = user["s"].post(f"{API}/assessments",
                           json=_weak_payload(profile_id, "ru"),
                           headers=h(user["token"]))
        assert r.status_code == 200
        rm = r.json()["assessment"]["roadmap"]
        # Russian summary must contain Cyrillic
        assert any("\u0400" <= ch <= "\u04FF" for ch in rm["summary"]), \
            f"Russian roadmap missing Cyrillic: {rm['summary']}"

    def test_lang_default_still_works(self, user, profile_id):
        # Omit lang entirely - should default to ru and not break
        payload = _weak_payload(profile_id, "ru")
        payload.pop("lang", None)
        r = user["s"].post(f"{API}/assessments", json=payload, headers=h(user["token"]))
        assert r.status_code == 200
        assert "roadmap" in r.json()["assessment"]

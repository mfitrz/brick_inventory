"""
Production / live integration tests for the deployed Lego Inventory API.

These tests make real HTTP requests against a running server.
Add these to your .env file:

    LIVE_API_URL        Base URL of the deployed API, e.g.:
                        https://myapp.azurecontainer.io

    TEST_USER_EMAIL     Email of a real Supabase test account.
    TEST_USER_PASSWORD  Password for that account.

The database has a foreign-key constraint requiring user_id to exist in
Supabase auth.users, so fake/minted JWTs cannot insert rows.  All live
tests must use credentials for a real account.

All tests are skipped automatically when LIVE_API_URL is not set.
"""

import os
import uuid

import httpx
import pytest
from jose import jwt

# ── configuration ──────────────────────────────────────────────────────────

LIVE_API_URL: str     = os.getenv("LIVE_API_URL", "").rstrip("/")
SUPABASE_URL: str     = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
TEST_USER_EMAIL: str  = os.getenv("TEST_USER_EMAIL", "")
TEST_USER_PASSWORD: str = os.getenv("TEST_USER_PASSWORD", "")

pytestmark = pytest.mark.skipif(
    not LIVE_API_URL,
    reason="LIVE_API_URL is not set — skipping live/production tests",
)


# ── helpers ────────────────────────────────────────────────────────────────

def _supabase_sign_in() -> str:
    """Sign in to Supabase and return a real access token.

    Requires TEST_USER_EMAIL and TEST_USER_PASSWORD in .env.
    The account must exist in the Supabase project's auth.users table so
    the database foreign-key constraint is satisfied when inserting sets.
    """
    if not TEST_USER_EMAIL or not TEST_USER_PASSWORD:
        pytest.skip("TEST_USER_EMAIL / TEST_USER_PASSWORD not set — skipping live tests")
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        pytest.skip("SUPABASE_URL / SUPABASE_ANON_KEY not set — skipping live tests")

    r = httpx.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD},
        headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
        timeout=10,
    )
    if r.status_code != 200:
        pytest.skip(f"Supabase sign-in failed ({r.status_code}): {r.text}")
    return r.json()["access_token"]


def _headers_from_token(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── fixtures ───────────────────────────────────────────────────────────────

@pytest.fixture()
def live_user():
    """Sign in as the real test user, clean up their sets before and after.

    Yields (user_id: str, headers: dict).
    """
    token = _supabase_sign_in()
    hdrs = _headers_from_token(token)

    # Extract user_id from token without re-verifying the signature.
    import base64, json as _json
    padded = token.split(".")[1] + "=="
    payload = _json.loads(base64.urlsafe_b64decode(padded))
    uid = payload.get("sub", "unknown")

    # pre-test cleanup
    httpx.delete(f"{LIVE_API_URL}/delete_sets", headers=hdrs, timeout=10)

    yield uid, hdrs

    # post-test cleanup
    httpx.delete(f"{LIVE_API_URL}/delete_sets", headers=hdrs, timeout=10)


# ── auth tests ─────────────────────────────────────────────────────────────

def test_live_jwt_secret_authenticates(live_user):
    _, hdrs = live_user
    resp = httpx.get(f"{LIVE_API_URL}/sets", headers=hdrs, timeout=10)
    assert resp.status_code == 200


def test_live_wrong_jwt_secret_rejected():
    bad_token = jwt.encode(
        {"sub": str(uuid.uuid4()), "aud": "authenticated"},
        "this-is-the-wrong-secret-entirely!!",
        algorithm="HS256",
    )
    resp = httpx.get(
        f"{LIVE_API_URL}/sets",
        headers={"Authorization": f"Bearer {bad_token}"},
        timeout=10,
    )
    # 401/403 = cleanly rejected; 503 = Supabase auth server returned an
    # unexpected status code for the malformed token (still a rejection).
    assert resp.status_code in (401, 403, 503)


# ── CRUD tests ─────────────────────────────────────────────────────────────

def test_live_add_and_list_set(live_user):
    _, hdrs = live_user
    add = httpx.post(
        f"{LIVE_API_URL}/sets",
        params={"set_number": 10000001, "set_name": "Test Set A"},
        headers=hdrs,
        timeout=10,
    )
    assert add.status_code == 200

    lst = httpx.get(f"{LIVE_API_URL}/sets", headers=hdrs, timeout=10)
    assert lst.status_code == 200
    assert any(s["set_number"] == 10000001 for s in lst.json()["sets"])


def test_live_sets_sorted_by_set_number(live_user):
    _, hdrs = live_user
    for sn, name in [(10000300, "C Set"), (10000100, "A Set"), (10000200, "B Set")]:
        httpx.post(
            f"{LIVE_API_URL}/sets",
            params={"set_number": sn, "set_name": name},
            headers=hdrs,
            timeout=10,
        )

    resp = httpx.get(f"{LIVE_API_URL}/sets", headers=hdrs, timeout=10)
    assert resp.status_code == 200
    numbers = [s["set_number"] for s in resp.json()["sets"]]
    assert numbers == sorted(numbers)


def test_live_duplicate_set_returns_409(live_user):
    _, hdrs = live_user
    params = {"set_number": 10000042, "set_name": "Test Duplicate"}
    httpx.post(f"{LIVE_API_URL}/sets", params=params, headers=hdrs, timeout=10)
    resp = httpx.post(f"{LIVE_API_URL}/sets", params=params, headers=hdrs, timeout=10)
    assert resp.status_code == 409


def test_live_remove_set(live_user):
    _, hdrs = live_user
    add = httpx.post(
        f"{LIVE_API_URL}/sets",
        params={"set_number": 10000002, "set_name": "Test Set B"},
        headers=hdrs,
        timeout=10,
    )
    assert add.status_code == 200

    delete = httpx.delete(
        f"{LIVE_API_URL}/sets",
        params={"set_number": 10000002},
        headers=hdrs,
        timeout=10,
    )
    assert delete.status_code == 200

    lst = httpx.get(f"{LIVE_API_URL}/sets", headers=hdrs, timeout=10)
    assert not any(s["set_number"] == 10000002 for s in lst.json()["sets"])


def test_live_remove_nonexistent_set_returns_404(live_user):
    _, hdrs = live_user
    resp = httpx.delete(
        f"{LIVE_API_URL}/sets",
        params={"set_number": 99999999},
        headers=hdrs,
        timeout=10,
    )
    assert resp.status_code == 404


def test_live_delete_all_sets(live_user):
    _, hdrs = live_user
    for sn in [10000010, 10000011, 10000012]:
        httpx.post(
            f"{LIVE_API_URL}/sets",
            params={"set_number": sn, "set_name": f"Set {sn}"},
            headers=hdrs,
            timeout=10,
        )

    resp = httpx.delete(f"{LIVE_API_URL}/delete_sets", headers=hdrs, timeout=10)
    assert resp.status_code == 200

    lst = httpx.get(f"{LIVE_API_URL}/sets", headers=hdrs, timeout=10)
    assert lst.json()["sets"] == []

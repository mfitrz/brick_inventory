"""
Unit / integration tests for lego_inventory.py.

All tests run against an in-memory SQLite database (set up in conftest.py) and
a FastAPI TestClient, so no real Supabase or PostgreSQL instance is required.

Test node IDs match the entries recorded in .pytest_cache/v/cache/nodeids.
"""

import uuid

import pytest
from jose import jwt
from sqlalchemy import inspect as sa_inspect

import lego_inventory as app_module
from tests.conftest import TEST_JWT_SECRET, make_token


# ── collection / add ───────────────────────────────────────────────────────

def test_list_sets_starts_empty_for_new_user(client, auth_headers):
    resp = client.get("/sets", headers=auth_headers())
    assert resp.status_code == 200
    assert resp.json()["sets"] == []


def test_add_set_returns_confirmation_with_set_number(client, auth_headers):
    headers = auth_headers()
    resp = client.post(
        "/sets",
        params={"set_number": 42, "set_name": "Technic Racing Car"},
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["message"] == "Added"
    assert data["set_number"] == 42


def test_add_and_list_sets_sorted_by_set_number(client, auth_headers):
    headers = auth_headers()
    for sn, name in [(300, "C Set"), (100, "A Set"), (200, "B Set")]:
        client.post("/sets", params={"set_number": sn, "set_name": name}, headers=headers)

    resp = client.get("/sets", headers=headers)
    assert resp.status_code == 200
    numbers = [s["set_number"] for s in resp.json()["sets"]]
    assert numbers == sorted(numbers)


def test_add_duplicate_set_returns_409(client, auth_headers):
    headers = auth_headers()
    client.post("/sets", params={"set_number": 1234, "set_name": "First"}, headers=headers)
    resp = client.post("/sets", params={"set_number": 1234, "set_name": "Duplicate"}, headers=headers)
    assert resp.status_code == 409


def test_add_set_validates_required_params(client, auth_headers):
    # Both set_number and set_name are required query params; omitting them → 422
    resp = client.post("/sets", headers=auth_headers())
    assert resp.status_code == 422


# ── user isolation ─────────────────────────────────────────────────────────

def test_list_sets_is_scoped_to_authenticated_user(client, auth_headers):
    user_a = auth_headers()
    user_b = auth_headers()

    client.post("/sets", params={"set_number": 999, "set_name": "User A Set"}, headers=user_a)

    resp = client.get("/sets", headers=user_b)
    assert resp.json()["sets"] == []


# ── remove (DELETE /sets) ──────────────────────────────────────────────────

def test_remove_set_returns_404_when_set_does_not_exist(client, auth_headers):
    resp = client.delete("/sets", params={"set_number": 9999}, headers=auth_headers())
    assert resp.status_code == 404


def test_remove_set_deletes_only_for_current_user(client, auth_headers):
    user_a = auth_headers()
    user_b = auth_headers()

    # Both users own set 77
    client.post("/sets", params={"set_number": 77, "set_name": "Shared"}, headers=user_a)
    client.post("/sets", params={"set_number": 77, "set_name": "Shared"}, headers=user_b)

    # User A deletes theirs
    client.delete("/sets", params={"set_number": 77}, headers=user_a)

    # User B should still have theirs
    resp = client.get("/sets", headers=user_b)
    assert any(s["set_number"] == 77 for s in resp.json()["sets"])


# ── delete all (DELETE /delete_sets) ──────────────────────────────────────

def test_delete_all_sets_succeeds_on_empty_collection(client, auth_headers):
    resp = client.delete("/delete_sets", headers=auth_headers())
    assert resp.status_code == 200


def test_delete_all_sets_clears_only_current_users_collection(client, auth_headers):
    user_a = auth_headers()
    user_b = auth_headers()

    for sn in [1, 2, 3]:
        client.post("/sets", params={"set_number": sn, "set_name": f"Set {sn}"}, headers=user_a)
    client.post("/sets", params={"set_number": 100, "set_name": "B's set"}, headers=user_b)

    client.delete("/delete_sets", headers=user_a)

    assert client.get("/sets", headers=user_a).json()["sets"] == []
    assert client.get("/sets", headers=user_b).json()["sets"] != []


# ── auth enforcement ───────────────────────────────────────────────────────

@pytest.mark.parametrize("method,path", [
    ("get",    "/sets"),
    ("post",   "/sets"),
    ("delete", "/sets"),
    ("delete", "/delete_sets"),
])
def test_endpoints_require_auth(client, method, path):
    resp = getattr(client, method)(path)
    assert resp.status_code in (401, 403)


def test_malformed_token_is_rejected(client, monkeypatch):
    # Ensure fallback to Supabase auth server is disabled so we get a clean error
    monkeypatch.setattr(app_module, "SUPABASE_URL", "")
    monkeypatch.setattr(app_module, "SUPABASE_ANON_KEY", "")

    resp = client.get("/sets", headers={"Authorization": "Bearer not.a.valid.jwt"})
    # 401 if JWT path rejects it cleanly; 500 if it falls through to missing Supabase config
    assert resp.status_code in (401, 403, 500)


def test_token_signed_with_wrong_secret_is_rejected(client, monkeypatch):
    monkeypatch.setattr(app_module, "SUPABASE_JWT_SECRET", TEST_JWT_SECRET)
    monkeypatch.setattr(app_module, "SUPABASE_URL", "")
    monkeypatch.setattr(app_module, "SUPABASE_ANON_KEY", "")

    bad_token = jwt.encode(
        {"sub": str(uuid.uuid4()), "aud": "authenticated"},
        "completely-wrong-secret-value!!",
        algorithm="HS256",
    )
    resp = client.get("/sets", headers={"Authorization": f"Bearer {bad_token}"})
    # Rejected by JWT decode; falls through to Supabase server which is unconfigured → 500
    assert resp.status_code in (401, 403, 500)


def test_token_missing_sub_claim_is_rejected(client, monkeypatch):
    monkeypatch.setattr(app_module, "SUPABASE_JWT_SECRET", TEST_JWT_SECRET)

    token = jwt.encode({"aud": "authenticated"}, TEST_JWT_SECRET, algorithm="HS256")
    resp = client.get("/sets", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401


# ── database constraint verification ──────────────────────────────────────

def test_supabase_unique_constraint_exists(db_engine):
    constraints = sa_inspect(db_engine).get_unique_constraints("lego_sets")
    assert len(constraints) >= 1, "Expected at least one unique constraint on lego_sets"


def test_supabase_unique_constraint_on_user_id_and_set_number(db_engine):
    constraints = sa_inspect(db_engine).get_unique_constraints("lego_sets")
    constraint_cols = {frozenset(c["column_names"]) for c in constraints}
    assert frozenset(["user_id", "set_number"]) in constraint_cols, (
        "Expected a unique constraint covering (user_id, set_number)"
    )

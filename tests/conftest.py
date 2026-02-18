"""
Shared fixtures and helpers for all test modules.

The DATABASE_URL env var must be set before lego_inventory is imported so the
module-level create_engine() call picks up SQLite instead of PostgreSQL.  We do
that here, at import time of conftest, which pytest processes before any test
module is collected.
"""

import os
import uuid

import pytest
from dotenv import load_dotenv
from jose import jwt
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

# ── env setup (must happen before lego_inventory is imported) ──────────────
# Load .env so LIVE_API_URL, LIVE_JWT_SECRET, etc. are available without
# having to pass them on the command line every time.
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

# Force SQLite for all unit tests regardless of what DATABASE_URL is in .env.
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret-that-is-32-chars-long!!")
os.environ.setdefault("SUPABASE_URL", "")
os.environ.setdefault("SUPABASE_ANON_KEY", "")

import lego_inventory as app_module  # noqa: E402
from lego_inventory import app, Base  # noqa: E402

TEST_JWT_SECRET: str = os.environ["SUPABASE_JWT_SECRET"]


# ── JWT helpers ────────────────────────────────────────────────────────────

def make_token(user_id=None, secret: str = TEST_JWT_SECRET, extra_claims=None) -> str:
    uid = str(user_id) if user_id else str(uuid.uuid4())
    payload = {"sub": uid, "aud": "authenticated", **(extra_claims or {})}
    return jwt.encode(payload, secret, algorithm="HS256")


# ── fixtures ───────────────────────────────────────────────────────────────

@pytest.fixture()
def db_engine(monkeypatch):
    """Fresh in-memory SQLite database, wired into the app for the duration of one test."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    monkeypatch.setattr(app_module, "engine", engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture()
def client(db_engine):
    """TestClient backed by the isolated SQLite database."""
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


@pytest.fixture()
def auth_headers():
    """Return a callable that produces Authorization headers for an arbitrary user.

    Usage::

        def test_something(client, auth_headers):
            user_a = auth_headers()          # random user
            user_b = auth_headers()          # different random user
            specific = auth_headers(my_uid)  # deterministic user
    """
    def _make(user_id=None) -> dict:
        return {"Authorization": f"Bearer {make_token(user_id)}"}
    return _make

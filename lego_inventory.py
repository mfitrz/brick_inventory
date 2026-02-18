import uuid
from sqlalchemy import create_engine, select, delete, Uuid, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session
from sqlalchemy.exc import IntegrityError
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from dotenv import load_dotenv
import os
import json
from urllib import request, error as urlerror

# Always load .env from this file's directory so running uvicorn from a
# different working directory still picks up local configuration.
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

DATABASE_URL = os.getenv("DATABASE_URL", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

# --- Database Models ---

class Base(DeclarativeBase):
    pass

class LegoSet(Base):
    __tablename__ = "lego_sets"
    __table_args__ = (UniqueConstraint("user_id", "set_number"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid)
    set_number: Mapped[int] = mapped_column(index=True)
    name: Mapped[str]

class CannotRemoveError(Exception):
    pass

engine = create_engine(DATABASE_URL, echo=False)

# --- FastAPI App ---

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Auth ---

security = HTTPBearer()

def _verify_with_supabase_auth_server(token: str) -> uuid.UUID:
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=500,
            detail="Missing SUPABASE_URL or SUPABASE_ANON_KEY for token verification",
        )

    req = request.Request(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {token}",
        },
        method="GET",
    )

    try:
        with request.urlopen(req, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))
            user_id = payload.get("id")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token: no user ID")
            return uuid.UUID(user_id)
    except urlerror.HTTPError as e:
        if e.code in (401, 403):
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        raise HTTPException(status_code=503, detail="Auth verification service unavailable")
    except (ValueError, json.JSONDecodeError, urlerror.URLError):
        raise HTTPException(status_code=503, detail="Failed to verify token")


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> uuid.UUID:
    """Verify Supabase JWT and return the user UUID."""
    token = credentials.credentials

    # Fast path for legacy HS256 projects where JWT secret is configured.
    if SUPABASE_JWT_SECRET:
        try:
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token: no user ID")
            return uuid.UUID(user_id)
        except (JWTError, ValueError):
            # Fallback to auth server verification for projects using signing keys
            # or if JWT secret config is stale.
            pass

    return _verify_with_supabase_auth_server(token)

# --- Endpoints ---

@app.get("/sets")
def list_sets(user_id: uuid.UUID = Depends(get_current_user)):
    with Session(engine) as session:
        rows = (
            session.execute(
                select(LegoSet)
                .where(LegoSet.user_id == user_id)
                .order_by(LegoSet.set_number)
            )
            .scalars()
            .all()
        )
        return {
            "message": "Retrieved",
            "sets": [{"set_number": r.set_number, "name": r.name} for r in rows],
        }

@app.post("/sets")
def add_set(set_number: int, set_name: str, user_id: uuid.UUID = Depends(get_current_user)):
    with Session(engine) as session:
        try:
            new_set = LegoSet(user_id=user_id, set_number=set_number, name=set_name)
            session.add(new_set)
            session.commit()
            return {"message": "Added", "set_number": set_number}
        except IntegrityError:
            session.rollback()
            raise HTTPException(status_code=409, detail="Lego set already exists in collection.")

@app.delete("/sets")
def remove_set(set_number: int, user_id: uuid.UUID = Depends(get_current_user)):
    with Session(engine) as session:
        result = session.execute(
            delete(LegoSet)
            .where(LegoSet.set_number == set_number, LegoSet.user_id == user_id)
            .returning(LegoSet.set_number)
        )
        deleted = result.scalar_one_or_none()
        session.commit()

        if deleted is None:
            raise HTTPException(status_code=404, detail="Cannot remove provided set.")

        return {"message": "Deleted", "set_number": set_number}

@app.delete("/delete_sets")
def delete_all_sets(user_id: uuid.UUID = Depends(get_current_user)):
    with Session(engine) as session:
        session.execute(delete(LegoSet).where(LegoSet.user_id == user_id))
        session.commit()
        return {"message": "Deleted all sets"}

"""
Auth API Endpoints

Email/password registration and login for the dashboard.
Both return a JWT the dashboard sends as `Authorization: Bearer <token>`.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.db.models import UserDB
from app.core.auth import hash_password, verify_password, create_token, get_user_id
from app.models.auth import Credentials, UserResponse, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


def _token_response(user: UserDB) -> TokenResponse:
    return TokenResponse(access_token=create_token(user.id), user=UserResponse.model_validate(user))


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: Credentials, db: Session = Depends(get_db)):
    """Create an account and sign it in."""
    user = UserDB(email=body.email.lower(), password_hash=hash_password(body.password))
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email is already registered")
    db.refresh(user)
    return _token_response(user)


@router.post("/login", response_model=TokenResponse)
def login(body: Credentials, db: Session = Depends(get_db)):
    """Exchange email + password for a token."""
    user = db.query(UserDB).filter(UserDB.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return _token_response(user)


@router.get("/me", response_model=UserResponse)
def me(user_id: str = Depends(get_user_id), db: Session = Depends(get_db)):
    """Return the signed-in user (401 if the token's user no longer exists)."""
    user = db.get(UserDB, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

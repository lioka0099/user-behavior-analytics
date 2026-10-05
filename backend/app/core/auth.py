"""
Authentication utilities.

Dashboard accounts live in our own `users` table:
- passwords are hashed with scrypt (stdlib hashlib)
- sessions are HS256 JWTs signed with JWT_SECRET
"""

import hashlib
import hmac
import secrets
import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, Depends, Header
from app.core.config import JWT_SECRET

TOKEN_TTL = timedelta(days=7)

# scrypt cost parameters (~16 MB memory per hash)
SCRYPT_PARAMS = {"n": 2**14, "r": 8, "p": 1, "dklen": 32}


def hash_password(password: str) -> str:
    """Hash a password as `scrypt$<salt hex>$<digest hex>`."""
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, **SCRYPT_PARAMS)
    return f"scrypt${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Check a password against a hash produced by hash_password()."""
    _, salt_hex, digest_hex = stored_hash.split("$")
    digest = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt_hex), **SCRYPT_PARAMS)
    return hmac.compare_digest(digest, bytes.fromhex(digest_hex))


def create_token(user_id: str) -> str:
    """Issue a signed access token for a user."""
    expires_at = datetime.now(timezone.utc) + TOKEN_TTL
    return jwt.encode({"sub": user_id, "exp": expires_at}, JWT_SECRET, algorithm="HS256")


def get_current_user(
    authorization: Optional[str] = Header(None)
) -> dict:
    """
    FastAPI dependency to get the current authenticated user.

    Extracts the JWT from the Authorization header ("Bearer <token>") and
    returns its payload (user_id is in 'sub').
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header is required"
        )

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError("Invalid authorization scheme")
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Authorization header must be: Bearer <token>"
        )

    try:
        return jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"],
            options={"require": ["sub", "exp"]},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_user_id(user: dict = Depends(get_current_user)) -> str:
    """FastAPI dependency returning just the authenticated user's ID."""
    return user["sub"]

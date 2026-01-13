"""
Authentication utilities for Supabase JWT validation.

Validates JWT tokens from Supabase Auth and extracts user information.
"""

import jwt
from typing import Optional
from fastapi import HTTPException, Depends, Header
from functools import lru_cache
from app.core.config import SUPABASE_JWT_SECRET, SUPABASE_URL


@lru_cache(maxsize=1)
def get_supabase_jwt_secret() -> str:
    """
    Get Supabase JWT secret.
    
    Returns the JWT secret from environment variables.
    Cached to avoid repeated lookups.
    """
    if not SUPABASE_JWT_SECRET:
        raise ValueError(
            "SUPABASE_JWT_SECRET environment variable is required. "
            "Get it from Supabase Dashboard > Settings > API > JWT Secret"
        )
    return SUPABASE_JWT_SECRET


def verify_supabase_token(token: str) -> dict:
    """
    Verify a Supabase JWT token and return the payload.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded JWT payload (contains 'sub' which is the user_id)
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        secret = get_supabase_jwt_secret()
        
        # Decode and verify the token
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",  # Supabase uses this audience
        )
        
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}"
        )


def get_current_user(
    authorization: Optional[str] = Header(None)
) -> dict:
    """
    FastAPI dependency to get the current authenticated user.
    
    Extracts JWT token from Authorization header and validates it.
    
    Usage:
        @router.get("/protected")
        def protected_route(user: dict = Depends(get_current_user)):
            user_id = user["sub"]
            ...
    
    Args:
        authorization: Authorization header (format: "Bearer <token>")
        
    Returns:
        JWT payload containing user info (user_id is in 'sub' field)
        
    Raises:
        HTTPException: If token is missing or invalid
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header is required"
        )
    
    # Extract token from "Bearer <token>" format
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError("Invalid authorization scheme")
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Authorization header must be: Bearer <token>"
        )
    
    # Verify token and return payload
    payload = verify_supabase_token(token)
    return payload


def get_user_id(user: dict = Depends(get_current_user)) -> str:
    """
    FastAPI dependency to get just the user ID from the JWT token.
    
    Usage:
        @router.get("/protected")
        def protected_route(user_id: str = Depends(get_user_id)):
            ...
    
    Returns:
        User ID (UUID string from Supabase Auth)
    """
    return user["sub"]

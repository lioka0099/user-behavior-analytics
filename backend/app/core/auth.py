"""
Authentication utilities for Supabase JWT validation.

Validates JWT tokens from Supabase Auth and extracts user information.
"""

import inspect
import os
import ssl
import logging
import jwt
from jwt import PyJWKClient
from typing import Optional
from fastapi import HTTPException, Depends, Header
from functools import lru_cache
from app.core.config import SUPABASE_URL, SUPABASE_JWT_SECRET, SUPABASE_ANON_KEY

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_jwks_client() -> PyJWKClient:
    """
    Create a JWKS client for Supabase public keys.

    Supabase access tokens are signed with ES256/RS256.
    We validate them against the JWKS endpoint. Some Supabase projects
    require the anon key to be passed; we include it as a query param/header.
    """
    if not SUPABASE_URL:
        raise ValueError("SUPABASE_URL is required")

    base = SUPABASE_URL.rstrip("/")
    # Supabase JWKS endpoint (public signing keys for RS256/ES256)
    # Docs: /auth/v1/.well-known/jwks.json
    jwks_url = f"{base}/auth/v1/.well-known/jwks.json"
    if SUPABASE_ANON_KEY:
        # Some setups may require passing the anon key; harmless if not required.
        jwks_url = f"{jwks_url}?apikey={SUPABASE_ANON_KEY}"
        headers = {"apikey": SUPABASE_ANON_KEY}
    else:
        headers = None

    # macOS dev environments sometimes lack a usable system CA bundle, causing:
    # SSL: CERTIFICATE_VERIFY_FAILED when fetching the JWKS.
    # Prefer certifi's CA bundle when available.
    try:
        import certifi  # type: ignore

        # For urllib-based clients, SSL_CERT_FILE is respected.
        os.environ.setdefault("SSL_CERT_FILE", certifi.where())

        # Newer PyJWT versions accept ssl_context; use it when supported.
        sig = inspect.signature(PyJWKClient)
        if "ssl_context" in sig.parameters:
            ssl_context = ssl.create_default_context(cafile=certifi.where())
            return PyJWKClient(jwks_url, headers=headers, ssl_context=ssl_context)
    except Exception:
        # If certifi isn't installed or anything goes wrong, fall back to defaults.
        pass

    return PyJWKClient(jwks_url, headers=headers)


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
    # If neither JWKS (SUPABASE_URL) nor HS256 secret is configured, we can't verify anything.
    # This is typically a local dev misconfiguration, so fail loudly with an actionable message.
    if not SUPABASE_URL and not SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=500,
            detail=(
                "Backend auth is not configured. Set SUPABASE_URL (recommended) "
                "or SUPABASE_JWT_SECRET in the backend environment."
            ),
        )

    try:
        # Prefer JWKS validation (ES256/RS256)
        jwks_client = get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token).key

        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256", "ES256"],
            audience="authenticated",  # Supabase uses this audience
        )
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except Exception as jwks_error:
        # Fallback: if JWKS is unavailable but an HMAC secret is provided, try HS256
        if SUPABASE_JWT_SECRET:
            try:
                payload = jwt.decode(
                    token,
                    SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    audience="authenticated",
                )
                return payload
            except Exception:
                pass
        # If JWKS fetch/validation fails, don't leak internal SSL/network details to clients.
        logger.warning("Supabase token validation failed via JWKS/HS256 fallback: %s", jwks_error)
        raise HTTPException(status_code=401, detail="Invalid token")


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

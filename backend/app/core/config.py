"""
Application Configuration

Loads environment-driven configuration for the backend (LLM provider, OpenAI key,
and the secret used to sign login tokens).
"""

import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "mock")

# Secret used to sign dashboard login tokens (HS256). Fail fast rather than
# fall back to a guessable default.
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET is not set. Generate one with: "
        "python -c \"import secrets; print(secrets.token_urlsafe(32))\""
    )

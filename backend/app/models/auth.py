"""
Pydantic models for dashboard authentication.
"""

from pydantic import BaseModel, Field


class Credentials(BaseModel):
    """Request model for register/login."""
    email: str = Field(..., max_length=254, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(..., min_length=6, max_length=128)


class UserResponse(BaseModel):
    """Public user data."""
    id: str
    email: str

    class Config:
        from_attributes = True  # Allows conversion from SQLAlchemy models


class TokenResponse(BaseModel):
    """Returned after a successful register/login."""
    access_token: str
    user: UserResponse

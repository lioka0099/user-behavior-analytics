"""
Pydantic models for App management.

These models define the shape of data for API requests and responses.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AppCreate(BaseModel):
    """Request model for creating a new app."""
    name: str = Field(..., min_length=1, max_length=100, description="App name")
    description: Optional[str] = Field(None, max_length=500, description="Optional description")


class AppResponse(BaseModel):
    """Response model for app data."""
    id: str
    user_id: str
    api_key: str
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Allows conversion from SQLAlchemy models


class AppUpdate(BaseModel):
    """Request model for updating an app."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)


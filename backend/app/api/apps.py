"""
Apps API Endpoints

CRUD operations for user apps.
All endpoints require authentication via JWT token.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.core.auth import get_user_id
from app.models.app import AppCreate, AppUpdate, AppResponse
from app.storage.apps import (
    create_app,
    get_apps_by_user,
    get_app_by_id,
    update_app,
    delete_app,
    regenerate_api_key,
)

router = APIRouter(prefix="/apps", tags=["apps"])


@router.post("", response_model=AppResponse, status_code=201)
def create_app_endpoint(
    app_data: AppCreate,
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """
    Create a new app for the authenticated user.
    
    Requires: Bearer token in Authorization header
    """
    db_app = create_app(db, user_id, app_data)
    return AppResponse.model_validate(db_app)


@router.get("", response_model=List[AppResponse])
def list_apps_endpoint(
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """
    Get all apps belonging to the authenticated user.
    
    Requires: Bearer token in Authorization header
    """
    apps = get_apps_by_user(db, user_id)
    return [AppResponse.model_validate(app) for app in apps]


@router.get("/{app_id}", response_model=AppResponse)
def get_app_endpoint(
    app_id: str,
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """
    Get a specific app by ID (only if it belongs to the user).
    
    Requires: Bearer token in Authorization header
    """
    app = get_app_by_id(db, app_id, user_id)
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return AppResponse.model_validate(app)


@router.patch("/{app_id}", response_model=AppResponse)
def update_app_endpoint(
    app_id: str,
    app_data: AppUpdate,
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """
    Update an app's details (name, description).
    
    Requires: Bearer token in Authorization header
    """
    app = update_app(db, app_id, user_id, app_data)
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return AppResponse.model_validate(app)


@router.delete("/{app_id}", status_code=204)
def delete_app_endpoint(
    app_id: str,
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """
    Delete an app.
    
    Requires: Bearer token in Authorization header
    """
    success = delete_app(db, app_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="App not found")
    return None


@router.post("/{app_id}/regenerate-key", response_model=AppResponse)
def regenerate_api_key_endpoint(
    app_id: str,
    user_id: str = Depends(get_user_id),
    db: Session = Depends(get_db),
):
    """
    Generate a new API key for an app (useful if old key was compromised).
    
    Requires: Bearer token in Authorization header
    """
    app = regenerate_api_key(db, app_id, user_id)
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return AppResponse.model_validate(app)

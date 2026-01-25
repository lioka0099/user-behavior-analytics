"""
Storage functions for App CRUD operations.

Handles database interactions for the apps table.
"""

from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.db.models import AppDB
from app.models.app import AppCreate, AppUpdate


def generate_api_key() -> str:
    """Generate a unique API key in format: app_xxxxxxxx"""
    random_part = uuid.uuid4().hex[:8]
    return f"app_{random_part}"


def create_app(db: Session, user_id: str, app_data: AppCreate) -> AppDB:
    """
    Create a new app for a user.
    
    Args:
        db: Database session
        user_id: Supabase Auth user ID (UUID)
        app_data: App creation data (name, description)
    
    Returns:
        The created AppDB record
    """
    db_app = AppDB(
        user_id=user_id,
        api_key=generate_api_key(),
        name=app_data.name,
        description=app_data.description,
    )
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app


def get_apps_by_user(db: Session, user_id: str) -> List[AppDB]:
    """
    Get all apps belonging to a user.
    
    Args:
        db: Database session
        user_id: Supabase Auth user ID
    
    Returns:
        List of AppDB records
    """
    return db.query(AppDB).filter(AppDB.user_id == user_id).order_by(AppDB.created_at.desc()).all()


def get_app_by_id(db: Session, app_id: str, user_id: str) -> Optional[AppDB]:
    """
    Get a specific app by ID, ensuring it belongs to the user.
    
    Args:
        db: Database session
        app_id: The app's ID
        user_id: Supabase Auth user ID (for authorization check)
    
    Returns:
        AppDB record or None if not found/not authorized
    """
    return db.query(AppDB).filter(
        AppDB.id == app_id,
        AppDB.user_id == user_id
    ).first()


def update_app(db: Session, app_id: str, user_id: str, app_data: AppUpdate) -> Optional[AppDB]:
    """
    Update an app's details.
    
    Args:
        db: Database session
        app_id: The app's ID
        user_id: Supabase Auth user ID (for authorization)
        app_data: Fields to update
    
    Returns:
        Updated AppDB record or None if not found/not authorized
    """
    db_app = get_app_by_id(db, app_id, user_id)
    if not db_app:
        return None
    
    # Only update fields that were provided
    if app_data.name is not None:
        db_app.name = app_data.name
    if app_data.description is not None:
        db_app.description = app_data.description
    
    db.commit()
    db.refresh(db_app)
    return db_app


def delete_app(db: Session, app_id: str, user_id: str) -> bool:
    """
    Delete an app.
    
    Args:
        db: Database session
        app_id: The app's ID
        user_id: Supabase Auth user ID (for authorization)
    
    Returns:
        True if deleted, False if not found/not authorized
    """
    db_app = get_app_by_id(db, app_id, user_id)
    if not db_app:
        return False
    
    db.delete(db_app)
    db.commit()
    return True


def regenerate_api_key(db: Session, app_id: str, user_id: str) -> Optional[AppDB]:
    """
    Generate a new API key for an app.
    Useful if the old key was compromised.
    
    Args:
        db: Database session
        app_id: The app's ID
        user_id: Supabase Auth user ID (for authorization)
    
    Returns:
        Updated AppDB record with new API key, or None if not found
    """
    db_app = get_app_by_id(db, app_id, user_id)
    if not db_app:
        return None
    
    db_app.api_key = generate_api_key()
    db.commit()
    db.refresh(db_app)
    return db_app


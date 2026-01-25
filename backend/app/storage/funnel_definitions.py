"""
Funnel Definition Storage

Persistence helpers for `FunnelDefinitionDB` records (create/list).
The API layer uses these functions to manage saved funnel definitions.
"""

from sqlalchemy.orm import Session
from typing import List
from app.db.models import FunnelDefinitionDB


def save_funnel_definition(db: Session, definition: FunnelDefinitionDB):
    """Persist a new `FunnelDefinitionDB` record and return the refreshed object."""
    db.add(definition)
    db.commit()
    db.refresh(definition)
    return definition


def list_funnel_definitions(db: Session, api_key: str) -> List[FunnelDefinitionDB]:
    """List all funnel definitions belonging to an `api_key`."""
    return (
        db.query(FunnelDefinitionDB)
        .filter(FunnelDefinitionDB.api_key == api_key)
        .all()
    )

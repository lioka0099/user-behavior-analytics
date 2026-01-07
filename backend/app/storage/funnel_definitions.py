from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.models import FunnelDefinitionDB


def save_funnel_definition(db: Session, definition: FunnelDefinitionDB):
    db.add(definition)
    db.commit()
    db.refresh(definition)
    return definition


def list_funnel_definitions(db: Session, api_key: str) -> List[FunnelDefinitionDB]:
    return (
        db.query(FunnelDefinitionDB)
        .filter(FunnelDefinitionDB.api_key == api_key)
        .all()
    )

def get_funnel_definition(
    db: Session,
    api_key: str,
    definition_id: str
) -> Optional[FunnelDefinitionDB]:
    return (
        db.query(FunnelDefinitionDB)
        .filter(
            FunnelDefinitionDB.api_key == api_key,
            FunnelDefinitionDB.id == definition_id
        )
        .first()
    )

from typing import List
from sqlalchemy.orm import Session

from app.models.pydantic_models import Event
from app.db.models import EventDB


def save_events(db: Session, api_key: str,events: List[Event]) -> None:
    for event in events:
        db_event = EventDB(
            api_key= api_key,
            event_name=event.event_name,
            session_id=event.session_id,
            timestamp_ms=event.timestamp_ms,
            platform=event.platform,
            properties=event.properties,
        )
        db.add(db_event)

    db.commit()


def get_all_events(db: Session, api_key: str = None) -> List[Event]:
    """Get all events, optionally filtered by api_key."""
    query = db.query(EventDB)
    
    if api_key:
        query = query.filter(EventDB.api_key == api_key)
    
    rows = query.all()

    return [
        Event(
            event_name=row.event_name,
            session_id=row.session_id,
            timestamp_ms=row.timestamp_ms,
            platform=row.platform,
            properties=row.properties,
        )
        for row in rows
    ]
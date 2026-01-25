"""
Event Storage (DB Persistence)

This module is the data-access layer for analytics events:
- write incoming events into the database
"""

from typing import List
from sqlalchemy.orm import Session

from app.models.pydantic_models import Event
from app.db.models import EventDB


def save_events(db: Session, api_key: str, events: List[Event]) -> None:
    """Persist a batch of validated `Event` objects for a single `api_key`."""
    for event in events:
        db_event = EventDB(
            api_key=api_key,
            event_name=event.event_name,
            session_id=event.session_id,
            timestamp_ms=event.timestamp_ms,
            platform=event.platform,
            properties=event.properties,
        )
        db.add(db_event)

    db.commit()
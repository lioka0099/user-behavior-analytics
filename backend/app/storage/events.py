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
    # #region agent log
    try:
        import json, time
        with open("/Users/lioka/Desktop/user-behavior-analytics/.cursor/debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "A",
                "location": "backend/app/storage/events.py:get_all_events:entry",
                "message": "get_all_events called",
                "data": {"api_key_is_none": api_key is None, "api_key_len": (len(api_key) if isinstance(api_key, str) else None)},
                "timestamp": int(time.time() * 1000),
            }) + "\n")
    except Exception:
        pass
    # #endregion
    query = db.query(EventDB)
    
    # IMPORTANT: treat empty string as a real api_key (filter), not "no filter".
    # Only None means "no filter".
    if api_key is not None:
        query = query.filter(EventDB.api_key == api_key)
    
    rows = query.all()

    # #region agent log
    try:
        import json, time
        with open("/Users/lioka/Desktop/user-behavior-analytics/.cursor/debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "A",
                "location": "backend/app/storage/events.py:get_all_events:exit",
                "message": "get_all_events returning",
                "data": {"row_count": len(rows)},
                "timestamp": int(time.time() * 1000),
            }) + "\n")
    except Exception:
        pass
    # #endregion

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
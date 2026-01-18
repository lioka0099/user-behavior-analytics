from pydantic import BaseModel
from sqlalchemy.orm import Session
from statistics import mean, median
from app.storage.events import get_all_events

class TimeToCompleteRequest(BaseModel):
    start_event: str
    end_event: str
    api_key: str | None = None

def calculate_time_to_complete(
    start_event: str,
    end_event: str,
    db: Session,
    api_key: str | None = None
):
    events = get_all_events(db, api_key)

    sessions = {}
    for event in events:
        sessions.setdefault(event.session_id, []).append(event)

    durations = []

    for session_events in sessions.values():
        ordered = sorted(session_events, key=lambda e: e.timestamp_ms)

        start_time = None
        end_time = None

        for e in ordered:
            if e.event_name == start_event and start_time is None:
                start_time = e.timestamp_ms
            elif (
                e.event_name == end_event
                and start_time is not None
            ):
                end_time = e.timestamp_ms
                break

        if start_time is not None and end_time is not None:
            durations.append(end_time - start_time)

    if not durations:
        return {
            "start_event": start_event,
            "end_event": end_event,
            "count": 0,
            "average_ms": None,
            "median_ms": None,
            "min_ms": None,
            "max_ms": None,
        }

    return {
        "start_event": start_event,
        "end_event": end_event,
        "count": len(durations),
        "average_ms": int(mean(durations)),
        "median_ms": int(median(durations)),
        "min_ms": min(durations),
        "max_ms": max(durations),
    }

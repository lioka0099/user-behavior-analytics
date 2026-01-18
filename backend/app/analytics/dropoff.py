from typing import List, Dict
from sqlalchemy.orm import Session
from app.storage.events import get_all_events


def calculate_dropoff(
    steps: List[str],
    db: Session,
    api_key: str | None = None
) -> Dict:
    events = get_all_events(db, api_key)

    sessions = {}
    for event in events:
        sessions.setdefault(event.session_id, []).append(event)

    dropoffs = {step: 0 for step in steps}

    for session_events in sessions.values():
        ordered = sorted(session_events, key=lambda e: e.timestamp_ms)
        event_names = [e.event_name for e in ordered]

        last_step_index = -1
        for i, step in enumerate(steps):
            if step in event_names:
                last_step_index = i
            else:
                break

        if last_step_index >= 0:
            dropoffs[steps[last_step_index]] += 1

    return {
        "steps": steps,
        "dropoffs": dropoffs
    }

from typing import List
from sqlalchemy.orm import Session

from app.storage.events import get_all_events


def run_funnel_for_steps(steps: List[str], db: Session, api_key: str | None = None):
    events = get_all_events(db, api_key)

    sessions = {}
    for event in events:
        sessions.setdefault(event.session_id, []).append(event)

    sessions_entered = 0
    sessions_completed = 0

    for session_events in sessions.values():
        ordered = sorted(session_events, key=lambda e: e.timestamp_ms)
        event_names = [e.event_name for e in ordered]

        step_index = 0
        for name in event_names:
            if name == steps[step_index]:
                step_index += 1
                if step_index == len(steps):
                    break

        if step_index > 0:
            sessions_entered += 1
        if step_index == len(steps):
            sessions_completed += 1

    conversion_rate = (
        sessions_completed / sessions_entered
        if sessions_entered > 0 else 0
    )

    return {
        "steps": steps,
        "sessions_entered": sessions_entered,
        "sessions_completed": sessions_completed,
        "conversion_rate": conversion_rate
    }


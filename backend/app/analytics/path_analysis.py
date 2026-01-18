from typing import Dict
from sqlalchemy.orm import Session
from app.storage.events import get_all_events

def analyze_paths(db: Session, max_depth: int = 10, api_key: str | None = None) -> Dict[str, int]:
    events = get_all_events(db, api_key)

    sessions = {}
    for event in events:
        sessions.setdefault(event.session_id, []).append(event)

    path_counts: Dict[str, int] = {}

    for session_events in sessions.values():
        ordered = sorted(session_events, key=lambda e: e.timestamp_ms)
        names = [e.event_name for e in ordered[:max_depth]]

        if len(names) < 2:
            continue

        path = " → ".join(names)
        path_counts[path] = path_counts.get(path, 0) + 1

    return dict(
        sorted(
            path_counts.items(),
            key=lambda item: item[1],
            reverse=True
        )
    )
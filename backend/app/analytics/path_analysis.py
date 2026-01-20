from typing import Dict, Optional, List
from sqlalchemy.orm import Session
from app.db.models import EventDB

def analyze_paths(db: Session, max_depth: int = 10, api_key: Optional[str] = None) -> Dict[str, int]:
    # PERF: stream events in DB order and only keep first `max_depth` per session.
    q = db.query(EventDB.session_id, EventDB.event_name, EventDB.timestamp_ms)
    if api_key is not None:
        q = q.filter(EventDB.api_key == api_key)
    q = q.order_by(EventDB.session_id, EventDB.timestamp_ms)

    path_counts: Dict[str, int] = {}
    current_session_id = None
    names: List[str] = []

    def flush():
        if len(names) < 2:
            return
        path = " → ".join(names[:max_depth])
        path_counts[path] = path_counts.get(path, 0) + 1

    for (session_id, event_name, _ts) in q.yield_per(5000):
        if current_session_id is None:
            current_session_id = session_id
            names = [event_name]
            continue
        if session_id != current_session_id:
            flush()
            current_session_id = session_id
            names = [event_name]
            continue
        if len(names) < max_depth:
            names.append(event_name)

    if current_session_id is not None:
        flush()

    return dict(
        sorted(
            path_counts.items(),
            key=lambda item: item[1],
            reverse=True
        )
    )
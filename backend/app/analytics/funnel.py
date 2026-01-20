from typing import List
from sqlalchemy.orm import Session

from app.db.models import EventDB


def run_funnel_for_steps(steps: List[str], db: Session, api_key: str | None = None):
    # PERF: only pull events that could possibly affect this funnel.
    # The old implementation loaded *all* events for the api_key, grouped, and sorted in Python,
    # which can time out on large datasets.
    query = db.query(EventDB.session_id, EventDB.event_name, EventDB.timestamp_ms)
    if api_key is not None:
        query = query.filter(EventDB.api_key == api_key)
    query = query.filter(EventDB.event_name.in_(steps))
    query = query.order_by(EventDB.session_id, EventDB.timestamp_ms)

    sessions_entered = 0
    sessions_completed = 0

    events_processed = 0
    sessions_seen = 0

    current_session_id = None
    step_index = 0

    started_at = None
    try:
        import time as _time
        started_at = _time.time()
    except Exception:
        started_at = None

    # Stream rows in session+time order to avoid per-session sorting and high memory usage.
    for (session_id, event_name, _ts) in query.yield_per(5000):
        events_processed += 1
        if current_session_id is None:
            current_session_id = session_id
            sessions_seen = 1
            step_index = 0
        elif session_id != current_session_id:
            # finalize previous session
            if step_index > 0:
                sessions_entered += 1
            if step_index == len(steps):
                sessions_completed += 1

            # start new session
            current_session_id = session_id
            sessions_seen += 1
            step_index = 0

        if step_index < len(steps) and event_name == steps[step_index]:
            step_index += 1
            # We intentionally keep scanning until session boundary; we need step_index for finalize.

    # finalize last session
    if current_session_id is not None:
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


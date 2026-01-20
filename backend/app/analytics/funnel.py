from typing import List
from sqlalchemy.orm import Session

from app.db.models import EventDB


def run_funnel_for_steps(steps: List[str], db: Session, api_key: str | None = None):
    # #region agent log
    try:
        import json, time
        with open("/Users/lioka/Desktop/user-behavior-analytics/.cursor/debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "B",
                "location": "backend/app/analytics/funnel.py:run_funnel_for_steps:entry",
                "message": "run_funnel_for_steps called",
                "data": {"api_key_is_none": api_key is None, "api_key_len": (len(api_key) if isinstance(api_key, str) else None), "steps_len": len(steps)},
                "timestamp": int(time.time() * 1000),
            }) + "\n")
    except Exception:
        pass
    # #endregion

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

    # #region agent log
    try:
        import json, time
        duration_ms = None
        try:
            import time as _time
            duration_ms = int((_time.time() - started_at) * 1000) if started_at is not None else None
        except Exception:
            duration_ms = None
        with open("/Users/lioka/Desktop/user-behavior-analytics/.cursor/debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "B",
                "location": "backend/app/analytics/funnel.py:run_funnel_for_steps:exit",
                "message": "run_funnel_for_steps finished",
                "data": {
                    "events_processed": events_processed,
                    "sessions_seen": sessions_seen,
                    "sessions_entered": sessions_entered,
                    "sessions_completed": sessions_completed,
                    "duration_ms": duration_ms,
                },
                "timestamp": int(time.time() * 1000),
            }) + "\n")
    except Exception:
        pass
    # #endregion

    return {
        "steps": steps,
        "sessions_entered": sessions_entered,
        "sessions_completed": sessions_completed,
        "conversion_rate": conversion_rate
    }


"""
Funnel Analysis (Server-Side)

This module computes funnel conversion metrics from raw event rows in the database.
It is implemented as a streaming scan (ordered by session + time) to keep memory usage
low and avoid Python-side sorting on large datasets.
"""

from typing import List
from sqlalchemy.orm import Session

from app.db.models import EventDB


def run_funnel_for_steps(steps: List[str], db: Session, api_key: str | None = None):
    """
    Compute basic funnel metrics for an ordered list of step event names.

    Notes:
    - A session is counted as "entered" if it matches at least the first step.
    - A session is "completed" only if it matches every step in order.

    Args:
        steps: Ordered list of event names representing the funnel.
        db: SQLAlchemy session.
        api_key: If provided, restrict computation to a single app/api_key.

    Returns:
        Dict with steps, sessions_entered, sessions_completed, and conversion_rate.
    """

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


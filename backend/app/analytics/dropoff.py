"""
Funnel Drop-off Calculation

This module computes where users drop off within a funnel: for each session, we track
the last successfully matched step (in order) and increment that step's drop-off count.

The implementation streams events ordered by session + time for performance.
"""

from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.db.models import EventDB


def calculate_dropoff(
    steps: List[str],
    db: Session,
    api_key: Optional[str] = None
) -> Dict:
    """
    Count drop-offs per funnel step for an ordered list of steps.

    Args:
        steps: Ordered list of funnel step event names.
        db: SQLAlchemy session.
        api_key: If provided, restrict computation to a single app/api_key.

    Returns:
        Dict with "steps" and "dropoffs" (mapping step -> number of sessions dropping there).
    """

    dropoffs = {step: 0 for step in steps}
    if not steps:
        return {"steps": steps, "dropoffs": dropoffs}

    q = db.query(EventDB.session_id, EventDB.event_name, EventDB.timestamp_ms)
    if api_key is not None:
        q = q.filter(EventDB.api_key == api_key)
    q = q.filter(EventDB.event_name.in_(steps))
    q = q.order_by(EventDB.session_id, EventDB.timestamp_ms)

    current_session_id = None
    step_index = 0

    for (session_id, event_name, _ts) in q.yield_per(5000):
        if current_session_id is None:
            current_session_id = session_id
            step_index = 0
        elif session_id != current_session_id:
            if step_index > 0:
                dropoffs[steps[step_index - 1]] += 1
            current_session_id = session_id
            step_index = 0

        if step_index < len(steps) and event_name == steps[step_index]:
            step_index += 1

    if current_session_id is not None and step_index > 0:
        dropoffs[steps[step_index - 1]] += 1

    return {
        "steps": steps,
        "dropoffs": dropoffs
    }

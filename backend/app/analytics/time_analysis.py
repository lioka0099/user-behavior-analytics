"""
Time-to-Complete Analysis

This module calculates how long it takes (per session) to go from a start event to an
end event, then summarizes those durations (count/avg/median/min/max).
"""

from pydantic import BaseModel
from sqlalchemy.orm import Session
from statistics import mean, median
from typing import Optional
from app.db.models import EventDB

class TimeToCompleteRequest(BaseModel):
    """Request payload for the time-to-complete analytics endpoint."""
    start_event: str
    end_event: str
    api_key: Optional[str] = None

def calculate_time_to_complete(
    start_event: str,
    end_event: str,
    db: Session,
    api_key: Optional[str] = None
):
    """
    Compute duration statistics from first start_event to first end_event per session.

    Only one duration per session is counted (the first completion after the start).
    """
    durations = []
    if not start_event or not end_event:
        return {
            "start_event": start_event,
            "end_event": end_event,
            "count": 0,
            "average_ms": None,
            "median_ms": None,
            "min_ms": None,
            "max_ms": None,
        }


    q = db.query(EventDB.session_id, EventDB.event_name, EventDB.timestamp_ms)
    if api_key is not None:
        q = q.filter(EventDB.api_key == api_key)
    q = q.filter(EventDB.event_name.in_([start_event, end_event]))
    q = q.order_by(EventDB.session_id, EventDB.timestamp_ms)

    current_session_id = None
    start_time = None
    found_duration = False

    for (session_id, event_name, ts_ms) in q.yield_per(5000):
        if current_session_id is None:
            current_session_id = session_id
            start_time = None
            found_duration = False
        elif session_id != current_session_id:
            current_session_id = session_id
            start_time = None
            found_duration = False

        if found_duration:
            continue

        if event_name == start_event and start_time is None:
            start_time = ts_ms
        elif event_name == end_event and start_time is not None:
            durations.append(ts_ms - start_time)
            found_duration = True

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

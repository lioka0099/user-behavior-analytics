from fastapi import FastAPI, HTTPException
from .models import EventBatch
from .storage import save_events, get_all_events
from collections import Counter
from .storage import get_all_events
from pydantic import BaseModel
from typing import List

app = FastAPI(title="User Behavior Analytics API")

class FunnelRequest(BaseModel):
    steps: List[str]


@app.post("/events")
def ingest_events(batch: EventBatch):
    if not batch.events:
        raise HTTPException(status_code=400, detail="No events provided")

    save_events(batch.events)

    return {
        "status": "ok",
        "ingested": len(batch.events)
    }


@app.get("/debug/events")
def debug_events():
    return {
        "count": len(get_all_events()),
        "events": get_all_events()
    }

@app.get("/analytics/event-counts")
def event_counts():
    events = get_all_events()
    counts = Counter(event.event_name for event in events)
    return dict(counts)

@app.post("/analytics/funnel")
def funnel_analysis(request: FunnelRequest):
    events = get_all_events()

    # group events by session
    sessions = {}
    for event in events:
        sessions.setdefault(event.session_id, []).append(event)

    sessions_entered = 0
    sessions_completed = 0

    for session_events in sessions.values():
        # sort events by time
        ordered = sorted(session_events, key=lambda e: e.timestamp_ms)
        event_names = [e.event_name for e in ordered]

        step_index = 0
        for name in event_names:
            if name == request.steps[step_index]:
                step_index += 1
                if step_index == len(request.steps):
                    break

        if step_index > 0:
            sessions_entered += 1
        if step_index == len(request.steps):
            sessions_completed += 1

    conversion_rate = (
        sessions_completed / sessions_entered
        if sessions_entered > 0 else 0
    )

    return {
        "steps": request.steps,
        "sessions_entered": sessions_entered,
        "sessions_completed": sessions_completed,
        "conversion_rate": conversion_rate
    }
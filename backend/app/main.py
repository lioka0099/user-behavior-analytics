from fastapi import FastAPI, HTTPException
from .models import EventBatch
from .storage import save_events, get_all_events
from collections import Counter
from .storage import get_all_events

app = FastAPI(title="User Behavior Analytics API")


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

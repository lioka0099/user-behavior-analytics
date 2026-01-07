from fastapi import FastAPI, HTTPException
from collections import Counter
from pydantic import BaseModel
from typing import List
from app.models import EventBatch, create_funnel_definition
from app.storage import (
    save_events,
    get_all_events,
    save_funnel_definition,
    list_funnel_definitions,
    get_funnel_definition
)
from app.db.database import engine
from app.db.models import Base
from fastapi import Depends
from sqlalchemy.orm import Session
from app.db.deps import get_db

app = FastAPI(title="User Behavior Analytics API")
Base.metadata.create_all(bind=engine)

class FunnelRequest(BaseModel):
    steps: List[str]

class CreateFunnelDefinitionRequest(BaseModel):
    api_key: str
    name: str
    steps: List[str]

class RunFunnelRequest(BaseModel):
    api_key: str


def run_funnel_for_steps(steps: List[str], db: Session):
    events = get_all_events(db)

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



@app.post("/events")
def ingest_events(
    batch: EventBatch,
    db: Session = Depends(get_db)
):
    if not batch.events:
        raise HTTPException(status_code=400, detail="No events provided")

    save_events(db, batch.api_key, batch.events)

    return {
        "status": "ok",
        "ingested": len(batch.events)
    }


@app.get("/debug/events")
def debug_events(db: Session = Depends(get_db)):
    events = get_all_events(db)
    return {
        "count": len(events),
        "events": events
    }

@app.get("/analytics/event-counts")
def event_counts(db: Session = Depends(get_db)):
    events = get_all_events(db)
    counts = Counter(event.event_name for event in events)
    return dict(counts)

@app.post("/analytics/funnel")
def funnel_analysis(request: FunnelRequest, db: Session = Depends(get_db)):
    return run_funnel_for_steps(request.steps, db)

@app.post("/analytics/definitions/funnel")
def create_funnel_definition_endpoint(
    request: CreateFunnelDefinitionRequest
):
    if not request.steps:
        return {"error": "Funnel must have at least one step"}

    definition = create_funnel_definition(
        api_key=request.api_key,
        name=request.name,
        steps=request.steps
    )

    save_funnel_definition(definition)
    return definition

@app.post("/analytics/definitions/funnel/{definition_id}/run")
def run_funnel_definition(
    definition_id: str,
    request: RunFunnelRequest,
    db: Session = Depends(get_db)
):
    definition = get_funnel_definition(
        request.api_key,
        definition_id
    )

    if not definition:
        return {"error": "Definition not found"}

    result = run_funnel_for_steps(definition.steps, db)

    return {
        "definition_id": definition.id,
        "name": definition.name,
        **result
    }


@app.get("/analytics/definitions/funnel")
def list_funnel_definitions_endpoint(api_key: str):
    return list_funnel_definitions(api_key)

@app.get("/analytics/definitions/funnel/{definition_id}")
def get_funnel_definition_endpoint(
    definition_id: str,
    api_key: str
):
    definition = get_funnel_definition(api_key, definition_id)
    if not definition:
        return {"error": "Definition not found"}
    return definition


"""
Events Ingestion API

FastAPI routes for ingesting client-side analytics events. The primary endpoint accepts
event batches and persists them via the storage layer.
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.models.pydantic_models import EventBatch
from app.storage.events import save_events
from app.db.deps import get_db

router = APIRouter()


@router.post("/events")
def ingest_events(
    batch: EventBatch,
    db: Session = Depends(get_db)
):
    """Ingest a batch of events for a single `api_key`."""
    if not batch.events:
        raise HTTPException(status_code=400, detail="No events provided")

    save_events(db, batch.api_key, batch.events)

    return {
        "status": "ok",
        "ingested": len(batch.events)
    }

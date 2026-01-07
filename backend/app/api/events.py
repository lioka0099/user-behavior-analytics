from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.models.pydantic_models import EventBatch
from app.storage.events import save_events, get_all_events
from app.db.deps import get_db

router = APIRouter()


@router.post("/events")
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


@router.get("/debug/events")
def debug_events(db: Session = Depends(get_db)):
    events = get_all_events(db)
    return {
        "count": len(events),
        "events": events
    }


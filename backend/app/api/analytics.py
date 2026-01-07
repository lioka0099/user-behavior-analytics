from fastapi import APIRouter, Depends
from collections import Counter
from sqlalchemy.orm import Session

from app.models.pydantic_models import FunnelRequest
from app.storage.events import get_all_events
from app.analytics.funnel import run_funnel_for_steps
from app.db.deps import get_db

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/event-counts")
def event_counts(db: Session = Depends(get_db)):
    events = get_all_events(db)
    counts = Counter(event.event_name for event in events)
    return dict(counts)


@router.post("/funnel")
def funnel_analysis(request: FunnelRequest, db: Session = Depends(get_db)):
    return run_funnel_for_steps(request.steps, db)


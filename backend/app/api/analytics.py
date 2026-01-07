from fastapi import APIRouter, Depends
from collections import Counter
from sqlalchemy.orm import Session

from app.models.pydantic_models import FunnelRequest
from app.storage.events import get_all_events
from app.analytics.funnel import run_funnel_for_steps
from app.db.deps import get_db
from app.analytics.dropoff import calculate_dropoff
from app.analytics.time_analysis import (
    calculate_time_to_complete,
    TimeToCompleteRequest
)
from app.analytics.path_analysis import analyze_paths
from app.models.pydantic_models import PathAnalysisRequest

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/event-counts")
def event_counts(db: Session = Depends(get_db)):
    events = get_all_events(db)
    counts = Counter(event.event_name for event in events)
    return dict(counts)


@router.post("/funnel")
def funnel_analysis(request: FunnelRequest, db: Session = Depends(get_db)):
    return run_funnel_for_steps(request.steps, db)

@router.post("/dropoff/debug")
def debug_dropoff(
    steps: list[str],
    db: Session = Depends(get_db)
):
    return calculate_dropoff(steps, db)

@router.post("/time-to-complete")
def time_to_complete(
    request: TimeToCompleteRequest,
    db: Session = Depends(get_db)
):
    return calculate_time_to_complete(
        request.start_event,
        request.end_event,
        db
    )

@router.post("/paths")
def path_analysis(
    request: PathAnalysisRequest,
    db: Session = Depends(get_db)
):
    return {
        "paths": analyze_paths(db, request.max_depth)
    }
from fastapi import APIRouter, Depends, HTTPException
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
from app.insights.models import InsightRequest
from app.insights.snapshot import build_analytics_snapshot, build_insight_history_snapshot
from app.insights.prompts import build_insight_prompt, build_trend_prompt
from app.insights.generator import generate_insights, generate_trend_insights
from app.storage.insights import save_insight, list_insights




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

@router.post("/time")
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

@router.post("/insights")
def generate_insights_endpoint(
    request: InsightRequest,
    db: Session = Depends(get_db)
):
    snapshot = build_analytics_snapshot(db)
    prompt = build_insight_prompt(snapshot)
    insight = generate_insights(prompt)

    save_insight(db, request.api_key, insight)

    return insight

@router.get("/insights/history")
def insight_history(
    api_key: str,
    db: Session = Depends(get_db)
):
    insights = list_insights(db, api_key)

    return [
        {
            "id": i.id,
            "summary": i.summary,
            "insights": i.insights,
            "recommendations": i.recommendations,
            "created_at": i.created_at.isoformat()
        }
        for i in insights
    ]

@router.get("/insights/trends")
def insight_trends(
    api_key: str,
    db: Session = Depends(get_db)
):
    history = build_insight_history_snapshot(db, api_key)

    if len(history) < 2:
        raise HTTPException(
            status_code=400,
            detail="Not enough insight history to analyze trends"
        )

    prompt = build_trend_prompt(history)
    return generate_trend_insights(prompt)
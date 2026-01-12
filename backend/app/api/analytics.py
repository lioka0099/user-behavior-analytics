"""
Analytics API Endpoints

This module provides REST endpoints for:
- Event analytics (counts, funnels, drop-offs, paths, time)
- LLM-powered insights generation
- Insight history and trend analysis
- Insight comparison between time periods
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from collections import Counter
from sqlalchemy.orm import Session

from app.models.pydantic_models import FunnelRequest, PathAnalysisRequest
from app.storage.events import get_all_events
from app.analytics.funnel import run_funnel_for_steps
from app.db.deps import get_db
from app.analytics.dropoff import calculate_dropoff
from app.analytics.time_analysis import calculate_time_to_complete, TimeToCompleteRequest
from app.analytics.path_analysis import analyze_paths
from app.analytics.insight_diff import compare_snapshots
from app.insights.models import InsightRequest
from app.insights.snapshot import build_analytics_snapshot, build_insight_history_snapshot
from app.insights.prompts import build_insight_prompt, build_trend_prompt
from app.insights.generator import generate_insights, generate_trend_insights, explain_diff
from app.storage.insights import save_insight, list_insights


router = APIRouter(prefix="/analytics", tags=["analytics"])


# =============================================================================
# Event Analytics Endpoints
# =============================================================================

@router.get("/event-counts")
def event_counts(api_key: str = None, db: Session = Depends(get_db)):
    """Get count of each event type, optionally filtered by api_key."""
    events = get_all_events(db, api_key)
    counts = Counter(event.event_name for event in events)
    return dict(counts)


@router.post("/funnel")
def funnel_analysis(request: FunnelRequest, db: Session = Depends(get_db)):
    """Run funnel analysis for specified steps."""
    return run_funnel_for_steps(request.steps, db)


@router.post("/dropoff/debug")
def debug_dropoff(
    steps: list[str],
    db: Session = Depends(get_db)
):
    """Calculate drop-off at each funnel step."""
    return calculate_dropoff(steps, db)


@router.post("/time")
def time_to_complete(
    request: TimeToCompleteRequest,
    db: Session = Depends(get_db)
):
    """Calculate time between two events."""
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
    """Analyze user paths through the application."""
    return {
        "paths": analyze_paths(db, request.max_depth)
    }


# =============================================================================
# Insight Endpoints
# =============================================================================

@router.post("/insights")
def generate_insights_endpoint(
    request: InsightRequest,
    db: Session = Depends(get_db)
):
    """
    Generate LLM-powered insights from current analytics.
    
    This endpoint:
    1. Builds a snapshot of current analytics
    2. Sends the snapshot to the LLM for analysis
    3. Saves the insight WITH the snapshot for future comparison
    4. Returns the generated insight
    """
    # Build snapshot with api_key for filtering
    snapshot = build_analytics_snapshot(db, request.api_key)
    
    # Generate prompt and get LLM insight
    prompt = build_insight_prompt(snapshot)
    insight = generate_insights(prompt)

    # Save insight WITH snapshot for historical comparison
    save_insight(db, request.api_key, insight, snapshot=snapshot)

    return insight


@router.get("/insights/history")
def insight_history(
    api_key: str,
    db: Session = Depends(get_db)
):
    """
    Get history of generated insights for an api_key.
    
    Returns insights ordered by created_at descending (newest first).
    """
    insights = list_insights(db, api_key)

    return [
        {
            "id": i.id,
            "summary": i.summary,
            "insights": i.insights,
            "recommendations": i.recommendations,
            "has_snapshot": i.analytics_snapshot is not None,
            "created_at": i.created_at.isoformat()
        }
        for i in insights
    ]


@router.get("/insights/trends")
def insight_trends(
    api_key: str,
    db: Session = Depends(get_db)
):
    """
    Analyze trends across historical insights using LLM.
    
    Requires at least 2 insights to compare.
    """
    history = build_insight_history_snapshot(db, api_key)

    if len(history) < 2:
        raise HTTPException(
            status_code=400,
            detail="Not enough insight history to analyze trends"
        )

    prompt = build_trend_prompt(history)
    return generate_trend_insights(prompt)


@router.get("/insights/compare")
def compare_insights_endpoint(
    api_key: str,
    db: Session = Depends(get_db)
):
    """
    Compare the two most recent insights using rule-based diff + LLM explanation.
    
    This endpoint:
    1. Gets the two most recent insights
    2. Extracts their stored snapshots
    3. Runs deterministic comparison (insight_diff.py)
    4. Gets LLM explanation of the changes
    5. Returns structured comparison result
    
    The comparison separates:
    - FACTS (rule-based): What changed, by how much
    - INTERPRETATION (LLM): Why it matters, what to do
    """
    # Get insights for this api_key
    insights = list_insights(db, api_key)
    
    if len(insights) < 2:
        raise HTTPException(
            status_code=400,
            detail="Need at least 2 insights to compare. Generate more insights first."
        )
    
    # Get the two most recent insights
    latest = insights[0]
    previous = insights[1]
    
    # Extract snapshots
    curr_snapshot = latest.analytics_snapshot
    prev_snapshot = previous.analytics_snapshot
    
    # Handle missing snapshots
    if curr_snapshot is None:
        # Build current snapshot as fallback
        curr_snapshot = build_analytics_snapshot(db, api_key)
    
    if prev_snapshot is None:
        # Use a baseline for comparison if previous snapshot wasn't stored
        raise HTTPException(
            status_code=400,
            detail="Previous insight doesn't have a stored snapshot. Generate a new insight first."
        )
    
    # Step 1: Rule-based comparison (deterministic)
    diff = compare_snapshots(prev_snapshot, curr_snapshot)
    
    # Step 2: LLM explanation (interpretive)
    explanation = explain_diff(diff)
    
    return {
        "comparison": {
            "previous_insight_id": previous.id,
            "previous_created_at": previous.created_at.isoformat(),
            "latest_insight_id": latest.id,
            "latest_created_at": latest.created_at.isoformat()
        },
        "diff": diff,
        "explanation": explanation,
        "compared_at": datetime.now(timezone.utc).isoformat()
    }

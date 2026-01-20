"""
Analytics API Endpoints

This module provides REST endpoints for:
- Event analytics (counts, funnels, drop-offs, paths, time)
- LLM-powered insights generation
- Insight history and trend analysis
- Insight comparison between time periods
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Optional
from fastapi import APIRouter, Depends, HTTPException
from collections import Counter
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.pydantic_models import FunnelRequest, PathAnalysisRequest
from app.storage.events import get_all_events
from app.analytics.funnel import run_funnel_for_steps
from app.db.deps import get_db
from app.db.models import EventDB
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
    query = db.query(EventDB.event_name, func.count(EventDB.id)).group_by(EventDB.event_name)
    # IMPORTANT: treat empty string as a real api_key (filter), not "no filter".
    # Only None means "no filter".
    if api_key is not None:
        query = query.filter(EventDB.api_key == api_key)

    rows = query.all()
    return {name: int(count) for (name, count) in rows}


@router.get("/event-volume")
def event_volume(
    api_key: str,
    days: int = 7,
    event_name: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Daily total event volume for the last N days (UTC).

    - Returns zero-count days so charts are continuous.
    - If `event_name` is provided, filters to that single event.
    """
    if days < 1 or days > 90:
        raise HTTPException(status_code=400, detail="days must be between 1 and 90")

    now = datetime.now(timezone.utc)
    start_date = (now - timedelta(days=days - 1)).date()
    end_date = (now + timedelta(days=1)).date()  # exclusive

    start_dt = datetime(start_date.year, start_date.month, start_date.day, tzinfo=timezone.utc)
    end_dt = datetime(end_date.year, end_date.month, end_date.day, tzinfo=timezone.utc)
    start_ms = int(start_dt.timestamp() * 1000)
    end_ms = int(end_dt.timestamp() * 1000)

    # Pre-seed days with zero counts
    counts_by_day: Dict[str, int] = {}
    for i in range(days):
        d = (start_date + timedelta(days=i)).isoformat()
        counts_by_day[d] = 0

    query = (
        db.query(EventDB.timestamp_ms)
        .filter(EventDB.api_key == api_key)
        .filter(EventDB.timestamp_ms >= start_ms)
        .filter(EventDB.timestamp_ms < end_ms)
    )
    if event_name:
        query = query.filter(EventDB.event_name == event_name)

    for (ts_ms,) in query.all():
        day = datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).date().isoformat()
        if day in counts_by_day:
            counts_by_day[day] += 1

    return [{"date": d, "count": counts_by_day[d]} for d in sorted(counts_by_day.keys())]


@router.post("/funnel")
def funnel_analysis(request: FunnelRequest, db: Session = Depends(get_db)):
    """Run funnel analysis for specified steps."""
    # Funnel analysis can be very expensive if we scan *all* events.
    # Reject missing/blank api_key so we never accidentally do that in production.
    if request.api_key is None or not request.api_key.strip():
        raise HTTPException(status_code=400, detail="api_key is required for funnel analysis")
    if not request.steps:
        raise HTTPException(status_code=400, detail="steps must contain at least 1 event")
    return run_funnel_for_steps(request.steps, db, api_key=request.api_key)


@router.post("/dropoff/debug")
def debug_dropoff(
    steps: list[str],
    api_key: str | None = None,
    db: Session = Depends(get_db)
):
    """Calculate drop-off at each funnel step."""
    return calculate_dropoff(steps, db, api_key=api_key)


@router.post("/time")
def time_to_complete(
    request: TimeToCompleteRequest,
    db: Session = Depends(get_db)
):
    """Calculate time between two events."""
    return calculate_time_to_complete(
        request.start_event,
        request.end_event,
        db,
        api_key=request.api_key
    )


@router.post("/paths")
def path_analysis(
    request: PathAnalysisRequest,
    db: Session = Depends(get_db)
):
    """Analyze user paths through the application."""
    return {
        "paths": analyze_paths(db, request.max_depth, api_key=request.api_key)
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
    # #region agent log
    _t0 = None
    try:
        import time as _time, json
        _t0 = _time.time()
        with open("/Users/lioka/Desktop/user-behavior-analytics/.cursor/debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "I2",
                "location": "backend/app/api/analytics.py:generate_insights_endpoint:entry",
                "message": "/analytics/insights called",
                "data": {"api_key_len": (len(request.api_key) if isinstance(request.api_key, str) else None)},
                "timestamp": int(_time.time() * 1000),
            }) + "\n")
    except Exception:
        pass
    # #endregion

    _t_snapshot = None
    try:
        import time as _time
        _t_snapshot = _time.time()
    except Exception:
        _t_snapshot = None
    # Keep insight generation fast enough for typical cloud timeouts:
    # we only need a small representative set of funnels for the LLM.
    snapshot = build_analytics_snapshot(
        db,
        request.api_key,
        max_funnels=1,
        include_paths=False,      # can be expensive; not required for LLM summary
        include_dropoffs=False,   # can be expensive; not required for LLM summary
        include_time=False,       # can be expensive; not required for LLM summary
        include_error_count=True,
    )
    _ms_snapshot = None
    try:
        import time as _time
        _ms_snapshot = int((_time.time() - _t_snapshot) * 1000) if _t_snapshot is not None else None
    except Exception:
        _ms_snapshot = None
    
    # Generate prompt and get LLM insight
    _t_prompt = None
    try:
        import time as _time
        _t_prompt = _time.time()
    except Exception:
        _t_prompt = None
    prompt = build_insight_prompt(snapshot)
    _ms_prompt = None
    try:
        import time as _time
        _ms_prompt = int((_time.time() - _t_prompt) * 1000) if _t_prompt is not None else None
    except Exception:
        _ms_prompt = None

    # #region agent log
    try:
        import time as _time, json
        with open("/Users/lioka/Desktop/user-behavior-analytics/.cursor/debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "I2",
                "location": "backend/app/api/analytics.py:generate_insights_endpoint:pre_llm",
                "message": "insights snapshot+prompt ready",
                "data": {"ms_snapshot": _ms_snapshot, "ms_prompt": _ms_prompt, "prompt_len": len(prompt)},
                "timestamp": int(_time.time() * 1000),
            }) + "\n")
    except Exception:
        pass
    # #endregion

    _t_llm = None
    try:
        import time as _time
        _t_llm = _time.time()
    except Exception:
        _t_llm = None
    insight = generate_insights(prompt)
    _ms_llm = None
    try:
        import time as _time
        _ms_llm = int((_time.time() - _t_llm) * 1000) if _t_llm is not None else None
    except Exception:
        _ms_llm = None

    # Save insight WITH snapshot for historical comparison
    save_insight(db, request.api_key, insight, snapshot=snapshot)

    # #region agent log
    try:
        import time as _time, json
        total_ms = int((_time.time() - _t0) * 1000) if _t0 is not None else None
        with open("/Users/lioka/Desktop/user-behavior-analytics/.cursor/debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps({
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": "I2",
                "location": "backend/app/api/analytics.py:generate_insights_endpoint:exit",
                "message": "insights generated",
                "data": {"ms_llm": _ms_llm, "ms_total": total_ms},
                "timestamp": int(_time.time() * 1000),
            }) + "\n")
    except Exception:
        pass
    # #endregion

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

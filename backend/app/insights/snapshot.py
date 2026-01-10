"""
Analytics Snapshot Builder

This module builds comprehensive analytics snapshots that can be:
1. Used to generate LLM insights
2. Compared over time using the insight_diff module
3. Stored with insights for historical comparison

A snapshot captures the current state of all analytics metrics.
"""

from sqlalchemy.orm import Session
from typing import Optional

from app.analytics.path_analysis import analyze_paths
from app.analytics.funnel import run_funnel_for_steps
from app.analytics.dropoff import calculate_dropoff
from app.analytics.time_analysis import calculate_time_to_complete
from app.storage.insights import list_insights
from app.storage.funnel_definitions import list_funnel_definitions
from app.storage.events import get_all_events


def build_analytics_snapshot(db: Session, api_key: str) -> dict:
    """
    Build a comprehensive analytics snapshot for the given api_key.
    
    This snapshot includes all metrics needed for:
    - LLM insight generation
    - Comparison with previous snapshots
    
    Args:
        db: Database session
        api_key: The API key to filter data by
        
    Returns:
        A dict containing:
        - conversion_rate: Overall funnel completion rate
        - dropoff_rates: Drop-off rate at each funnel step
        - avg_time_to_complete_ms: Average time to complete the funnel
        - unique_paths: Number of unique user paths
        - error_count: Number of error events
        - paths: List of user paths
        - funnels: Detailed funnel results
    """
    snapshot = {
        "api_key": api_key,
        "conversion_rate": None,
        "dropoff_rates": {},
        "avg_time_to_complete_ms": None,
        "unique_paths": 0,
        "error_count": 0,
        "paths": [],
        "funnels": {}
    }
    
    # 1. Analyze user paths
    paths = analyze_paths(db, max_depth=5)
    snapshot["paths"] = paths if isinstance(paths, list) else []
    snapshot["unique_paths"] = len(snapshot["paths"])
    
    # 2. Get funnel definitions for this api_key
    funnel_defs = list_funnel_definitions(db, api_key)
    
    # 3. Process each funnel
    for funnel_def in funnel_defs:
        funnel_name = funnel_def.name
        steps = funnel_def.steps
        
        # Run funnel analysis
        funnel_result = run_funnel_for_steps(steps, db)
        snapshot["funnels"][funnel_name] = funnel_result
        
        # Use first funnel's conversion rate as primary metric
        if snapshot["conversion_rate"] is None:
            snapshot["conversion_rate"] = funnel_result.get("conversion_rate")
        
        # Calculate drop-off rates
        dropoff_result = calculate_dropoff(steps, db)
        dropoff_rates = _calculate_dropoff_rates(dropoff_result, funnel_result)
        snapshot["dropoff_rates"].update(dropoff_rates)
        
        # Calculate time-to-complete for first funnel
        if snapshot["avg_time_to_complete_ms"] is None and len(steps) >= 2:
            time_result = calculate_time_to_complete(steps[0], steps[-1], db)
            snapshot["avg_time_to_complete_ms"] = time_result.get("average_ms")
    
    # 4. Count error events
    snapshot["error_count"] = _count_error_events(db, api_key)
    
    return snapshot


def _calculate_dropoff_rates(dropoff_result: dict, funnel_result: dict) -> dict:
    """
    Convert raw dropoff counts to rates (percentages).
    
    Args:
        dropoff_result: Result from calculate_dropoff (contains counts)
        funnel_result: Result from run_funnel (contains total sessions)
        
    Returns:
        Dict mapping step names to dropoff rates (0.0 to 1.0)
    """
    dropoff_rates = {}
    
    dropoffs = dropoff_result.get("dropoffs", {})
    total_sessions = funnel_result.get("sessions_entered", 0)
    
    if total_sessions == 0:
        return dropoff_rates
    
    for step, count in dropoffs.items():
        dropoff_rates[step] = round(count / total_sessions, 4)
    
    return dropoff_rates


def _count_error_events(db: Session, api_key: str) -> int:
    """
    Count the number of error events for the given api_key.
    
    Error events are identified by event_name containing 'error'.
    
    Args:
        db: Database session
        api_key: The API key to filter by
        
    Returns:
        Count of error events
    """
    events = get_all_events(db)
    
    error_count = 0
    for event in events:
        # Check if this event belongs to the api_key
        if hasattr(event, 'api_key') and event.api_key != api_key:
            continue
            
        # Check if event name indicates an error
        event_name = event.event_name.lower()
        if 'error' in event_name:
            error_count += 1
    
    return error_count


def build_insight_history_snapshot(db: Session, api_key: str, limit: int = 5) -> list:
    """
    Build a snapshot of historical insights for trend analysis.
    
    Args:
        db: Database session
        api_key: The API key to filter by
        limit: Maximum number of insights to return
        
    Returns:
        List of insight summaries, ordered newest first
    """
    history = list_insights(db, api_key)[:limit]

    return [
        {
            "summary": i.summary,
            "insights": i.insights,
            "recommendations": i.recommendations,
            "analytics_snapshot": getattr(i, 'analytics_snapshot', None),
            "created_at": i.created_at.isoformat()
        }
        for i in history
    ]

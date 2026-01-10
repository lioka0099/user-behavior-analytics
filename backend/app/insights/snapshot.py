from sqlalchemy.orm import Session
from app.analytics.path_analysis import analyze_paths
from app.storage.insights import list_insights

def build_analytics_snapshot(db: Session) -> dict:
    return {
        "paths": analyze_paths(db, max_depth=5),
        "note": "Extend with funnel, dropoff, time metrics later"
    }

def build_insight_history_snapshot(db, api_key: str, limit: int = 5):
    history = list_insights(db, api_key)[:limit]

    return [
        {
            "summary": i.summary,
            "insights": i.insights,
            "recommendations": i.recommendations,
            "created_at": i.created_at.isoformat()
        }
        for i in history
    ]
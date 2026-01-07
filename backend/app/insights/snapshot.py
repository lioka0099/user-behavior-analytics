from sqlalchemy.orm import Session
from app.analytics.path_analysis import analyze_paths

def build_analytics_snapshot(db: Session) -> dict:
    return {
        "paths": analyze_paths(db, max_depth=5),
        "note": "Extend with funnel, dropoff, time metrics later"
    }
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.models import InsightDB
from app.insights.models import InsightResponse


def save_insight(
    db: Session,
    api_key: str,
    insight: InsightResponse,
    snapshot: Optional[dict] = None
) -> InsightDB:
    """
    Save an insight to the database.
    
    Args:
        db: Database session
        api_key: The API key this insight belongs to
        insight: The InsightResponse from the LLM
        snapshot: Optional analytics snapshot to store for comparison
        
    Returns:
        The saved InsightDB record
    """
    db_insight = InsightDB(
        api_key=api_key,
        summary=insight.summary,
        insights=insight.insights,
        recommendations=insight.recommendations,
        analytics_snapshot=snapshot
    )

    db.add(db_insight)
    db.commit()
    db.refresh(db_insight)
    return db_insight

def list_insights(
    db: Session,
    api_key: str
) -> List[InsightDB]:
    return (
        db.query(InsightDB)
        .filter(InsightDB.api_key == api_key)
        .order_by(InsightDB.created_at.desc())
        .all()
    )

def get_latest_insight(db: Session, api_key: str) -> InsightDB | None:
    return (
        db.query(InsightDB)
        .filter(InsightDB.api_key == api_key)
        .order_by(InsightDB.created_at.desc())
        .first()
    )
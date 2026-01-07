from sqlalchemy.orm import Session
from typing import List
from app.db.models import InsightDB
from app.insights.models import InsightResponse

def save_insight(
    db: Session,
    api_key: str,
    insight: InsightResponse
) -> InsightDB:
    db_insight = InsightDB(
        api_key=api_key,
        summary=insight.summary,
        insights=insight.insights,
        recommendations=insight.recommendations
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
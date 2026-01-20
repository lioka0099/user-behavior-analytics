"""
Database Dependencies

FastAPI dependency helpers for obtaining a per-request SQLAlchemy session.
"""

from app.db.database import SessionLocal

def get_db():
    """Yield a SQLAlchemy session and ensure it is closed after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
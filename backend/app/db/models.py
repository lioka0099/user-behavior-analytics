from sqlalchemy import Column, String, Integer, DateTime, JSON
from datetime import datetime, timezone
import uuid

from .database import Base


class EventDB(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    api_key = Column(String, index=True, nullable=False)
    event_name = Column(String, index=True, nullable=False)
    session_id = Column(String, index=True, nullable=False)
    timestamp_ms = Column(Integer, nullable=False)
    platform = Column(String, nullable=True)
    properties = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class FunnelDefinitionDB(Base):
    __tablename__ = "funnel_definitions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    api_key = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    steps = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
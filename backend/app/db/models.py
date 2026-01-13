from sqlalchemy import Column, String, DateTime, JSON, BigInteger, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base


# ============ App Model ============
# Links Supabase Auth users to their apps
# Each app has a unique API key for event tracking

class AppDB(Base):
    """
    Represents an app/project that a user wants to track.
    Each user can have multiple apps, each with its own API key.
    
    The user_id comes from Supabase Auth (UUID format).
    """
    __tablename__ = "apps"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Links to Supabase Auth user (not a foreign key since users are in Supabase)
    user_id = Column(String, index=True, nullable=False)
    
    # Unique API key for this app (used in SDK initialization)
    api_key = Column(String, unique=True, index=True, nullable=False)
    
    # Human-readable name (e.g., "ShopFlow Production", "My Test App")
    name = Column(String, nullable=False)
    
    # Optional description
    description = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), 
                        onupdate=lambda: datetime.now(timezone.utc))


# ============ Event Model ============

class EventDB(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    api_key = Column(String, index=True, nullable=False)
    event_name = Column(String, index=True, nullable=False)
    session_id = Column(String, index=True, nullable=False)
    timestamp_ms = Column(BigInteger, nullable=False)
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

class InsightDB(Base):
    __tablename__ = "insights"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    api_key = Column(String, index=True, nullable=False)

    summary = Column(String, nullable=False)
    insights = Column(JSON, nullable=False)
    recommendations = Column(JSON, nullable=False)
    
    # Store the analytics snapshot for historical comparison
    analytics_snapshot = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
"""
Core Pydantic Models

Shared request/response models used by the backend API (event ingestion, funnels,
paths, and insight diffs). These models validate payloads coming from the dashboard
and the mobile SDK.
"""

from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


Primitive = Union[str, int, float, bool, None]


class Event(BaseModel):
    event_name: str = Field(..., min_length=1)
    timestamp_ms: int
    session_id: str
    platform: str
    properties: Dict[str, Primitive] = {}

    event_id: Optional[str] = None
    app_version: Optional[str] = None
    sdk_version: Optional[str] = None
    locale: Optional[str] = None
    timezone: Optional[str] = None


class EventBatch(BaseModel):
    api_key: str
    sent_at_ms: int
    events: List[Event]


class FunnelDefinition(BaseModel):
    id: str
    api_key: str
    name: str
    steps: List[str]
    created_at: datetime


def create_funnel_definition(
    api_key: str,
    name: str,
    steps: List[str]
) -> FunnelDefinition:
    """Create an in-memory funnel definition with a generated id/timestamp."""
    return FunnelDefinition(
        id=str(uuid.uuid4()),
        api_key=api_key,
        name=name,
        steps=steps,
        created_at=datetime.utcnow()
    )


class FunnelRequest(BaseModel):
    api_key: Optional[str] = None
    steps: List[str]


class CreateFunnelDefinitionRequest(BaseModel):
    api_key: str
    name: str
    steps: List[str]


class RunFunnelRequest(BaseModel):
    api_key: str

class PathAnalysisRequest(BaseModel):
    api_key: Optional[str] = None
    max_depth: int = 10

class InsightDiff(BaseModel):
    metrics_changed: Dict[str, str]   # e.g. {"conversion_rate": "decreased"}
    new_issues: List[str]             # e.g. ["signup_error increased"]
    improvements: List[str]           # e.g. ["time_to_complete improved"]
    summary: str
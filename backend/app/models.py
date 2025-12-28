from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field


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

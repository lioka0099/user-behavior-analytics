from pydantic import BaseModel
from typing import List
from datetime import datetime
import uuid


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
    return FunnelDefinition(
        id=str(uuid.uuid4()),
        api_key=api_key,
        name=name,
        steps=steps,
        created_at=datetime.utcnow()
    )

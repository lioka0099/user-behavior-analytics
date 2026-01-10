from pydantic import BaseModel
from typing import Dict, Any, List

class InsightRequest(BaseModel):
    api_key: str

class InsightResponse(BaseModel):
    summary: str
    insights: List[str]
    recommendations: List[str]

class InsightTrendResponse(BaseModel):
    summary: str
    changes: list[str]
    risks: list[str]
    opportunities: list[str]
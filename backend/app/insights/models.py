"""
Pydantic Models for LLM Insights

These models define the expected JSON structure returned by the LLM layer.
Keeping this strict lets the API validate and persist insights safely.
"""

from pydantic import BaseModel
from typing import Dict, Any, List

class InsightRequest(BaseModel):
    """Request payload for generating a new insight for an app/api_key."""
    api_key: str

class InsightResponse(BaseModel):
    """Structured insight returned from the LLM (summary + bullet insights + recommendations)."""
    summary: str
    insights: List[str]
    recommendations: List[str]
class InsightTrendResponse(BaseModel):
    """Structured trend analysis returned from the LLM across multiple insights."""
    summary: str
    changes: list[str]
    risks: list[str]
    opportunities: list[str]

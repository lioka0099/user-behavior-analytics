"""
LLM Prompt Builders

Small helpers that turn structured analytics data into LLM prompts.
All prompt builders instruct the model to return strict JSON (no markdown) so the
backend can parse responses deterministically.
"""

from typing import Dict, Any

def build_insight_prompt(analytics_snapshot: dict) -> str:
    """Build a prompt to generate a single InsightResponse from a snapshot."""
    return f"""
You must respond with VALID JSON ONLY.
Do NOT use markdown.
Do NOT wrap the response in ``` or any formatting.

Return a JSON object with EXACTLY these fields:
- summary (string)
- insights (array of strings)
- recommendations (array of strings)

You are a senior product analytics expert.

Analyze the following analytics data and produce actionable insights.

Analytics snapshot:
{analytics_snapshot}
"""
def build_trend_prompt(insights: list[dict]) -> str:
    """Build a prompt to generate InsightTrendResponse from historical insights."""
    return f"""
You are a senior product analytics expert.

Given the following historical insights (ordered newest first),
analyze trends over time and identify:

1. Key behavior changes
2. Risks or regressions
3. Opportunities for improvement

Respond with VALID JSON ONLY.
Do NOT use markdown.
Return fields:
- summary
- changes (array)
- risks (array)
- opportunities (array)

Historical insights:
{insights}
"""

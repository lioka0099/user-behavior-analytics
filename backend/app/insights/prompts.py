from typing import Dict, Any

def build_insight_prompt(analytics_snapshot: Dict[str, Any]) -> str:
    return f"""
You are a product analytics expert.

Given the following analytics data, generate:
1. A short summary of user behavior
2. Key insights (bullet points)
3. Actionable recommendations to improve conversion or UX

Analytics data:
{analytics_snapshot}

Respond in clear, concise language.
"""
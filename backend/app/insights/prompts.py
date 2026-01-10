from typing import Dict, Any

def build_insight_prompt(analytics_snapshot: dict) -> str:
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
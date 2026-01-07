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
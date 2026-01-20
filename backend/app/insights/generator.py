"""
LLM Insight Generator

This module handles all LLM interactions for generating insights.
It supports:
1. General insights from analytics snapshots
2. Trend insights from historical data
3. Diff explanations from comparison results

Key principle: LLM is used for EXPLANATION, not for determining facts.
The rule-based engines (insight_diff.py) determine what changed.
This module explains WHY it matters and WHAT to do about it.
"""

from app.insights.models import InsightResponse, InsightTrendResponse
from app.core.config import LLM_PROVIDER, OPENAI_API_KEY
from openai import OpenAI
import json
import re


def generate_insights(prompt: str) -> InsightResponse:
    """Generate insights from an analytics snapshot."""
    if LLM_PROVIDER == "openai":
        return generate_with_openai(prompt)
    # Always return a structured response (never hang / return None)
    return InsightResponse(
        summary="LLM insights are not configured (LLM_PROVIDER != openai).",
        insights=[],
        recommendations=[],
    )


def generate_with_openai(prompt: str, mode: str = "default"):
    """
    Call OpenAI API to generate insights.
    
    Args:
        prompt: The prompt to send to the LLM
        mode: "default" for InsightResponse, "trend" for InsightTrendResponse
    """
    # Bound LLM latency so the API never hangs long enough to time out in cloud.
    # If OpenAI is slow/unavailable, we return a safe structured fallback.
    client = OpenAI(api_key=OPENAI_API_KEY, timeout=10.0, max_retries=0)

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior product analytics expert."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3
        )
        content = response.choices[0].message.content
    except Exception as e:
        if mode == "trend":
            return InsightTrendResponse(
                summary="LLM request failed or timed out.",
                changes=[],
                risks=[],
                opportunities=[],
            )
        return InsightResponse(
            summary="LLM request failed or timed out.",
            insights=[],
            recommendations=[],
        )

    if mode == "trend":
        return parse_trend_llm_response(content)
    return parse_llm_response(content)




def parse_llm_response(text: str) -> InsightResponse:
    """Parse LLM response into InsightResponse model."""
    try:
        cleaned = _clean_llm_json(text)
        data = json.loads(cleaned)
        return InsightResponse(**data)
    except Exception:
        return InsightResponse(
            summary="LLM returned unstructured output.",
            insights=[text],
            recommendations=[]
        )


def parse_trend_llm_response(text: str) -> InsightTrendResponse:
    """Parse LLM response into InsightTrendResponse model."""
    try:
        cleaned = _clean_llm_json(text)
        data = json.loads(cleaned)
        return InsightTrendResponse(**data)
    except Exception:
        return InsightTrendResponse(
            summary="LLM returned unstructured output.",
            changes=[text],
            risks=[],
            opportunities=[]
        )


def _clean_llm_json(text: str) -> str:
    """Remove markdown code fences from LLM JSON response."""
    cleaned = re.sub(r"```(?:json)?", "", text).strip()
    cleaned = cleaned.replace("```", "").strip()
    return cleaned


def generate_trend_insights(prompt: str) -> InsightTrendResponse:
    """Generate trend insights from historical data."""
    if LLM_PROVIDER == "openai":
        return generate_with_openai(prompt, mode="trend")

    return InsightTrendResponse(
        summary="Insufficient data to identify clear trends.",
        changes=[],
        risks=[],
        opportunities=[]
    )


def explain_diff(diff: dict) -> dict:
    """
    Use LLM to explain detected changes and suggest actions.
    
    This function receives the OUTPUT of compare_snapshots() from insight_diff.py.
    The diff contains deterministic facts about what changed.
    The LLM's job is to INTERPRET these facts and suggest actions.
    
    Args:
        diff: The result from compare_snapshots(), containing:
            - metrics_changed: Dict of metric changes with deltas
            - issues: List of detected problems
            - improvements: List of detected improvements
            - overall_trend: "improving", "degrading", or "stable"
    
    Returns:
        A dict containing:
            - interpretation: Human-readable explanation
            - likely_causes: List of potential reasons
            - recommended_actions: List of suggested actions
            - priority: "high", "medium", or "low"
    """
    prompt = f"""
You are a product analytics expert.

Analyze these detected changes in user behavior and provide actionable insights.

## Detected Changes (Factual Data):

Metrics Changed:
{json.dumps(diff.get('metrics_changed', {}), indent=2)}

Issues Identified:
{diff.get('issues', [])}

Improvements Observed:
{diff.get('improvements', [])}

Overall Trend: {diff.get('overall_trend', 'unknown')}

## Your Task:
1. Explain what these changes mean for the product
2. Identify 2-3 potential root causes
3. Suggest 2-3 specific, actionable steps to take

Respond with VALID JSON ONLY (no markdown):
{{
    "interpretation": "One paragraph explaining what these changes mean",
    "likely_causes": ["cause1", "cause2"],
    "recommended_actions": ["action1", "action2", "action3"],
    "priority": "high|medium|low"
}}
"""

    if LLM_PROVIDER == "openai":
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system", 
                    "content": "You are a senior product analytics expert. Respond only with valid JSON."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            temperature=0.3
        )
        
        content = response.choices[0].message.content
        
        try:
            cleaned = _clean_llm_json(content)
            return json.loads(cleaned)
        except Exception:
            # If JSON parsing fails, return a structured fallback
            return {
                "interpretation": content,
                "likely_causes": [],
                "recommended_actions": [],
                "priority": "medium"
            }
    





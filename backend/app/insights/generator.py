from app.insights.models import InsightResponse, InsightTrendResponse
from app.core.config import LLM_PROVIDER, OPENAI_API_KEY
from openai import OpenAI
import json
import re

def generate_insights(prompt: str) -> InsightResponse:
    if LLM_PROVIDER == "openai":
        return generate_with_openai(prompt)
    return generate_mock(prompt)

def generate_with_openai(prompt: str, mode: str = "default"):
    client = OpenAI(api_key=OPENAI_API_KEY)

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

    if mode == "trend":
        return parse_trend_llm_response(content)
    return parse_llm_response(content)

def generate_mock(prompt: str) -> InsightResponse:
    return InsightResponse(
        summary="Users follow a simple two-step flow with minimal delay.",
        insights=[
            "Most users complete the flow immediately.",
            "A small number of users take longer to complete the journey."
        ],
        recommendations=[
            "Introduce engagement between steps to retain slower users.",
            "Track hesitation events for deeper insight."
        ]
    )

def parse_llm_response(text: str) -> InsightResponse:
    try:
        # Remove ```json ``` or ``` fences
        cleaned = re.sub(r"```(?:json)?", "", text).strip()
        cleaned = cleaned.replace("```", "").strip()

        data = json.loads(cleaned)
        return InsightResponse(**data)

    except Exception:
        return InsightResponse(
            summary="LLM returned unstructured output.",
            insights=[text],
            recommendations=[]
        )

def parse_trend_llm_response(text: str) -> InsightTrendResponse:
    try:
        # Remove ```json ``` or ``` fences
        cleaned = re.sub(r"```(?:json)?", "", text).strip()
        cleaned = cleaned.replace("```", "").strip()

        data = json.loads(cleaned)
        return InsightTrendResponse(**data)

    except Exception:
        return InsightTrendResponse(
            summary="LLM returned unstructured output.",
            changes=[text],
            risks=[],
            opportunities=[]
        )

def generate_trend_insights(prompt: str) -> InsightTrendResponse:
    if LLM_PROVIDER == "openai":
        return generate_with_openai(prompt, mode="trend")

    return InsightTrendResponse(
        summary="Insufficient data to identify clear trends.",
        changes=[],
        risks=[],
        opportunities=[]
    )

def explain_diff(diff):
    prompt = f"""
You are a product analytics assistant.

Here are detected changes in user behavior:

Metrics changed:
{diff['metrics_changed']}

New issues:
{diff['new_issues']}

Improvements:
{diff['improvements']}

Explain what changed, why it might have happened,
and suggest concrete product actions.
"""

    return run_llm(prompt) 
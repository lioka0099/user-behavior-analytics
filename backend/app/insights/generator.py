from app.insights.models import InsightResponse
from app.core.config import LLM_PROVIDER, OPENAI_API_KEY
from openai import OpenAI
import json
import re

def generate_insights(prompt: str) -> InsightResponse:
    if LLM_PROVIDER == "openai":
        return generate_with_openai(prompt)
    return generate_mock(prompt)

def generate_with_openai(prompt: str) -> InsightResponse:
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
        temperature=0.4
    )
    content = response.choices[0].message.content
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
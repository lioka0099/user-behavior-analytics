from app.insights.models import InsightResponse

def generate_insights(prompt: str) -> InsightResponse:
    # MOCK IMPLEMENTATION
    return InsightResponse(
        summary="Users follow a simple two-step flow with minimal delay.",
        insights=[
            "Most users complete the flow immediately.",
            "A small number of users take longer to complete the journey."
        ],
        recommendations=[
            "Introduce engagement between steps to retain slower users.",
            "Track errors or hesitation events for deeper insight."
        ]
    )
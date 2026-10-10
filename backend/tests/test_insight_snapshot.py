"""
Insight snapshot check: the LLM gets real drop-off, path and timing numbers.

Run from backend/:  python -m tests.test_insight_snapshot
"""

import os
import random
import tempfile
from datetime import datetime, timezone

# Isolated DB, secret and no real LLM call; must be set before the app is imported.
os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"
os.environ["JWT_SECRET"] = "test-secret-at-least-32-bytes-long!!"
os.environ["LLM_PROVIDER"] = "mock"

from app.api.analytics import generate_insights_endpoint  # noqa: E402
from app.db.database import SessionLocal  # noqa: E402
from app.db.models import InsightDB  # noqa: E402
from app.insights.models import InsightRequest  # noqa: E402
from scripts.seed_demo import DEMO_API_KEY, FUNNEL_STEPS, seed  # noqa: E402


def test_insight_snapshot():
    with SessionLocal() as db:
        seed(db, now=datetime(2026, 10, 7, 12, 0, tzinfo=timezone.utc), rng=random.Random(1))
        generate_insights_endpoint(InsightRequest(api_key=DEMO_API_KEY), db)
        snap = db.query(InsightDB).filter(InsightDB.api_key == DEMO_API_KEY).one().analytics_snapshot

        rates = snap["dropoff_rates"]
        assert list(rates) == FUNNEL_STEPS, rates
        # Every session that enters the funnel either drops off at one step or completes it.
        assert abs(sum(rates.values()) + snap["conversion_rate"] - 1) < 0.001, (rates, snap["conversion_rate"])
        assert snap["unique_paths"] > 0 and snap["paths"], snap
        assert snap["avg_time_to_complete_ms"] > 0, snap


if __name__ == "__main__":
    test_insight_snapshot()
    print("insight snapshot OK")

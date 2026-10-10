"""
Demo seeder check: repeatable, survives a deleted app, funnel narrows.

Run from backend/:  python -m tests.test_seed_demo
"""

import os
import random
import tempfile
from datetime import datetime, timezone

# Isolated DB + secret; must be set before the app is imported.
os.environ["DATABASE_URL"] = f"sqlite:///{tempfile.mkdtemp()}/test.db"
os.environ["JWT_SECRET"] = "test-secret-at-least-32-bytes-long!!"

from sqlalchemy import func  # noqa: E402

from app.analytics.funnel import run_funnel_for_steps  # noqa: E402
from app.core.auth import verify_password  # noqa: E402
from app.db.database import SessionLocal  # noqa: E402
from app.db.models import AppDB, EventDB, UserDB  # noqa: E402
from scripts.seed_demo import DEMO_API_KEY, DEMO_EMAIL, DEMO_PASSWORD, FUNNEL_STEPS, seed  # noqa: E402

NOW = datetime(2026, 10, 7, 12, 0, tzinfo=timezone.utc)


def test_seed_demo():
    with SessionLocal() as db:
        first = seed(db, now=NOW, rng=random.Random(1))

        # A visitor deletes the demo app; its events stay behind (they're keyed by api_key).
        db.query(AppDB).delete()
        db.commit()
        second = seed(db, now=NOW, rng=random.Random(1))

        user = db.query(UserDB).filter(UserDB.email == DEMO_EMAIL).one()
        assert verify_password(DEMO_PASSWORD, user.password_hash)
        apps = db.query(AppDB).filter(AppDB.user_id == user.id).all()
        assert [(a.name, a.api_key) for a in apps] == [("ShopFlow (demo)", DEMO_API_KEY)]

        stored = db.query(EventDB).filter(EventDB.api_key == DEMO_API_KEY).count()
        assert first == second == stored > 0, (first, second, stored)
        latest = db.query(func.max(EventDB.timestamp_ms)).scalar()
        assert latest < NOW.timestamp() * 1000, "events must not be in the future"

        reached = [
            run_funnel_for_steps(FUNNEL_STEPS[: i + 1], db, DEMO_API_KEY)["sessions_completed"]
            for i in range(len(FUNNEL_STEPS))
        ]
        assert reached[-1] > 0 and all(a > b for a, b in zip(reached, reached[1:])), reached


if __name__ == "__main__":
    test_seed_demo()
    print("seed demo OK")

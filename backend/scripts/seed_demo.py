"""
Demo account seeder.

Resets the shared demo account to a known state: one "ShopFlow (demo)" app with
~30 days of synthetic ShopFlow events ending now, and one saved funnel.
Safe to run repeatedly; the nightly GitHub Action does.

Run from backend/:  DATABASE_URL=... JWT_SECRET=... python -m scripts.seed_demo
"""

import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import insert
from sqlalchemy.orm import Session

from app.core.auth import hash_password
from app.db.database import Base, SessionLocal
from app.db.models import AppDB, EventDB, FunnelDefinitionDB, InsightDB, UserDB

# Public on purpose: the dashboard's /demo page signs in with these
# (dashboard/src/app/demo/page.tsx must match).
DEMO_EMAIL = "demo@user-behavior-analytics.app"
DEMO_PASSWORD = "try-the-demo"
# Fixed key so earlier runs' events can be wiped even if a visitor deleted the
# app (deleting an app leaves its events behind).
DEMO_API_KEY = "app_shopflowdemo"
DAYS = 30

FUNNEL_STEPS = ["home_view", "product_view", "add_to_cart", "checkout_start", "purchase_complete"]
# Chance that a visit which reached funnel step i goes on to step i + 1.
CONTINUE_RATES = [0.7, 0.45, 0.6, 0.55]

# (id, name, price, category), same catalog as the ShopFlow demo app.
PRODUCTS = [
    ("1", "Wireless Headphones", 299.99, "Electronics"),
    ("2", "Smart Watch", 399.99, "Electronics"),
    ("3", "Running Shoes", 129.99, "Sports"),
    ("4", "Backpack", 79.99, "Accessories"),
    ("5", "Sunglasses", 159.99, "Accessories"),
    ("6", "Bluetooth Speaker", 89.99, "Electronics"),
]


def _visit(rng: random.Random, start_ms: int) -> list[dict]:
    """One ShopFlow visit: goes deeper into the funnel with decreasing probability."""
    session_id = uuid.uuid4().hex
    product_id, name, price, category = rng.choice(PRODUCTS)
    product = {"product_id": product_id, "product_name": name, "product_price": price}
    cart = {"item_count": 1, "cart_total": price}
    events: list[dict] = []
    t = start_ms

    def add(event_name: str, properties: dict) -> None:
        nonlocal t
        t += rng.randint(2_000, 40_000)  # 2–40 s between taps
        events.append({
            "api_key": DEMO_API_KEY,
            "event_name": event_name,
            "session_id": session_id,
            "timestamp_ms": t,
            "platform": "android",
            "properties": properties,
        })

    depth = 0
    while depth < len(CONTINUE_RATES) and rng.random() < CONTINUE_RATES[depth]:
        depth += 1

    add("app_open", {"launch_source": "direct"})
    add("home_view", {"screen": "home"})
    if depth >= 1:
        add("product_tap", {**product, "product_category": category})
        add("product_view", product)
    if depth >= 2:
        add("add_to_cart", {**product, "cart_total": price})
    if depth >= 3:
        add("cart_icon_tap", {"from_screen": "product_detail", "product_id": product_id})
        add("cart_view", {"distinct_items": 1, **cart})
        add("checkout_start", cart)
    if depth >= 4:
        add("checkout_view", cart)
        for step, step_name in enumerate(["contact_info", "shipping", "payment"]):
            add("checkout_step_complete", {"step": step, "step_name": step_name})
        add("place_order_tap", cart)
        add("payment_processing", {"cart_total": price})
        add("purchase_complete", {"item_count": 1, "order_total": price, "currency": "USD"})
    return events


def _events(now: datetime, rng: random.Random) -> list[dict]:
    """DAYS days of visits ending at `now`; weekends are busier."""
    events: list[dict] = []
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    for days_ago in range(DAYS - 1, -1, -1):
        day = today - timedelta(days=days_ago)
        visits = rng.randint(40, 80) + (25 if day.weekday() >= 5 else 0)
        # A visit lasts at most ~10 min, so today's visits start 15+ min before now.
        # ponytail: a run within 15 min after midnight UTC can put a few events slightly in the future.
        span = min(timedelta(days=1), max(now - day - timedelta(minutes=15), timedelta(minutes=1)))
        day_ms = int(day.timestamp() * 1000)
        for _ in range(visits):
            events += _visit(rng, day_ms + rng.randrange(int(span.total_seconds() * 1000)))
    return events


def seed(db: Session, now: datetime | None = None, rng: random.Random | None = None) -> int:
    """Reset the demo account. Returns the number of events inserted."""
    now = now or datetime.now(timezone.utc)
    rng = rng or random.Random()
    Base.metadata.create_all(bind=db.get_bind())  # no-op on an existing database

    user = db.query(UserDB).filter(UserDB.email == DEMO_EMAIL).first()
    if user is None:
        user = UserDB(email=DEMO_EMAIL, password_hash="")
        db.add(user)
    user.password_hash = hash_password(DEMO_PASSWORD)
    db.flush()

    # Rows are keyed by api_key, and deleting an app leaves them behind, so
    # clear the demo user's current keys plus the fixed demo key.
    keys = {DEMO_API_KEY} | {key for (key,) in db.query(AppDB.api_key).filter(AppDB.user_id == user.id)}
    for model in (EventDB, FunnelDefinitionDB, InsightDB):
        db.query(model).filter(model.api_key.in_(keys)).delete(synchronize_session=False)
    db.query(AppDB).filter(AppDB.user_id == user.id).delete(synchronize_session=False)

    db.add(AppDB(
        user_id=user.id,
        api_key=DEMO_API_KEY,
        name="ShopFlow (demo)",
        description="Sample e-commerce app. Data resets every night.",
    ))
    db.add(FunnelDefinitionDB(api_key=DEMO_API_KEY, name="Browse to purchase", steps=FUNNEL_STEPS))
    events = _events(now, rng)
    db.execute(insert(EventDB), events)
    db.commit()
    return len(events)


if __name__ == "__main__":
    with SessionLocal() as session:
        count = seed(session)
    print(f"Demo account reset: {count} events")

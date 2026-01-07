from fastapi import FastAPI
from app.api import events, funnels, analytics
from app.db.database import engine
from app.db.models import Base

app = FastAPI(title="User Behavior Analytics API")

Base.metadata.create_all(bind=engine)

app.include_router(events.router)
app.include_router(funnels.router)
app.include_router(analytics.router)

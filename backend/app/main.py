from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import events, funnels, analytics, apps
from app.db.database import engine
from app.db.models import Base

app = FastAPI(title="User Behavior Analytics API")

# CORS configuration - allow frontend to make requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "http://127.0.0.1:3000",  # Local development (IPv4)
        "https://user-behavior-analytics.vercel.app",  # Vercel deployment
    ],
    # FastAPI doesn't support wildcard strings in allow_origins.
    # Use a regex for Vercel preview deployments.
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

Base.metadata.create_all(bind=engine)

app.include_router(events.router)
app.include_router(funnels.router)
app.include_router(analytics.router)
app.include_router(apps.router)

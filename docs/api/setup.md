# Backend API - Setup & Environment

This page explains how to run and deploy the **Backend API** located in `backend/`.

## What the backend does

The backend is a FastAPI service that provides:

- **Event ingestion**: client SDKs send batches of events to `POST /events`
- **Analytics endpoints**: aggregated views like counts, funnels, paths, time-to-complete
- **Insights endpoints**: LLM-generated insights and comparisons
- **Apps CRUD** (admin-only): create/manage apps and API keys (protected by Supabase JWT)

## Tech stack (backend)

- **FastAPI** (web framework)
- **SQLAlchemy** (database ORM)
- **Postgres** (cloud database via `DATABASE_URL`)
- **Gunicorn + Uvicorn worker** (production server)
- **Supabase Auth** (dashboard auth; backend validates Supabase JWT)

## Prerequisites

- Python **3.11+**
- A Postgres database connection string (`DATABASE_URL`)
- (Recommended) A Supabase project for dashboard authentication

## Environment variables

The backend reads environment variables primarily from:

- Your shell environment (production)
- A local `.env` file (development)

### Required

- **`DATABASE_URL`**
  - Cloud Postgres connection string used by SQLAlchemy
  - Example (format varies by provider):
    - `postgresql://USER:PASSWORD@HOST:5432/DBNAME`

### Recommended (dashboard authentication)

The dashboard uses Supabase Auth and sends `Authorization: Bearer <jwt>`.

The backend validates that JWT using the Supabase JWKS endpoint.

- **`SUPABASE_URL`**
  - Example: `https://<project-ref>.supabase.co`
- **`SUPABASE_ANON_KEY`**
  - Used by the backend when fetching JWKS in some setups

> Notes:
> - If `SUPABASE_URL` is not set, the backend can fall back to `SUPABASE_JWT_SECRET` (HS256), but JWKS validation is preferred.
> - Do **not** commit secrets to the repo.

### Optional (LLM insights)

- **`LLM_PROVIDER`**
  - Default is `mock` (safe for academic/demo usage)
- **`OPENAI_API_KEY`**
  - Only needed if you enable real LLM calls

## Local development

### 1) Create a virtual environment and install dependencies

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2) Create `backend/.env`

Create `backend/.env` (this file is ignored by git):

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME"
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_ANON_KEY="<your-anon-key>"

# Optional:
# LLM_PROVIDER="mock"
# OPENAI_API_KEY="<only-if-needed>"
```

### 3) Run the server

```bash
uvicorn app.main:app --port 8000
```

You should see the FastAPI docs at:

- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`

## Database configuration notes

The database engine is configured in `backend/app/db/database.py`.

Behavior:

- If `DATABASE_URL` is not set, it falls back to **SQLite** (`sqlite:///./analytics.db`) for local dev.
  - This will create a local file in `backend/` (ignored by `.gitignore`).
- If `DATABASE_URL` is Postgres and appears to be Supabase, the code ensures `sslmode=require` by default.

## Authentication notes (Supabase)

Where auth is used:

- `POST /events`: uses **`api_key`** in the request body (SDK integration)
- `/apps/*`: uses **Supabase JWT** (dashboard integration)

How the backend validates JWT:

- Reads `Authorization: Bearer <token>`
- Fetches Supabase JWKS from: `<SUPABASE_URL>/auth/v1/.well-known/jwks.json`
- Verifies the token signature + audience
- Extracts the user id from the `sub` claim

The code lives in:

- `backend/app/core/auth.py`
- `backend/app/api/apps.py`

## CORS configuration

The backend sets CORS in `backend/app/main.py` to allow the dashboard origin(s) and localhost during development.

If you deploy the dashboard to a new domain, add it to the allowed origins list.

## Production deployment (Railway)

This repository includes a Railway config at `railway.json` and a Nixpacks config at `backend/nixpacks.toml`.

Key details:

- The process is started with:
  - Gunicorn + Uvicorn worker
  - Port bound to `0.0.0.0:$PORT`

On Railway, set environment variables:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- (Optional) `OPENAI_API_KEY`, `LLM_PROVIDER`

## Troubleshooting

### “401 Invalid token” from `/apps`

Common causes:

- Dashboard did not send `Authorization: Bearer <token>`
- Backend `SUPABASE_URL` is missing or incorrect
- Supabase project is paused/unavailable (JWKS fetch fails)

### DB connection issues

- Verify `DATABASE_URL` is correct
- For Supabase Postgres, ensure SSL is enabled (the backend defaults to `sslmode=require` for Supabase)

## Related documentation

- **Dashboard setup (frontend/admin portal)**: `../dashboard/overview.md`
  - Covers dashboard env vars like `NEXT_PUBLIC_API_URL` and Supabase client keys
- **Android SDK usage**: `../android-sdk/usage.md`
  - Covers SDK initialization (`api_key`, `endpoint`) and event tracking


# Backend API - Setup & Environment

This page explains how to run and deploy the **Backend API** located in `backend/`.

## What the backend does

The backend is a FastAPI service that provides:

- **Event ingestion**: client SDKs send batches of events to `POST /events`
- **Analytics endpoints**: aggregated views like counts, funnels, paths, time-to-complete
- **Insights endpoints**: LLM-generated insights and comparisons
- **Apps CRUD** (admin-only): create/manage apps and API keys (protected by login JWT)

## Tech stack (backend)

- **FastAPI** (web framework)
- **SQLAlchemy** (database ORM)
- **Postgres** ([Neon](https://neon.com) free tier via `DATABASE_URL`; SQLite locally)
- **Vercel Functions** (production hosting; Uvicorn locally)
- **Built-in auth** (scrypt password hashing + HS256 JWT via PyJWT)

## Prerequisites

- Python **3.11+**
- (Production) A Postgres connection string (`DATABASE_URL`), e.g. a free Neon project

## Environment variables

The backend reads environment variables primarily from:

- Your shell environment (production)
- A local `.env` file (development)

### Required

- **`JWT_SECRET`**
  - Signs dashboard login tokens. The backend refuses to start without it.
  - Generate one: `python -c "import secrets; print(secrets.token_urlsafe(32))"`

### Database

- **`DATABASE_URL`**
  - Postgres connection string used by SQLAlchemy. If unset, a local SQLite file is used.
  - Neon: create a free project at [neon.com](https://neon.com) → **Connect** → copy the connection string
    - `postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require`
  - Neon's free tier suspends compute when idle and resumes automatically on the next connection (no manual wake-up).

> Do **not** commit secrets to the repo.

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
JWT_SECRET="<random-secret>"
# DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require"

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
- Tables are created automatically on startup (`Base.metadata.create_all`).

## Authentication notes

Where auth is used:

- `POST /events`: uses **`api_key`** in the request body (SDK integration)
- `/auth/*`: email + password register/login, returns a JWT
- `/apps/*`: uses the **login JWT** (dashboard integration)

How it works:

- Passwords are hashed with `hashlib.scrypt` (random salt per user)
- Tokens are HS256 JWTs signed with `JWT_SECRET`, valid for 7 days
- Protected endpoints read `Authorization: Bearer <token>` and use the `sub` claim as `user_id`

The code lives in:

- `backend/app/core/auth.py`
- `backend/app/api/auth.py`
- `backend/app/api/apps.py`

Run the auth flow check:

```bash
cd backend
python -m tests.test_auth
```

## CORS configuration

The backend sets CORS in `backend/app/main.py` to allow the dashboard origin(s), Vercel previews, and localhost on any port.

If you deploy the dashboard to a new domain, add it to the allowed origins list.

## Production deployment (Vercel)

The backend deploys to Vercel's free Hobby plan with zero config: Vercel detects the
FastAPI `app` in `app/main.py` and runs it as a serverless function (no sleeping
server to wake up; idle instances start on the next request).

1. In Vercel: **Add New → Project**, import this repository
2. Set **Root Directory** to `backend`
3. Add environment variables:

- `DATABASE_URL` (Neon connection string)
- `JWT_SECRET`
- (Optional) `OPENAI_API_KEY`, `LLM_PROVIDER`

Vercel functions run in `iad1` (Washington, D.C.) by default, so create the Neon
project in **AWS US East 1 (N. Virginia)** to keep database round-trips short.

A `Dockerfile` is also included for running the backend in any container host.

## Troubleshooting

### “401 Invalid token” from `/apps`

Common causes:

- Dashboard did not send `Authorization: Bearer <token>`
- The token expired (7 days) — sign in again
- `JWT_SECRET` changed since the token was issued

### DB connection issues

- Verify `DATABASE_URL` is correct
- For Neon, keep `?sslmode=require` on the connection string

## Related documentation

- **Dashboard setup (frontend/admin portal)**: `../dashboard/overview.md`
  - Covers dashboard env vars like `NEXT_PUBLIC_API_URL`
- **Android SDK usage**: `../android-sdk/usage.md`
  - Covers SDK initialization (`api_key`, `endpoint`) and event tracking


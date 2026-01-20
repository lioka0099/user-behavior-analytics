# Backend API - Endpoints Reference

This page documents the REST endpoints exposed by the FastAPI backend.

## Base URL

- **Production**: `https://user-behavior-analytics-production.up.railway.app`
- **Local**: `http://localhost:8000`

Interactive API docs (when running):

- Swagger UI: `/docs`
- ReDoc: `/redoc`

## Authentication

This backend uses **two different authentication mechanisms**, depending on the endpoint.

### 1) SDK ingestion auth (API key)

- Used by: `POST /events`, most analytics endpoints that take `api_key`
- How it works: the SDK sends an **`api_key`** in the request body or query string
- Meaning: identifies **which tracked app/project** the events belong to

### 2) Dashboard auth (Supabase JWT)

- Used by: `/apps/*` endpoints (create/list/update/delete apps)
- How it works: the dashboard sends `Authorization: Bearer <supabase_access_token>`
- Meaning: identifies **which user** is making the request (backend uses `sub` claim as `user_id`)

## Common conventions

### Content type

- Requests with a JSON body should send:
  - `Content-Type: application/json`

### Error shape

FastAPI errors usually look like:

```json
{ "detail": "Some error message" }
```

## Events (ingestion)

### `POST /events`

Ingest a batch of events (used by the Android SDK).

- **Auth**: `api_key` in JSON body
- **Body**: `EventBatch`

Example request:

```bash
curl -X POST "http://localhost:8000/events" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "app_XXXXXXXX",
    "sent_at_ms": 1735368000999,
    "events": [
      {
        "event_name": "app_open",
        "timestamp_ms": 1735368000123,
        "session_id": "a4d9b8c2-7a1c-4d90-b92e-8c12f9a7d301",
        "platform": "android",
        "properties": { "source": "direct" }
      }
    ]
  }'
```

Success response:

```json
{ "status": "ok", "ingested": 1 }
```

## Analytics

All analytics endpoints are prefixed by `/analytics`.

### `GET /analytics/event-counts`

Returns a map of event name → count.

- **Auth**: optional `api_key` query param (if omitted, counts across all API keys)
- **Query**
  - `api_key` (optional)

Example:

```bash
curl "http://localhost:8000/analytics/event-counts?api_key=app_XXXXXXXX"
```

Response (example):

```json
{ "app_open": 12, "product_view": 40 }
```

### `GET /analytics/event-volume`

Daily event volume for the last N days (UTC).

- **Auth**: `api_key` query param
- **Query**
  - `api_key` (required)
  - `days` (optional, default 7, min 1 max 90)
  - `event_name` (optional; filter to a single event)

Example:

```bash
curl "http://localhost:8000/analytics/event-volume?api_key=app_XXXXXXXX&days=14"
```

Response (example):

```json
[
  { "date": "2026-01-07", "count": 0 },
  { "date": "2026-01-08", "count": 12 }
]
```

### `POST /analytics/funnel`

Run a funnel analysis on the provided steps.

- **Auth**: `api_key` in JSON body
- **Body**
  - `api_key` (optional in model, but typically required for real usage)
  - `steps` (required string[])

Example:

```bash
curl -X POST "http://localhost:8000/analytics/funnel" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "app_XXXXXXXX",
    "steps": ["home_view", "product_view", "checkout_start", "purchase_complete"]
  }'
```

Response (example):

```json
{
  "steps": ["home_view", "product_view", "checkout_start", "purchase_complete"],
  "sessions_entered": 120,
  "sessions_completed": 25,
  "conversion_rate": 0.2083
}
```

### `POST /analytics/dropoff/debug`

Calculate drop-off at each funnel step.

- **Auth**: `api_key` (optional) query param
- **Body**: JSON array of strings (steps)
- **Query**
  - `api_key` (optional)

Example:

```bash
curl -X POST "http://localhost:8000/analytics/dropoff/debug?api_key=app_XXXXXXXX" \
  -H "Content-Type: application/json" \
  -d '["home_view", "product_view", "checkout_start", "purchase_complete"]'
```

### `POST /analytics/time`

Compute duration stats between two events (per session).

- **Auth**: `api_key` in JSON body (optional)
- **Body**: `TimeToCompleteRequest`
  - `start_event` (string)
  - `end_event` (string)
  - `api_key` (optional)

Example:

```bash
curl -X POST "http://localhost:8000/analytics/time" \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "app_XXXXXXXX",
    "start_event": "checkout_start",
    "end_event": "purchase_complete"
  }'
```

Response (example when data exists):

```json
{
  "start_event": "checkout_start",
  "end_event": "purchase_complete",
  "count": 25,
  "average_ms": 42000,
  "median_ms": 39000,
  "min_ms": 8000,
  "max_ms": 120000
}
```

### `POST /analytics/paths`

Analyze common event paths through the app.

- **Auth**: `api_key` in JSON body (optional)
- **Body**: `PathAnalysisRequest`
  - `api_key` (optional)
  - `max_depth` (optional, default 10)

Example:

```bash
curl -X POST "http://localhost:8000/analytics/paths" \
  -H "Content-Type: application/json" \
  -d '{ "api_key": "app_XXXXXXXX", "max_depth": 6 }'
```

Response:

```json
{ "paths": [ /* backend returns path analysis output */ ] }
```

## Funnels (saved definitions)

Saved funnel definitions are under:

- `/analytics/definitions/funnel`

### `POST /analytics/definitions/funnel`

Create a saved funnel definition.

- **Auth**: `api_key` in JSON body
- **Body**
  - `api_key` (string)
  - `name` (string)
  - `steps` (string[])

### `GET /analytics/definitions/funnel?api_key=...`

List funnel definitions for an API key.

- **Auth**: `api_key` query param

### `GET /analytics/definitions/funnel/{definition_id}?api_key=...`

Get one funnel definition.

- **Auth**: `api_key` query param

### `POST /analytics/definitions/funnel/{definition_id}/run`

Run a saved funnel definition.

- **Auth**: `api_key` in JSON body
- **Body**
  - `api_key` (string)

## Insights

Insights endpoints are under `/analytics/insights*`.

### `POST /analytics/insights`

Generate an LLM insight for an API key and store it.

- **Auth**: `api_key` in JSON body
- **Body**
  - `api_key` (string)

### `GET /analytics/insights/history?api_key=...`

List stored insights for an API key (newest first).

- **Auth**: `api_key` query param

### `GET /analytics/insights/trends?api_key=...`

Generate trend analysis across historical insights (requires at least 2 insights).

- **Auth**: `api_key` query param

### `GET /analytics/insights/compare?api_key=...`

Compare the two most recent insights (rule-based diff + LLM explanation).

- **Auth**: `api_key` query param

## Apps (dashboard / admin)

Apps endpoints are prefixed by `/apps` and require **Supabase JWT auth**.

### Authorization header

All `/apps` requests must include:

```text
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
```

### `POST /apps`

Create a new app for the authenticated user.

- **Auth**: Bearer JWT
- **Body**: `AppCreate`
  - `name` (string)
  - `description` (optional string)

### `GET /apps`

List apps for the authenticated user.

- **Auth**: Bearer JWT

### `GET /apps/{app_id}`

Get a single app by id (only if owned by the user).

- **Auth**: Bearer JWT

### `PATCH /apps/{app_id}`

Update app name/description.

- **Auth**: Bearer JWT
- **Body**: `AppUpdate`
  - `name` (optional string)
  - `description` (optional string)

### `DELETE /apps/{app_id}`

Delete an app.

- **Auth**: Bearer JWT
- **Response**: `204 No Content`

### `POST /apps/{app_id}/regenerate-key`

Generate a new `api_key` for an existing app.

- **Auth**: Bearer JWT


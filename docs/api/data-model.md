# Backend API - Data Model (Database Tables)

This page documents the database schema used by the backend API.

Source of truth in code: `backend/app/db/models.py`

## Entity overview

- **`apps`**: apps/projects owned by a Supabase user, each app has a unique `api_key`
- **`events`**: raw event stream sent by SDKs, keyed by `api_key`
- **`funnel_definitions`**: saved funnels for a given `api_key`
- **`insights`**: stored AI insights for a given `api_key` (with optional snapshots for comparison)

## Table: `apps`

Purpose: store the tracked apps/projects a user owns and the API key used by SDKs.

Fields:

- **`id`** *(string UUID)*: primary key
- **`user_id`** *(string, indexed)*: Supabase user id (from JWT `sub`)
- **`api_key`** *(string, unique, indexed)*: API key used by SDKs and analytics filtering
- **`name`** *(string)*: human-readable app name
- **`description`** *(string | null)*: optional description
- **`created_at`** *(datetime)*: record creation time (UTC)
- **`updated_at`** *(datetime)*: updated automatically on change (UTC)

How it is used:

- The dashboard calls `/apps` endpoints (JWT-protected) to create and manage these rows.
- Developers copy the generated `api_key` into their Android app to initialize the SDK.

## Table: `events`

Purpose: store raw behavioral events ingested from SDKs.

Fields:

- **`id`** *(string UUID)*: primary key
- **`api_key`** *(string, indexed)*: which app/project the event belongs to
- **`event_name`** *(string, indexed)*: event name (e.g. `product_view`)
- **`session_id`** *(string, indexed)*: anonymous session identifier
- **`timestamp_ms`** *(bigint)*: client event timestamp (epoch ms)
- **`platform`** *(string | null)*: e.g. `android`
- **`properties`** *(json | null)*: event properties (primitives only, per schema)
- **`created_at`** *(datetime)*: server insert time (UTC)

How it is used:

- The Android SDK sends events to `POST /events`.
- Analytics endpoints read from this table to compute aggregates (counts, funnels, paths, etc.).

## Table: `funnel_definitions`

Purpose: store reusable funnel definitions per app.

Fields:

- **`id`** *(string UUID)*: primary key
- **`api_key`** *(string, indexed)*: which app/project this funnel belongs to
- **`name`** *(string)*: funnel name (e.g. “Purchase flow”)
- **`steps`** *(json)*: ordered list of event names *(string[])*
- **`created_at`** *(datetime)*: server insert time (UTC)

How it is used:

- The dashboard creates these via `/analytics/definitions/funnel`.
- The dashboard runs funnels via `/analytics/funnel` with the saved steps.

## Table: `insights`

Purpose: store AI-generated insights per app, and optionally store the analytics snapshot used for comparison.

Fields:

- **`id`** *(string UUID)*: primary key
- **`api_key`** *(string, indexed)*: which app/project this insight belongs to
- **`summary`** *(string)*: short summary
- **`insights`** *(json)*: list of insight strings *(string[])*
- **`recommendations`** *(json)*: list of recommendation strings *(string[])*
- **`analytics_snapshot`** *(json | null)*: stored snapshot for historical comparisons
- **`created_at`** *(datetime)*: server insert time (UTC)

How it is used:

- The dashboard can generate and view insights via `/analytics/insights` and `/analytics/insights/history`.
- The backend stores snapshots (when available) so it can compare the latest two insights.

## Diagram

This is a conceptual relationship diagram. Note that the links are by `api_key` (not DB foreign keys).

<img
  src="assets/RelationshipDiagram.png"
  alt="Data model relationship diagram (apps linked to events/funnels/insights by api_key)"
  width="900"
  style="max-width: 100%; height: auto;"
/>


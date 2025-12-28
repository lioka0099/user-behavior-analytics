# Event Schema – User Behavior Analytics

## Purpose
This document defines the canonical event format sent from client SDKs
(Android, iOS, Web) to the ingestion API.

All SDKs MUST send events that conform to this schema.

---

## Core Principles
- Events describe **what happened**, not interpretations.
- No Personally Identifiable Information is allowed in any field.
- Events are immutable once sent.
- All timestamps use Unix epoch milliseconds.

---

## Event Object

### Required Fields

| Field | Type | Description |
|------|------|-------------|
| `event_name` | string | Logical action name (e.g. `screen_view`) |
| `timestamp_ms` | number | Unix epoch in milliseconds |
| `session_id` | string | Random, anonymous session identifier |
| `platform` | string | `android` \| `ios` \| `web` |
| `properties` | object | Additional event metadata (may be empty) |

---

### Optional Fields

| Field | Type | Description |
|------|------|-------------|
| `event_id` | string | Client-generated UUID |
| `app_version` | string | App version (e.g. `1.2.0`) |
| `sdk_version` | string | SDK version (e.g. `0.1.0`) |
| `locale` | string | Device locale (e.g. `en-US`) |
| `timezone` | string | IANA timezone (e.g. `Asia/Jerusalem`) |

---

## Properties Rules

- Values must be **JSON primitives only**:
  - string
  - number
  - boolean
  - null
- Arrays of primitives are allowed
- Nested objects are NOT allowed
- Max total properties size: 8KB

---

## Example Event

```json
{
  "event_id": "f6b8c3d1-2c14-4a7b-9c10-3a9f1c9e8c22",
  "event_name": "lesson_completed",
  "timestamp_ms": 1735368000123,
  "session_id": "a4d9b8c2-7a1c-4d90-b92e-8c12f9a7d301",
  "platform": "android",
  "app_version": "1.0.0",
  "sdk_version": "0.1.0",
  "properties": {
    "lesson_id": "intro_1",
    "duration_sec": 120,
    "success": true
  }
}


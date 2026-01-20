# Android SDK - Event Schema & Privacy Rules

This page defines the canonical event format sent by SDKs (Android, Web, iOS) to the ingestion API (`POST /events`).

Source of truth:

- Spec: `sdk-spec/event-schema.md`
- Backend validation model: `backend/app/models/pydantic_models.py` (`Event`, `EventBatch`)

## Core principles

- Events describe **what happened** (facts), not interpretations.
- **No PII** (Personally Identifiable Information) should be sent.
- Events are immutable once sent.
- Timestamps are Unix epoch milliseconds.

## Batch payload (what the SDK sends)

SDKs send events in batches:

```json
{
  "api_key": "app_XXXXXXXX",
  "sent_at_ms": 1735368000999,
  "events": [ /* Event[] */ ]
}
```

Field meanings:

- **`api_key`**: identifies which tracked app/project the events belong to
- **`sent_at_ms`**: when the batch was sent (client time)
- **`events`**: array of event objects

## Event object

### Required fields

| Field | Type | Description |
|------|------|-------------|
| `event_name` | string | Logical action name (e.g. `screen_view`, `checkout_start`) |
| `timestamp_ms` | number | Unix epoch in milliseconds |
| `session_id` | string | Random, anonymous session identifier |
| `platform` | string | `android` \| `ios` \| `web` |
| `properties` | object | Additional metadata (may be empty) |

### Optional fields

| Field | Type | Description |
|------|------|-------------|
| `event_id` | string | Client-generated UUID |
| `app_version` | string | App version (e.g. `1.2.0`) |
| `sdk_version` | string | SDK version (e.g. `1.0.2`) |
| `locale` | string | Device locale (e.g. `en-US`) |
| `timezone` | string | IANA timezone (e.g. `Asia/Jerusalem`) |

## Properties rules (important)

For the MVP, event `properties` must follow these rules:

- Values must be **JSON primitives**:
  - string
  - number
  - boolean
  - null
- Arrays of primitives are allowed
- Nested objects are **not allowed**
- Max total properties payload size: **8KB**

## Example event

```json
{
  "event_id": "f6b8c3d1-2c14-4a7b-9c10-3a9f1c9e8c22",
  "event_name": "lesson_completed",
  "timestamp_ms": 1735368000123,
  "session_id": "a4d9b8c2-7a1c-4d90-b92e-8c12f9a7d301",
  "platform": "android",
  "app_version": "1.0.0",
  "sdk_version": "1.0.2",
  "properties": {
    "lesson_id": "intro_1",
    "duration_sec": 120,
    "success": true
  }
}
```

## How this maps to the code (current implementation)

### Android SDK DTOs

The Android library sends:

- `EventBatchDto(api_key, sent_at_ms, events)`
- `EventDto(event_name, timestamp_ms, session_id, platform, properties)`

### Backend validation

The backend validates the payload against:

- `EventBatch` (`api_key`, `sent_at_ms`, `events`)
- `Event` fields including optional metadata fields

## Privacy rules (what NOT to send)

The SDK should never send:

- Names, emails, phone numbers
- Account/user IDs
- Passwords, tokens, session cookies
- User-generated text (messages, form inputs)
- Exact GPS location
- Raw device identifiers (IMEI, Android ID, advertising ID)

Allowed identifiers:

- Random `session_id`
- Client-generated `event_id`

## Naming conventions (recommended)

To keep analytics consistent:

- Use `snake_case` for event names (e.g. `product_view`, `checkout_start`)
- Keep event names stable over time (avoid frequent renames)
- Put extra detail into `properties` instead of inventing many near-duplicate event names


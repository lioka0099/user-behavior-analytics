# User Behavior Analytics – SDK Specification (MVP)

## 1. Overview

This document defines the canonical specification for the **User Behavior Analytics**
platform.

The system collects **anonymous behavioral events** from client applications
(Android, Web, iOS), ingests them via a backend API, and produces analytics and
AI-generated insights — without collecting Personally Identifiable Information (PII).

This document is the **single source of truth** for:
- SDK behavior
- Event structure
- Privacy guarantees
- Backend ingestion expectations

---

## 2. Core Principles

- Privacy-first: no PII, no user identification
- Platform-agnostic: Android is one client, not the system center
- Events describe facts, not interpretations
- SDKs must be safe, silent, and non-intrusive
- MVP-first: minimal but extendable

---

## 3. Event Schema

### 3.1 Event Object (Canonical)

An **event** represents a single user action or system occurrence.

#### Required Fields

| Field | Type | Description |
|------|------|-------------|
| `event_name` | string | Logical action name (e.g. `screen_view`) |
| `timestamp_ms` | number | Unix epoch time in milliseconds |
| `session_id` | string | Random, anonymous session identifier |
| `platform` | string | `android` \| `ios` \| `web` |
| `properties` | object | Additional metadata (may be empty) |

---

#### Optional Fields

| Field | Type | Description |
|------|------|-------------|
| `event_id` | string | Client-generated UUID |
| `app_version` | string | Application version |
| `sdk_version` | string | SDK version |
| `locale` | string | Device locale (e.g. `en-US`) |
| `timezone` | string | IANA timezone (e.g. `Asia/Jerusalem`) |

---

### 3.2 Properties Rules

- Allowed value types:
  - string
  - number
  - boolean
  - null
- Arrays of primitives are allowed
- Nested objects are **not allowed** (MVP)
- Maximum properties payload size: **8KB**

---

### 3.3 Example Event

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

---
### 3.4 Batch Payload (Ingestion API)
SDKs send events in batches.
{
  "api_key": "pk_demo_123",
  "sent_at_ms": 1735368000999,
  "events": [ /* Event[] */ ]
}

---
## 4. SDK Public API
This section defines the developer-facing API exposed by the SDK.
---
### 4.1 Initialization
init(apiKey, config)
- Must be called once, at application startup
- Automatically creates a new session
---
### 4.2 Event Tracking
track(eventName, properties = {})
Rules:
- eventName must be a non-empty string
- properties must follow the schema rules
- Calling track must never crash the host application
- Invalid events are dropped silently

Examples:
track("screen_view", { "screen": "home" })
track("upgrade_clicked")
---
### 4.3 Flushing
flush()
Forces buffered events to be sent immediately.
Used when:
- App goes to background
- Manual testing
- Debugging
---
### 4.4 Session Management
getSessionId() -> string
startNewSession()
---
### 4.5 Configuration Options
| Option            | Type    | Default    |
| ----------------- | ------- | ---------- |
| `endpoint`        | string  | hosted API |
| `flushIntervalMs` | number  | 10000      |
| `maxBatchSize`    | number  | 30         |
| `maxQueueSize`    | number  | 1000       |
| `samplingRate`    | number  | 1.0        |
| `privacyMode`     | enum    | `STRICT`   |
| `debug`           | boolean | false      |

---
### 4.6 Error Handling
- SDK must never throw errors to the host app
- Network failures retry silently
- Privacy violations drop events in STRICT mode

---
## 5. Privacy Rules
### 5.1 PII (Forbidden Data)
The SDK MUST NOT collect:
- Names, emails, phone numbers
- IP addresses
- Raw device identifiers (IMEI, Android ID, advertising ID)
- User-generated text (messages, form inputs)
- Exact GPS location
- Account or user IDs
---
### 5.2 Allowed Identifiers
- Random session identifiers
- Event identifiers
- Hashed device identifiers (salted, client-side)
---
### 5.3 Data Minimization
- Collect only what is required for behavior analytics
- Prefer coarse data over exact
- No cross-session identity tracking
---
## 6. Android Usage Example
class MyApp : Application() {
  override fun onCreate() {
    super.onCreate()

    AnalyticsSDK.init(
      context = this,
      apiKey = "pk_demo_123",
      config = AnalyticsConfig(
        endpoint = "http://localhost:8000",
        flushIntervalMs = 10_000,
        debug = true
      )
    )
  }
}

AnalyticsSDK.track("screen_view", mapOf("screen" to "home"))
AnalyticsSDK.track("upgrade_clicked")


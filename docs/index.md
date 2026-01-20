# User Behavior Analytics — Documentation

This documentation covers the full project: the **Backend API**, **Android SDK**, **Demo App**, and the **Dashboard**.

## What this project is

User Behavior Analytics is a privacy-first analytics platform:

- **Client apps** (Android) track events using the **Android SDK**.
- The SDK sends events to the **Backend API** (`POST /events`).
- The backend stores data in a **cloud database** (configured with `DATABASE_URL`).
- The **Dashboard** (Next.js) is an admin portal for creating apps/API keys and viewing analytics/insights.

## Documentation map

- **Architecture**: [`architecture.md`](architecture.md)
- **Backend API**
  - Setup & environment: [`api/setup.md`](api/setup.md)
  - Endpoints reference: [`api/endpoints.md`](api/endpoints.md)
  - Database model (tables): [`api/data-model.md`](api/data-model.md)
- **Android SDK**
  - Installation (JitPack) & usage: [`android-sdk/usage.md`](android-sdk/usage.md)
  - Event schema & privacy rules: [`android-sdk/event-schema.md`](android-sdk/event-schema.md)
- **Demo App (ShopFlow)**: [`demo-app/shopflow.md`](demo-app/shopflow.md)
- **Dashboard (Admin Portal)**: [`dashboard/overview.md`](dashboard/overview.md)

## Dashboard preview

Quick look at the dashboard UI (full set in [`dashboard/overview.md`](dashboard/overview.md)).

![Dashboard apps](assets/Dashboard_Apps.png)

![Dashboard events](assets/Dashboard_Events.png)

![Dashboard insights](assets/Dashboard_Insights.png)

Charts preview:

![Dashboard charts (1)](assets/Dashboard_Charts1.png)

![Dashboard charts (2)](assets/Dashboard_Chart2.png)
# Dashboard - Admin Portal (Next.js)

This page documents the web dashboard located in `dashboard/`.

The dashboard is the **admin portal** for the platform:

- Users sign in/up with **Supabase Auth**
- Users can create/manage tracked apps (which generates `api_key` values)
- Users can view analytics, funnels, and insights for a selected `api_key`

## Tech stack

- Next.js (App Router)
- Supabase Auth (email/password)
- React Query (data fetching and caching)
- Tailwind CSS UI

## Running locally

```bash
cd dashboard
npm install
npm run dev
```

Open: `http://localhost:3000`

## Environment variables

Create `dashboard/.env.local`:

```bash
NEXT_PUBLIC_API_URL="https://user-behavior-analytics-production.up.railway.app"
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"
```

What they do:

- **`NEXT_PUBLIC_API_URL`**: backend base URL
- **`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`**: Supabase project keys used by the frontend client

## Authentication flow

Pages:

- `/register`: creates a new user in Supabase Auth
- `/login`: signs in and creates a Supabase session

Auth state is managed by `dashboard/src/lib/auth-context.tsx` (subscribes to Supabase session changes).

Protected pages use `ProtectedRoute` to redirect unauthenticated users to `/login`.

## How the dashboard talks to the backend

The dashboard uses `dashboard/src/lib/api.ts` as a centralized API client.

There are **two backend auth modes**:

### 1) JWT (Supabase) — used for app management

For `/apps` endpoints:

- The dashboard fetches the current Supabase session
- Sends `Authorization: Bearer <access_token>`

Examples (JWT-protected endpoints):

- `GET /apps`
- `POST /apps`
- `PATCH /apps/{app_id}`
- `DELETE /apps/{app_id}`
- `POST /apps/{app_id}/regenerate-key`

### 2) API key — used for analytics

For analytics endpoints, the dashboard uses an `api_key` stored in browser localStorage:

- localStorage key: `analytics_api_key`

Examples (api_key-scoped endpoints):

- `GET /analytics/event-counts?api_key=...`
- `GET /analytics/event-volume?api_key=...`
- `GET /analytics/insights/history?api_key=...`
- `GET /analytics/definitions/funnel?api_key=...`

## Typical user flow (end-to-end)

1. User opens dashboard and signs in
2. User creates an app in `/apps`
3. Backend returns an app record including `api_key`
4. Developer puts that `api_key` into the Android app (SDK init)
5. Android app sends events to backend
6. Dashboard shows analytics for the selected `api_key`

## Deployment (Vercel)

Deploy the `dashboard/` folder to Vercel.

In Vercel project settings, set the same environment variables as `.env.local`:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Screenshots & walkthrough

### Login / Register

![Dashboard login](../assets/Dashboard_Login.png)

![Dashboard register](../assets/Dashboard_Register.png)

### Apps

![Dashboard apps](../assets/Dashboard_Apps.png)

### Settings (API key / configuration)

![Dashboard settings](../assets/Dashboard_Settings.png)

### Events

![Dashboard events](../assets/Dashboard_Events.png)

### Funnels

![Dashboard funnels](../assets/Dashboard_Fannels.png)

### Insights

![Dashboard insights](../assets/Dashboard_Insights.png)

### Charts

![Dashboard charts (1)](../assets/Dashboard_Charts1.png)

![Dashboard charts (2)](../assets/Dashboard_Chart2.png)


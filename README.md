# 📊 User Behavior Analytics

> A platform for collecting anonymous behavioral events from Android apps, storing them in the cloud, and exploring analytics with AI-powered insights.

## 🌟 Overview

User Behavior Analytics is a comprehensive end-to-end system that enables developers to track, analyze, and gain insights from user behavior in their Android applications—all while maintaining user privacy through anonymous event collection.

### System Components

- **🔧 Backend API** (FastAPI) - Event ingestion, analytics engine, and app management
- **📱 Dashboard** (Next.js) - Admin portal with Supabase authentication
- **📲 Android SDK** (Kotlin) - Developer library for seamless event tracking
- **🛍️ Demo App** (ShopFlow) - Real-world implementation example
- **📚 Documentation** - Comprehensive guides hosted on GitHub Pages

---

## 🔗 Quick Links

| Resource | URL |
|----------|-----|
| **Documentation** | [https://lioka0099.github.io/user-behavior-analytics/](https://lioka0099.github.io/user-behavior-analytics/) |
| **Backend API** | [https://user-behavior-analytics-production.up.railway.app](https://user-behavior-analytics-production.up.railway.app) |
| **Dashboard** | [https://user-behavior-analytics.vercel.app](https://user-behavior-analytics.vercel.app) |

---

## 🏗️ Architecture

<img src="docs/assets/ArchitectureDiagram.png" alt="Architecture diagram" width="900" style="max-width: 100%; height: auto;" />

### Authentication Modes

The system uses two distinct authentication mechanisms:

1. **SDK Ingestion** - Uses `api_key` sent in the batch request body
2. **Dashboard Management** - Uses `Authorization: Bearer <Supabase JWT>` for `/apps/*` endpoints

---

## ✨ Key Features

- 📈 **Event Tracking** - Track user interactions with `init`, `track`, and `flush` methods
- 📊 **Analytics Dashboard** - View event counts, volume trends, user paths, and conversion funnels
- 🔍 **Funnel Analysis** - Create, save, and analyze conversion funnels
- 🤖 **AI Insights** - Generate intelligent insights and compare behavioral snapshots
- ⚙️ **App Management** - Full CRUD operations with API key regeneration

---

## 📁 Project Structure

```text
user-behavior-analytics/
├── backend/              # FastAPI service + SQLAlchemy models + analytics logic
├── dashboard/            # Next.js admin portal (Supabase auth)
├── sdk/android/          # Android library module (analytics-sdk)
├── demo-app/ShopFlow/    # Android demo app (uses the published SDK)
├── docs/                 # Documentation (GitHub Pages)
└── sdk-spec/             # Early spec/reference docs
```

### 🔧 Backend Structure

```text
backend/
├── app/
│   ├── main.py                # FastAPI app entrypoint (routers + CORS)
│   ├── api/                   # FastAPI routers (HTTP endpoints)
│   │   ├── events.py          # POST /events
│   │   ├── analytics.py       # /analytics/*
│   │   ├── funnels.py         # /analytics/definitions/funnel/*
│   │   └── apps.py            # /apps/* (JWT-protected)
│   ├── db/                    # DB engine/session + SQLAlchemy models
│   │   ├── database.py
│   │   ├── models.py
│   │   └── deps.py
│   ├── storage/               # DB read/write helpers (CRUD utilities)
│   │   ├── events.py
│   │   ├── apps.py
│   │   ├── funnel_definitions.py
│   │   └── insights.py
│   ├── analytics/             # Analytics computations
│   │   ├── funnel.py
│   │   ├── dropoff.py
│   │   ├── path_analysis.py
│   │   └── time_analysis.py
│   ├── insights/              # Insight generation (snapshots + prompts + provider)
│   │   ├── snapshot.py
│   │   ├── prompts.py
│   │   ├── generator.py
│   │   └── models.py
│   ├── core/                  # Config + Supabase JWT validation
│   │   ├── config.py
│   │   └── auth.py
│   └── models/                # Pydantic request/response models
│       ├── app.py
│       └── pydantic_models.py
├── requirements.txt
├── Dockerfile
└── nixpacks.toml
```

### 📱 Dashboard Structure

```text
dashboard/
├── src/
│   ├── app/                   # Next.js routes (App Router)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── apps/
│   │       ├── page.tsx
│   │       └── [appId]/
│   │           ├── dashboard/page.tsx
│   │           ├── events/page.tsx
│   │           ├── funnels/page.tsx
│   │           ├── insights/page.tsx
│   │           └── settings/page.tsx
│   ├── components/            # Layout + UI components + pages
│   └── lib/                   # API client + Supabase client + auth context
│       ├── api.ts
│       ├── supabase.ts
│       └── auth-context.tsx
└── package.json
```

### 📲 Android SDK Structure

```text
sdk/android/
└── analytics-sdk/
    └── src/main/java/com/example/analytics/
        ├── AnalyticsSDK.kt
        ├── AnalyticsEvent.kt
        ├── EventQueue.kt
        └── network/
            ├── AnalyticsApi.kt
            ├── RetrofitClient.kt
            ├── EventDto.kt
            └── EventBatchDto.kt
```

### 🛍️ Demo App Structure

```text
demo-app/ShopFlow/
└── app/
    ├── build.gradle.kts        # ANALYTICS_API_KEY / ANALYTICS_ENDPOINT
    └── src/main/java/com/example/shopflow/
        ├── MainActivity.kt     # initializes AnalyticsSDK
        └── ui/screens/         # screens call AnalyticsSDK.track(...)
```

### 📚 Documentation Structure

```text
docs/
├── index.md
├── architecture.md
├── api/
├── android-sdk/
├── dashboard/
├── demo-app/
└── assets/                     # screenshots + diagrams
```

---

## 🔄 How It Works (End-to-End Flow)

1. **Authentication** - User signs in to the dashboard via Supabase Auth
2. **App Creation** - User creates an App in `/apps`, backend generates an `api_key`
3. **SDK Configuration** - Developer configures Android app with the `api_key` and backend endpoint
4. **Event Collection** - SDK sends event batches to the backend via `POST /events`
5. **Analytics & Insights** - Dashboard queries analytics and insights for the selected `api_key`

---

## 🚀 Quickstart (Local Development)

### Backend API

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Interactive API Documentation:**
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Dashboard

```bash
cd dashboard
npm install
npm run dev
```

**Access:** `http://localhost:3000`

### Demo App (ShopFlow)

1. Open `demo-app/ShopFlow` in Android Studio
2. Update configuration in `demo-app/ShopFlow/app/build.gradle.kts`:
   - `ANALYTICS_API_KEY`
   - `ANALYTICS_ENDPOINT`
3. Run on emulator or physical device

---

## ⚙️ Configuration

### Backend Environment Variables

Create `backend/.env` with the following:

```bash
# Database
DATABASE_URL=postgresql://...

# Supabase (JWT validation via JWKS)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# LLM Configuration
LLM_PROVIDER=mock  # or 'openai' for real AI insights
OPENAI_API_KEY=sk-...  # required if LLM_PROVIDER=openai
```

> Note:
> - `SUPABASE_ANON_KEY` here is used by the **backend** during Supabase JWT (JWKS) verification in some setups.
> - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (dashboard) is the **public** key used by the browser-side Supabase client.

### Dashboard Environment Variables

Create `dashboard/.env.local` with the following:

```bash
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📲 Android SDK Integration

### Installation via JitPack

Add to your `build.gradle.kts`:

1) Make sure the JitPack repository is enabled:

```kotlin
repositories {
    maven("https://jitpack.io")
}
```

2) Add the dependency:

```kotlin
implementation("com.github.lioka0099:user-behavior-analytics:1.0.2")
```

### Usage Example

```kotlin
import com.example.analytics.AnalyticsSDK

// Initialize the SDK
AnalyticsSDK.init(
    context = this,
    apiKey = "app_XXXXXXXX",
    endpoint = "https://user-behavior-analytics-production.up.railway.app/",
    flushThreshold = 0
)

// Track events
AnalyticsSDK.track("app_open", mapOf("source" to "direct"))
AnalyticsSDK.track("button_click", mapOf("button_id" to "checkout"))

// Flush events to backend
AnalyticsSDK.flush()
```

---

## 📸 Screenshots

### Dashboard

<div align="center">

#### 📋 Apps Management
<img src="docs/assets/Dashboard_Apps.png" alt="Dashboard apps" width="800" />

#### ⚙️ Settings (API Key)
<img src="docs/assets/Dashboard_Settings.png" alt="Dashboard settings" width="800" />

#### 📊 Events Overview
<img src="docs/assets/Dashboard_Events.png" alt="Dashboard events" width="800" />

#### 🔍 Funnel Analysis
<img src="docs/assets/Dashboard_Fannels.png" alt="Dashboard funnels" width="800" />

#### 🤖 AI Insights
<img src="docs/assets/Dashboard_Insights.png" alt="Dashboard insights" width="800" />

#### 📈 Analytics Charts
<img src="docs/assets/Dashboard_Charts1.png" alt="Dashboard charts 1" width="800" />

#### 📉 Detailed Charts
<img src="docs/assets/Dashboard_Chart2.png" alt="Dashboard charts 2" width="800" />

</div>

### Demo App (ShopFlow)

<table>
  <tr>
    <td align="center">
      <img src="docs/assets/ShopFlow_Homescreen.jpg" alt="ShopFlow home screen" width="260" />
      <br />
      <sub><b>🏠 Home Screen</b></sub>
    </td>
    <td align="center">
      <img src="docs/assets/ShopFlow_ProductView.jpg" alt="ShopFlow product view" width="260" />
      <br />
      <sub><b>👕 Product View</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="docs/assets/Shopflow_ShoppingCart.jpg" alt="ShopFlow shopping cart" width="260" />
      <br />
      <sub><b>🛒 Shopping Cart</b></sub>
    </td>
    <td align="center">
      <img src="docs/assets/Shopflow_Checkout.jpg" alt="ShopFlow checkout" width="260" />
      <br />
      <sub><b>💳 Checkout</b></sub>
    </td>
  </tr>
</table>

---

## 🚢 Deployment

The platform is deployed across multiple services:

| Component | Platform | Configuration |
|-----------|----------|---------------|
| **Documentation** | GitHub Pages | `.github/workflows/pages.yml` |
| **Backend API** | Railway | `railway.json`, `backend/nixpacks.toml` |
| **Dashboard** | Vercel | `dashboard/` |

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).




---

<p align="center">Made with ❤️ for better user analytics</p>
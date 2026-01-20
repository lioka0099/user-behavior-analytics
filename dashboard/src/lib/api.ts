/**
 * API Client for User Behavior Analytics Backend
 * 
 * This file centralizes all HTTP requests to our FastAPI backend.
 * Instead of writing fetch() calls in every component, we use this client.
 */

// The backend URL - uses environment variable or defaults to your Railway deployment
// Remove trailing slash if present to avoid double slashes in URLs
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://user-behavior-analytics-production.up.railway.app"
).replace(/\/+$/, "");

// ============ Type Definitions ============
// These tell TypeScript what shape the data has

/** Event counts - maps event name to count */
export interface EventCount {
  [eventName: string]: number;
}

/** Timeseries point (bucketed counts) */
export interface TimeseriesPoint {
  date: string; // YYYY-MM-DD (UTC)
  count: number;
}

/** A saved funnel definition */
export interface FunnelDefinition {
  id: string;
  api_key: string;
  name: string;
  steps: string[];
  created_at: string;
}

/** Result of running a funnel analysis */
export interface FunnelResult {
  steps: string[];
  sessions_entered: number;
  sessions_completed: number;
  conversion_rate: number;
}

/** An LLM-generated insight */
export interface Insight {
  id: string;
  summary: string;
  insights: string[];
  recommendations: string[];
  has_snapshot: boolean;
  created_at: string;
}

/** Result of comparing two insights */
export interface InsightComparison {
  comparison: {
    previous_insight_id: string;
    previous_created_at: string;
    latest_insight_id: string;
    latest_created_at: string;
  };
  diff: {
    metrics_changed: Record<string, unknown>;
    issues: string[];
    improvements: string[];
    overall_trend: "improving" | "degrading" | "stable";
  };
  explanation: {
    interpretation: string;
    likely_causes: string[];
    recommended_actions: string[];
    priority: "high" | "medium" | "low";
  };
  compared_at: string;
}

/** App model for TypeScript */
export interface App {
  id: string;
  user_id: string;
  api_key: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ============ API Client Class ============

// Helper to safely access localStorage (not available during SSR)
const getStoredApiKey = (): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("analytics_api_key") || "";
  }
  return "";
};

/**
 * Get JWT token from Supabase session
 * This is called dynamically to get the latest session
 */
async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const { supabase } = await import("./supabase");
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.warn("Failed to get session:", error);
      return null;
    }
    if (!session) {
      console.warn("No active session found");
      return null;
    }
    return session.access_token || null;
  } catch (error) {
    console.warn("Failed to get auth token:", error);
    return null;
  }
}

/**
 * Build headers for authenticated requests
 */
async function getAuthHeaders(includeContentType = true): Promise<HeadersInit> {
  const headers: HeadersInit = {};

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  const token = await getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

class ApiClient {
  private apiKey: string;

  constructor() {
    this.apiKey = getStoredApiKey();
  }

  /** Update the API key and persist to localStorage */
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    if (typeof window !== "undefined") {
      localStorage.setItem("analytics_api_key", apiKey);
    }
  }

  /** Get the current API key */
  getApiKey(): string {
    // Re-read from localStorage in case it changed
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("analytics_api_key");
      if (stored) this.apiKey = stored;
    }
    return this.apiKey;
  }

  /** Check if API key is configured */
  hasApiKey(): boolean {
    return this.getApiKey().length > 0;
  }

  /** Ensure we have an API key configured (dashboard requirement). */
  private requireApiKey(): string {
    const key = this.getApiKey();
    if (!key.trim()) {
      throw new Error("API key is required. Go to Apps → Settings and set/select an app.");
    }
    return key;
  }

  /** Fetch event counts from backend */
  async getEventCounts(): Promise<EventCount> {
    this.requireApiKey();
    const response = await fetch(
      `${API_BASE_URL}/analytics/event-counts?api_key=${this.apiKey}`
    );
    if (!response.ok) throw new Error("Failed to fetch event counts");
    return response.json();
  }

  /**
   * Daily total event volume for last N days (UTC).
   * Optionally filter to a single event name.
   */
  async getEventVolume(days = 7, eventName?: string): Promise<TimeseriesPoint[]> {
    this.requireApiKey();
    const params = new URLSearchParams({
      api_key: this.apiKey,
      days: String(days),
    });
    if (eventName) params.set("event_name", eventName);

    const response = await fetch(`${API_BASE_URL}/analytics/event-volume?${params}`);
    if (!response.ok) throw new Error("Failed to fetch event volume");
    return response.json();
  }

  /** Get all funnel definitions for this API key */
  async getFunnelDefinitions(): Promise<FunnelDefinition[]> {
    this.requireApiKey();
    const response = await fetch(
      `${API_BASE_URL}/analytics/definitions/funnel?api_key=${this.apiKey}`
    );
    if (!response.ok) throw new Error("Failed to fetch funnel definitions");
    return response.json();
  }

  /** Create a new funnel definition */
  async createFunnelDefinition(
    name: string,
    steps: string[]
  ): Promise<FunnelDefinition> {
    this.requireApiKey();
    const response = await fetch(
      `${API_BASE_URL}/analytics/definitions/funnel`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: this.apiKey, name, steps }),
      }
    );
    if (!response.ok) throw new Error("Failed to create funnel");
    return response.json();
  }

  /** Run funnel analysis on given steps */
  async runFunnel(steps: string[]): Promise<FunnelResult> {
    this.requireApiKey();
    const response = await fetch(`${API_BASE_URL}/analytics/funnel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: this.apiKey, steps }),
    });
    if (!response.ok) throw new Error("Failed to run funnel");
    return response.json();
  }

  /** Get all saved insights */
  async getInsightHistory(): Promise<Insight[]> {
    this.requireApiKey();
    const response = await fetch(
      `${API_BASE_URL}/analytics/insights/history?api_key=${this.apiKey}`
    );
    if (!response.ok) throw new Error("Failed to fetch insights");
    return response.json();
  }

  /** Generate a new LLM insight */
  async generateInsight(): Promise<Insight> {
    this.requireApiKey();
    const response = await fetch(`${API_BASE_URL}/analytics/insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: this.apiKey }),
    });
    if (!response.ok) throw new Error("Failed to generate insight");
    return response.json();
  }

  /** Compare insights: rule-based diff + LLM explanation */
  async compareInsights(): Promise<InsightComparison> {
    this.requireApiKey();
    const response = await fetch(
      `${API_BASE_URL}/analytics/insights/compare?api_key=${this.apiKey}`
    );
    if (!response.ok) throw new Error("Failed to compare insights");
    return response.json();
  }

  // =============================================================================
  // App Management Endpoints (Require Authentication)
  // =============================================================================

  /** Get all apps for the authenticated user */
  async getApps(): Promise<App[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/apps`, {
      headers,
    });
    if (!response.ok) {
      if (response.status === 401) {
        // Keep UI messages clean; log any server detail to console for debugging.
        const error = await response.json().catch(() => null);
        if (error) console.warn("Apps request unauthorized:", error);
        throw new Error("Authentication required. Please log in.");
      }
      throw new Error("Failed to fetch apps");
    }
    return response.json();
  }

  /** Create a new app */
  async createApp(name: string, description?: string): Promise<App> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/apps`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name, description }),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required. Please log in.");
      }
      const error = await response.json().catch(() => ({ detail: "Failed to create app" }));
      throw new Error(error.detail || "Failed to create app");
    }
    return response.json();
  }

  /** Get a specific app by ID */
  async getApp(appId: string): Promise<App> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/apps/${appId}`, {
      headers,
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required. Please log in.");
      }
      if (response.status === 404) {
        throw new Error("App not found");
      }
      throw new Error("Failed to fetch app");
    }
    return response.json();
  }

  /** Update an app */
  async updateApp(
    appId: string,
    updates: { name?: string; description?: string }
  ): Promise<App> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/apps/${appId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required. Please log in.");
      }
      if (response.status === 404) {
        throw new Error("App not found");
      }
      throw new Error("Failed to update app");
    }
    return response.json();
  }

  /** Delete an app */
  async deleteApp(appId: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/apps/${appId}`, {
      method: "DELETE",
      headers,
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required. Please log in.");
      }
      if (response.status === 404) {
        throw new Error("App not found");
      }
      throw new Error("Failed to delete app");
    }
  }

  /** Regenerate API key for an app */
  async regenerateApiKey(appId: string): Promise<App> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/apps/${appId}/regenerate-key`, {
      method: "POST",
      headers,
    });
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Authentication required. Please log in.");
      }
      if (response.status === 404) {
        throw new Error("App not found");
      }
      throw new Error("Failed to regenerate API key");
    }
    return response.json();
  }
}

// Export a singleton instance - all components share this
// API key is persisted to localStorage and must be set by user in Settings
export const api = new ApiClient();
export default api;


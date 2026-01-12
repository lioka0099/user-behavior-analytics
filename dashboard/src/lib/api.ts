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

// ============ API Client Class ============

// Helper to safely access localStorage (not available during SSR)
const getStoredApiKey = (): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("analytics_api_key") || "";
  }
  return "";
};

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

  /** Fetch event counts from backend */
  async getEventCounts(): Promise<EventCount> {
    const response = await fetch(
      `${API_BASE_URL}/analytics/event-counts?api_key=${this.apiKey}`
    );
    if (!response.ok) throw new Error("Failed to fetch event counts");
    return response.json();
  }

  /** Get all funnel definitions for this API key */
  async getFunnelDefinitions(): Promise<FunnelDefinition[]> {
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
    const response = await fetch(`${API_BASE_URL}/analytics/funnel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps }),
    });
    if (!response.ok) throw new Error("Failed to run funnel");
    return response.json();
  }

  /** Get all saved insights */
  async getInsightHistory(): Promise<Insight[]> {
    const response = await fetch(
      `${API_BASE_URL}/analytics/insights/history?api_key=${this.apiKey}`
    );
    if (!response.ok) throw new Error("Failed to fetch insights");
    return response.json();
  }

  /** Generate a new LLM insight */
  async generateInsight(): Promise<Insight> {
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
    const response = await fetch(
      `${API_BASE_URL}/analytics/insights/compare?api_key=${this.apiKey}`
    );
    if (!response.ok) throw new Error("Failed to compare insights");
    return response.json();
  }
}

// Export a singleton instance - all components share this
// API key is persisted to localStorage and must be set by user in Settings
export const api = new ApiClient();
export default api;


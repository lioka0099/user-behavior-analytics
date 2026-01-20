"use client";

import { useParams } from "next/navigation";
import { AppScope } from "@/components/app-scope";
import { InsightsPage } from "@/components/pages/insights-page";

/**
 * App-scoped Insights Route
 *
 * Reads `appId` from the URL and wraps the shared `InsightsPage` with `AppScope`
 * so insights are generated and fetched for the selected app.
 */
export default function AppInsightsPage() {
  const params = useParams<{ appId?: string | string[] }>();
  const raw = params?.appId;
  const appId = Array.isArray(raw) ? raw[0] : raw;

  if (!appId) return null;

  return (
    <AppScope appId={appId}>
      <InsightsPage />
    </AppScope>
  );
}


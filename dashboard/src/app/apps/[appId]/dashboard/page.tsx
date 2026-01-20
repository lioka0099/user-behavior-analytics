"use client";

import { useParams } from "next/navigation";
import { AppScope } from "@/components/app-scope";
import { DashboardPage } from "@/components/pages/dashboard-page";

/**
 * App-scoped Dashboard Route
 *
 * Reads `appId` from the URL and wraps the shared `DashboardPage` with `AppScope`
 * so the API client is configured with the selected app's API key.
 */
export default function AppDashboardPage() {
  const params = useParams<{ appId?: string | string[] }>();
  const raw = params?.appId;
  const appId = Array.isArray(raw) ? raw[0] : raw;

  if (!appId) return null;

  return (
    <AppScope appId={appId}>
      <DashboardPage />
    </AppScope>
  );
}


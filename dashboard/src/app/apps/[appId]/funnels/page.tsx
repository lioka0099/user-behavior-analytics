"use client";

import { useParams } from "next/navigation";
import { AppScope } from "@/components/app-scope";
import { FunnelsPage } from "@/components/pages/funnels-page";

/**
 * App-scoped Funnels Route
 *
 * Reads `appId` from the URL and wraps the shared `FunnelsPage` with `AppScope`
 * so the analytics API key is set for this app.
 */
export default function AppFunnelsPage() {
  const params = useParams<{ appId?: string | string[] }>();
  const raw = params?.appId;
  const appId = Array.isArray(raw) ? raw[0] : raw;

  if (!appId) return null;

  return (
    <AppScope appId={appId}>
      <FunnelsPage />
    </AppScope>
  );
}


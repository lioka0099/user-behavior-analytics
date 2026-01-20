"use client";

import { useParams } from "next/navigation";
import { AppScope } from "@/components/app-scope";
import { EventsPage } from "@/components/pages/events-page";

/**
 * App-scoped Events Route
 *
 * Reads `appId` from the URL and wraps the shared `EventsPage` with `AppScope`
 * so all requests are made for the selected app's API key.
 */
export default function AppEventsPage() {
  const params = useParams<{ appId?: string | string[] }>();
  const raw = params?.appId;
  const appId = Array.isArray(raw) ? raw[0] : raw;

  if (!appId) return null;

  return (
    <AppScope appId={appId}>
      <EventsPage />
    </AppScope>
  );
}


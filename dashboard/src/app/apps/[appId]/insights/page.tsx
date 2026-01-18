"use client";

import { useParams } from "next/navigation";
import { AppScope } from "@/components/app-scope";
import { InsightsPage } from "@/components/pages/insights-page";

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


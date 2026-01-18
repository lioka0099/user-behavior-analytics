"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy global Settings page.
 *
 * The dashboard is now app-scoped (each app has its own API key), so we redirect:
 * - If a current app is selected → `/apps/[appId]/settings`
 * - Otherwise → `/apps`
 */
export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    const currentAppId = localStorage.getItem("analytics_current_app_id");
    if (currentAppId) {
      router.replace(`/apps/${currentAppId}/settings`);
    } else {
      router.replace("/apps");
    }
  }, [router]);

  return null;
}


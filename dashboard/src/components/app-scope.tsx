"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import api, { type App } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * AppScope
 *
 * Ensures we have the selected app's API key loaded (from backend, via JWT),
 * then stores it in the existing `api` client (localStorage) so all analytics
 * pages automatically query data for that app.
 */
export function AppScope({
  appId,
  children,
}: {
  appId: string;
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentAppIdKey = "analytics_current_app_id";

  const shouldFetch = useMemo(() => {
    if (typeof window === "undefined") return true;
    const currentAppId = localStorage.getItem(currentAppIdKey);
    const currentApiKey = api.getApiKey();
    return currentAppId !== appId || !currentApiKey;
  }, [appId]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setIsLoading(true);
        setError(null);

        if (!shouldFetch) {
          setIsLoading(false);
          return;
        }

        const app: App = await api.getApp(appId);
        if (cancelled) return;

        api.setApiKey(app.api_key);
        localStorage.setItem(currentAppIdKey, appId);

        setIsLoading(false);
      } catch (e) {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : "Failed to load app";
        setError(message);
        setIsLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [appId, shouldFetch]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="h-5 w-5 animate-spin text-violet-500" />
          Loading app…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
          <CardContent className="space-y-4 py-8">
            <p className="text-sm text-rose-400">{error}</p>
            <div className="flex gap-3">
              <Link href="/apps">
                <Button className="bg-violet-600 hover:bg-violet-700">
                  Back to apps
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}


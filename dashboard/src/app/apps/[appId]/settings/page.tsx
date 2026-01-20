"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Copy, RefreshCw, Settings } from "lucide-react";

import { AppScope } from "@/components/app-scope";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * App-scoped Settings Route
 *
 * Lets the user view/copy/regenerate the API key for the selected app.
 * Uses `AppScope` so the dashboard's API client stays aligned with the current app.
 */
function AppSettingsContent({ appId }: { appId: string }) {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setApiKey(api.getApiKey());
  }, []);

  const regenerate = useMutation({
    mutationFn: async () => api.regenerateApiKey(appId),
    onSuccess: async (updated) => {
      api.setApiKey(updated.api_key);
      setApiKey(updated.api_key);
      // Refresh all app-scoped cached data
      await queryClient.invalidateQueries();
    },
  });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const apiEndpoint =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://user-behavior-analytics-production.up.railway.app";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-slate-400">Manage this app’s API key</p>
        </div>
        <Link href="/apps">
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Back to apps
          </Button>
        </Link>
      </div>

      <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20">
              <Settings className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-lg">API key</CardTitle>
              <p className="text-sm text-slate-400">Used by the SDK to send events</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
            <div>
              <p className="text-sm font-medium text-slate-300">Current API key</p>
              <p className="mt-1 font-mono text-sm text-violet-300">{apiKey || "—"}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCopy}
                disabled={!apiKey}
                variant="outline"
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <Copy className="mr-2 h-4 w-4" />
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button
                onClick={() => regenerate.mutate()}
                disabled={regenerate.isPending}
                className="bg-violet-600 hover:bg-violet-700"
              >
                <RefreshCw className={regenerate.isPending ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
                Regenerate
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
            <div>
              <p className="text-sm font-medium text-slate-300">API endpoint</p>
              <p className="text-sm text-slate-500">Where the SDK should send events</p>
            </div>
            <Badge variant="outline" className="border-slate-700 bg-slate-900/40 text-slate-300">
              {apiEndpoint}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AppSettingsPage() {
  const params = useParams<{ appId?: string | string[] }>();
  const raw = params?.appId;
  const appId = Array.isArray(raw) ? raw[0] : raw;

  if (!appId) return null;

  return (
    <AppScope appId={appId}>
      <AppSettingsContent appId={appId} />
    </AppScope>
  );
}


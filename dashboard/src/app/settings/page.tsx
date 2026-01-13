"use client";

import { useState, useEffect } from "react";
import { Settings, Key, Server, CheckCircle, Save, Sparkles, Copy, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

/**
 * Generate a unique API key
 * Format: app_xxxxxxxx (8 random hex characters)
 */
function generateApiKey(): string {
  const randomPart = Math.random().toString(16).substring(2, 10);
  return `app_${randomPart}`;
}

/**
 * Settings Page
 * - Generate or configure API key
 * - View connection status
 * - Show API endpoint info
 */
export default function SettingsPage() {
  // State for API key input
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load current API key on mount
  useEffect(() => {
    setApiKey(api.getApiKey());
  }, []);

  // Handle save
  const handleSave = () => {
    api.setApiKey(apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Generate new API key
  const handleGenerate = () => {
    const newKey = generateApiKey();
    setApiKey(newKey);
    api.setApiKey(newKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Copy API key to clipboard
  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // API endpoint (from environment or default)
  const apiEndpoint =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://user-behavior-analytics-production.up.railway.app";

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-slate-400">
          Configure your analytics dashboard
        </p>
      </div>

      {/* API Key Configuration */}
      <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20">
              <Key className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-lg">API Key</CardTitle>
              <p className="text-sm text-slate-400">
                Your unique identifier for accessing analytics data
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {/* API Key Input */}
            <div>
              <label
                htmlFor="apiKey"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                API Key
              </label>
              <div className="flex gap-2">
                <input
                  id="apiKey"
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key or generate a new one"
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-mono text-sm text-violet-400 placeholder:font-sans placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                {apiKey && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="text-slate-400 hover:text-white"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Use this unique key in your Android SDK initialization or enter an existing one.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={!apiKey.trim()}
                className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Key
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerate}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate New Key
              </Button>
            </div>

            {/* Success Message */}
            {saved && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3">
                <p className="flex items-center text-sm text-emerald-400">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  API key saved successfully!
                </p>
              </div>
            )}

            {/* SDK Integration Instructions */}
            {apiKey && (
              <div className="rounded-lg bg-slate-800/50 p-4">
                <h4 className="text-sm font-medium text-slate-300">SDK Integration</h4>
                <p className="mt-2 text-sm text-slate-400">
                  Copy this code into your Android app:
                </p>
                <pre className="mt-3 overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-300">
{`AnalyticsSDK.init(
    context = this,
    apiKey = "${apiKey}",
    endpoint = "${apiEndpoint}"
)`}
                </pre>
                <p className="mt-3 text-sm text-slate-400">
                  Events from your app will start appearing in this dashboard automatically.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20">
              <Server className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Connection</CardTitle>
              <p className="text-sm text-slate-400">
                Backend API connection status
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
            <div>
              <p className="text-sm font-medium text-slate-300">Status</p>
              <p className="text-sm text-slate-500">API server connection</p>
            </div>
            <Badge
              variant="outline"
              className="border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
            >
              <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500" />
              Connected
            </Badge>
          </div>

          {/* Endpoint */}
          <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
            <div>
              <p className="text-sm font-medium text-slate-300">API Endpoint</p>
              <p className="text-sm text-slate-500">Backend server URL</p>
            </div>
            <code className="rounded bg-slate-700 px-2 py-1 text-sm text-slate-300">
              {apiEndpoint}
            </code>
          </div>

          {/* Current API Key */}
          <div className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4">
            <div>
              <p className="text-sm font-medium text-slate-300">Current API Key</p>
              <p className="text-sm text-slate-500">Active key in use</p>
            </div>
            <code className="rounded bg-slate-700 px-2 py-1 text-sm text-violet-400">
              {apiKey || "Not set"}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20">
              <Settings className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-lg">About</CardTitle>
              <p className="text-sm text-slate-400">
                Application information
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Application</span>
              <span className="text-sm text-slate-300">Behavior Analytics</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Version</span>
              <span className="text-sm text-slate-300">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Framework</span>
              <span className="text-sm text-slate-300">Next.js 16</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Backend</span>
              <span className="text-sm text-slate-300">FastAPI + Supabase</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


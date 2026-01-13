"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderKanban, Plus, RefreshCw, ArrowRight } from "lucide-react";

import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Apps Page (JWT-protected)
 *
 * Purpose:
 * - Shows all apps owned by the currently authenticated user
 * - Lets the user create new apps (backend generates the API key)
 *
 * Auth:
 * - This page is protected by `ProtectedRoute` via `AppLayout`
 * - Requests here call `/apps` endpoints which require a Supabase JWT
 *
 * Navigation:
 * - Clicking an app goes to `/apps/[appId]/dashboard` (implemented in a later step)
 */
export default function AppsPage() {
  const queryClient = useQueryClient();

  // Form state for creating a new app
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load all apps for the current user (Authorization header is added in api.getApps)
  const appsQuery = useQuery({
    queryKey: ["apps"],
    queryFn: () => api.getApps(),
  });

  // Create a new app and refresh the apps list
  const createApp = useMutation({
    mutationFn: async () => {
      setError(null);
      const trimmedName = name.trim();
      const trimmedDescription = description.trim();
      if (!trimmedName) throw new Error("App name is required");
      return api.createApp(trimmedName, trimmedDescription || undefined);
    },
    onSuccess: async () => {
      // Reset form and refetch apps
      setName("");
      setDescription("");
      await queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
    onError: (e: unknown) => {
      const message = e instanceof Error ? e.message : "Failed to create app";
      setError(message);
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apps</h1>
          <p className="mt-1 text-slate-400">
            Pick an app to view its analytics dashboard
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-slate-700 bg-slate-900/40 text-slate-300"
        >
          {appsQuery.data?.length ?? 0} app{(appsQuery.data?.length ?? 0) === 1 ? "" : "s"}
        </Badge>
      </div>

      {/* Create App */}
      <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20">
              <Plus className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Create a new app</CardTitle>
              <p className="text-sm text-slate-400">
                This generates an API key you’ll use in the SDK
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create form */}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                App name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ShopFlow"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Description (optional)
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Production Android app"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Create errors */}
          {error && (
            <div className="rounded-lg border border-rose-500/20 bg-rose-950/20 p-3">
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          {/* Create action */}
          <div className="flex justify-end">
            <Button
              onClick={() => createApp.mutate()}
              disabled={createApp.isPending || !name.trim()}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
            >
              {createApp.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create App
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Apps List */}
      <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20">
              <FolderKanban className="h-5 w-5 text-violet-400" />
            </div>
            <CardTitle className="text-lg">Your apps</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Loading / error / empty / list states */}
          {appsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-violet-500" />
            </div>
          ) : appsQuery.isError ? (
            <div className="rounded-lg border border-rose-500/20 bg-rose-950/20 p-4">
              <p className="text-sm text-rose-400">
                {appsQuery.error instanceof Error
                  ? appsQuery.error.message
                  : "Failed to load apps"}
              </p>
            </div>
          ) : (appsQuery.data?.length ?? 0) === 0 ? (
            <div className="py-12 text-center">
              <FolderKanban className="mx-auto h-12 w-12 text-slate-600" />
              <h3 className="mt-4 text-lg font-medium text-slate-300">
                No apps yet
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Create an app above, then click it to view its dashboard.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {appsQuery.data!.map((app) => (
                <Card
                  key={app.id}
                  className="border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 transition-colors"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-white">
                          {app.name}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                          {app.description || "No description"}
                        </p>
                        <p className="mt-3 text-xs text-slate-500">
                          Created {new Date(app.created_at).toLocaleString()}
                        </p>
                      </div>
                      {/* Later steps will implement the destination route */}
                      <Link href={`/apps/${app.id}/dashboard`}>
                        <Button className="bg-violet-600 hover:bg-violet-700">
                          Open
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


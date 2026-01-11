"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  GitBranch,
  Plus,
  Play,
  RefreshCw,
  ChevronRight,
  Users,
  Target,
  Percent,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api, { FunnelResult } from "@/lib/api";

/**
 * Funnels Page
 * - Shows all funnel definitions
 * - Allows creating new funnels
 * - Can run funnel analysis on any funnel
 */
export default function FunnelsPage() {
  const queryClient = useQueryClient();
  
  // Track which funnel is being analyzed and its results
  const [analyzingFunnelId, setAnalyzingFunnelId] = useState<string | null>(null);
  const [funnelResults, setFunnelResults] = useState<Record<string, FunnelResult>>({});

  // Fetch all funnel definitions
  const { data: funnels, isLoading } = useQuery({
    queryKey: ["funnels"],
    queryFn: () => api.getFunnelDefinitions(),
  });

  // Mutation to create a sample funnel
  const createFunnel = useMutation({
    mutationFn: () =>
      api.createFunnelDefinition("User Onboarding", [
        "app_open",
        "signup_view",
        "signup_complete",
        "first_action",
      ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funnels"] });
    },
  });

  // Mutation to run funnel analysis
  const runFunnel = useMutation({
    mutationFn: async ({ id, steps }: { id: string; steps: string[] }) => {
      setAnalyzingFunnelId(id);
      const result = await api.runFunnel(steps);
      return { id, result };
    },
    onSuccess: ({ id, result }) => {
      setFunnelResults((prev) => ({ ...prev, [id]: result }));
      setAnalyzingFunnelId(null);
    },
    onError: () => {
      setAnalyzingFunnelId(null);
    },
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Funnel Analysis</h1>
          <p className="mt-1 text-slate-400">
            Track user journeys and identify drop-off points
          </p>
        </div>
        <Button
          onClick={() => createFunnel.mutate()}
          disabled={createFunnel.isPending}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          {createFunnel.isPending ? "Creating..." : "Create Sample Funnel"}
        </Button>
      </div>

      {/* Funnels List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-violet-500" />
        </div>
      ) : funnels?.length === 0 ? (
        // Empty State
        <Card className="border-dashed border-slate-700 bg-slate-900/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-lg font-medium text-slate-300">
              No funnels defined
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Create your first funnel to start analyzing user flows
            </p>
            <Button
              onClick={() => createFunnel.mutate()}
              disabled={createFunnel.isPending}
              className="mt-4 bg-violet-600 hover:bg-violet-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Sample Funnel
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {funnels?.map((funnel) => {
            const result = funnelResults[funnel.id];
            const isAnalyzing = analyzingFunnelId === funnel.id;

            return (
              <Card
                key={funnel.id}
                className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20">
                        <GitBranch className="h-5 w-5 text-violet-400" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{funnel.name}</CardTitle>
                        <p className="text-sm text-slate-400">
                          {funnel.steps.length} steps
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() =>
                        runFunnel.mutate({ id: funnel.id, steps: funnel.steps })
                      }
                      disabled={isAnalyzing}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      {isAnalyzing ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="mr-2 h-4 w-4" />
                      )}
                      {isAnalyzing ? "Analyzing..." : "Run Analysis"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Funnel Steps */}
                  <div className="flex flex-wrap items-center gap-2">
                    {funnel.steps.map((step, i) => (
                      <div key={i} className="flex items-center">
                        <Badge
                          variant="secondary"
                          className="bg-slate-800 text-slate-300"
                        >
                          {step}
                        </Badge>
                        {i < funnel.steps.length - 1 && (
                          <ChevronRight className="mx-1 h-4 w-4 text-slate-600" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Results (shown after analysis) */}
                  {result && (
                    <div className="mt-4 rounded-lg bg-slate-800/50 p-4">
                      <h4 className="mb-3 text-sm font-medium text-slate-300">
                        Analysis Results
                      </h4>
                      <div className="grid gap-4 md:grid-cols-3">
                        {/* Sessions Entered */}
                        <div className="rounded-lg bg-slate-900/50 p-3">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Users className="h-4 w-4" />
                            <span className="text-xs">Entered</span>
                          </div>
                          <p className="mt-1 text-2xl font-bold text-white">
                            {result.sessions_entered}
                          </p>
                        </div>

                        {/* Sessions Completed */}
                        <div className="rounded-lg bg-slate-900/50 p-3">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Target className="h-4 w-4" />
                            <span className="text-xs">Completed</span>
                          </div>
                          <p className="mt-1 text-2xl font-bold text-emerald-400">
                            {result.sessions_completed}
                          </p>
                        </div>

                        {/* Conversion Rate */}
                        <div className="rounded-lg bg-slate-900/50 p-3">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Percent className="h-4 w-4" />
                            <span className="text-xs">Conversion</span>
                          </div>
                          <p className="mt-1 text-2xl font-bold text-violet-400">
                            {(result.conversion_rate * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Visual Funnel */}
                      <div className="mt-4 space-y-2">
                        {result.steps.map((step, i) => {
                          // Calculate width percentage based on position
                          const widthPercent = 100 - (i * 100) / result.steps.length;
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <span className="w-32 truncate text-sm text-slate-400">
                                {step}
                              </span>
                              <div className="h-6 flex-1 overflow-hidden rounded bg-slate-700">
                                <div
                                  className="h-full bg-gradient-to-r from-violet-600 to-violet-400 transition-all duration-500"
                                  style={{ width: `${widthPercent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  GitBranch,
  Plus,
  Play,
  RefreshCw,
  ChevronRight,
  X,
  ArrowUp,
  ArrowDown,
  Users,
  Target,
  Percent,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api, { FunnelResult } from "@/lib/api";

export function FunnelsPage() {
  const queryClient = useQueryClient();
  const apiKey = api.getApiKey();

  const [analyzingFunnelId, setAnalyzingFunnelId] = useState<string | null>(null);
  const [funnelResults, setFunnelResults] = useState<Record<string, FunnelResult>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSteps, setNewSteps] = useState<string[]>([]);
  const [newStepToAdd, setNewStepToAdd] = useState<string>("");
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: funnels, isLoading } = useQuery({
    queryKey: ["funnels", apiKey],
    queryFn: () => api.getFunnelDefinitions(),
  });

  const { data: eventCounts } = useQuery({
    queryKey: ["eventCounts", apiKey],
    queryFn: () => api.getEventCounts(),
  });

  const availableEvents = eventCounts ? Object.keys(eventCounts).sort() : [];

  const createFunnel = useMutation({
    mutationFn: async () => {
      setCreateError(null);
      const name = newName.trim();
      const steps = newSteps.map((s) => s.trim()).filter(Boolean);
      if (!name) throw new Error("Funnel name is required");
      if (steps.length < 2) throw new Error("Add at least 2 steps");
      return api.createFunnelDefinition(name, steps);
    },
    onSuccess: async () => {
      setNewName("");
      setNewSteps([]);
      setNewStepToAdd("");
      setCreateOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["funnels", apiKey] });
    },
    onError: (e: unknown) => {
      setCreateError(e instanceof Error ? e.message : "Failed to create funnel");
    },
  });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Funnel Analysis</h1>
          <p className="mt-1 text-slate-400">Track user journeys and identify drop-off points</p>
        </div>
        <Button
          onClick={() => {
            setCreateOpen((v) => !v);
            setCreateError(null);
          }}
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create funnel
        </Button>
      </div>

      {createOpen && (
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
          <CardHeader>
            <CardTitle className="text-lg">Create funnel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Funnel name
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Purchase flow"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Add step
                </label>
                <div className="flex gap-2">
                  <select
                    value={newStepToAdd}
                    onChange={(e) => setNewStepToAdd(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="">Select an event…</option>
                    {availableEvents.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={() => {
                      const step = newStepToAdd.trim();
                      if (!step) return;
                      if (newSteps.includes(step)) {
                        setCreateError("This step is already in the funnel");
                        return;
                      }
                      setNewSteps((prev) => [...prev, step]);
                      setNewStepToAdd("");
                    }}
                    disabled={!newStepToAdd}
                    className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
                  >
                    Add
                  </Button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Steps are ordered. A user converts when they complete all steps in order.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <p className="mb-3 text-sm font-medium text-slate-300">Steps</p>
              {newSteps.length === 0 ? (
                <p className="text-sm text-slate-500">Add events to build your funnel.</p>
              ) : (
                <div className="space-y-2">
                  {newSteps.map((step, idx) => (
                    <div
                      key={`${step}-${idx}`}
                      className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2"
                    >
                      <p className="truncate text-sm text-slate-200">
                        <span className="mr-2 text-slate-500">{idx + 1}.</span>
                        {step}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (idx === 0) return;
                            setNewSteps((prev) => {
                              const next = [...prev];
                              [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                              return next;
                            });
                          }}
                          disabled={idx === 0}
                          className="text-slate-400 hover:text-white"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (idx === newSteps.length - 1) return;
                            setNewSteps((prev) => {
                              const next = [...prev];
                              [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                              return next;
                            });
                          }}
                          disabled={idx === newSteps.length - 1}
                          className="text-slate-400 hover:text-white"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setNewSteps((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {createError && (
              <div className="rounded-lg border border-rose-500/20 bg-rose-950/20 p-3">
                <p className="text-sm text-rose-400">{createError}</p>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateOpen(false);
                  setCreateError(null);
                }}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createFunnel.mutate()}
                disabled={createFunnel.isPending}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {createFunnel.isPending ? "Saving..." : "Save funnel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-violet-500" />
        </div>
      ) : funnels?.length === 0 ? (
        <Card className="border-dashed border-slate-700 bg-slate-900/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GitBranch className="h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-lg font-medium text-slate-300">No funnels defined</h3>
            <p className="mt-1 text-sm text-slate-500">
              Create your first funnel to start analyzing user flows
            </p>
            <p className="mt-4 text-sm text-slate-500">Use “Create funnel” above to add one.</p>
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
                        <p className="text-sm text-slate-400">{funnel.steps.length} steps</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => runFunnel.mutate({ id: funnel.id, steps: funnel.steps })}
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
                  <div className="flex flex-wrap items-center gap-2">
                    {funnel.steps.map((step, i) => (
                      <div key={i} className="flex items-center">
                        <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                          {step}
                        </Badge>
                        {i < funnel.steps.length - 1 && (
                          <ChevronRight className="mx-1 h-4 w-4 text-slate-600" />
                        )}
                      </div>
                    ))}
                  </div>

                  {result && (
                    <div className="mt-4 rounded-lg bg-slate-800/50 p-4">
                      <h4 className="mb-3 text-sm font-medium text-slate-300">
                        Analysis Results
                      </h4>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-lg bg-slate-900/50 p-3">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Users className="h-4 w-4" />
                            <span className="text-xs">Entered</span>
                          </div>
                          <p className="mt-1 text-2xl font-bold text-white">{result.sessions_entered}</p>
                        </div>

                        <div className="rounded-lg bg-slate-900/50 p-3">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Target className="h-4 w-4" />
                            <span className="text-xs">Completed</span>
                          </div>
                          <p className="mt-1 text-2xl font-bold text-emerald-400">
                            {result.sessions_completed}
                          </p>
                        </div>

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

                      <div className="mt-4 space-y-2">
                        {result.steps.map((step, i) => {
                          const widthPercent = 100 - (i * 100) / result.steps.length;
                          return (
                            <div key={i} className="flex items-center gap-3">
                              <span className="w-32 truncate text-sm text-slate-400">{step}</span>
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


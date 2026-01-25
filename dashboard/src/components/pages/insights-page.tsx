"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Lightbulb,
  Sparkles,
  RefreshCw,
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useState } from "react";

function TrendIcon({ trend }: { trend: "improving" | "degrading" | "stable" }) {
  if (trend === "improving") return <TrendingUp className="h-5 w-5 text-emerald-500" />;
  if (trend === "degrading") return <TrendingDown className="h-5 w-5 text-rose-500" />;
  return <Minus className="h-5 w-5 text-slate-400" />;
}

function PriorityBadge({ priority }: { priority: "high" | "medium" | "low" }) {
  const colors: Record<string, string> = {
    high: "border-rose-500/50 bg-rose-500/10 text-rose-400",
    medium: "border-amber-500/50 bg-amber-500/10 text-amber-400",
    low: "border-slate-500/50 bg-slate-500/10 text-slate-400",
  };
  return (
    <Badge variant="outline" className={colors[priority] || colors.medium}>
      {priority} priority
    </Badge>
  );
}

export function InsightsPage() {
  const queryClient = useQueryClient();
  const apiKey = api.getApiKey();
  const [showComparison, setShowComparison] = useState(false);
  const [showTrends, setShowTrends] = useState(false);

  const { data: insights, isLoading } = useQuery({
    queryKey: ["insights", apiKey],
    queryFn: () => api.getInsightHistory(),
  });

  const generateInsight = useMutation({
    mutationFn: () => api.generateInsight(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights", apiKey] });
      queryClient.invalidateQueries({ queryKey: ["insightComparison", apiKey] });
      queryClient.invalidateQueries({ queryKey: ["insightTrends", apiKey] });
    },
  });

  const comparison = useQuery({
    queryKey: ["insightComparison", apiKey],
    queryFn: () => api.compareInsights(),
    enabled: showComparison && (insights?.length ?? 0) >= 2,
  });

  const trends = useQuery({
    queryKey: ["insightTrends", apiKey],
    queryFn: () => api.getInsightTrends(),
    enabled: showTrends && (insights?.length ?? 0) >= 2,
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
          <p className="mt-1 text-slate-400">AI-generated insights for the selected app</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setShowTrends(false);
              setShowComparison((v) => !v);
            }}
            disabled={(insights?.length ?? 0) < 2}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <GitCompare className="mr-2 h-4 w-4" />
            {showComparison ? "Hide comparison" : "Compare insights"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowComparison(false);
              setShowTrends((v) => !v);
            }}
            disabled={(insights?.length ?? 0) < 2}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            {showTrends ? "Hide trends" : "View trends"}
          </Button>
          <Button
            onClick={() => generateInsight.mutate()}
            disabled={generateInsight.isPending}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {generateInsight.isPending ? "Generating..." : "Generate Insight"}
          </Button>
        </div>
      </div>

      {showComparison && comparison.data && (
        <Card className="border-violet-600/50 bg-gradient-to-br from-violet-950/50 to-slate-950">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20">
                  <GitCompare className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Trend Comparison</CardTitle>
                  <p className="text-sm text-slate-400">Latest vs previous insight</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TrendIcon trend={comparison.data.diff.overall_trend} />
                <span className="text-lg font-medium capitalize">
                  {comparison.data.diff.overall_trend}
                </span>
                <PriorityBadge priority={comparison.data.explanation.priority} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-slate-900/50 p-4">
              <p className="mb-2 text-sm font-medium text-slate-300">AI interpretation</p>
              <p className="text-slate-200">{comparison.data.explanation.interpretation}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-rose-950/20 p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-medium text-rose-400">
                  <AlertCircle className="h-4 w-4" />
                  Issues detected
                </p>
                {comparison.data.diff.issues.length ? (
                  <ul className="space-y-2">
                    {comparison.data.diff.issues.map((issue, i) => (
                      <li key={i} className="text-sm text-slate-300">
                        - {issue}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No issues detected</p>
                )}
              </div>

              <div className="rounded-lg bg-emerald-950/20 p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Improvements
                </p>
                {comparison.data.diff.improvements.length ? (
                  <ul className="space-y-2">
                    {comparison.data.diff.improvements.map((improvement, i) => (
                      <li key={i} className="text-sm text-slate-300">
                        - {improvement}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No improvements detected</p>
                )}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-slate-300">Recommended actions</p>
              <div className="space-y-2">
                {comparison.data.explanation.recommended_actions.map((action, i) => (
                  <div key={i} className="rounded-lg bg-slate-900/50 p-3 text-sm text-slate-300">
                    {i + 1}. {action}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showTrends && trends.data && (
        <Card className="border-blue-600/50 bg-gradient-to-br from-blue-950/50 to-slate-950">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/20">
                <BarChart3 className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Trend Analysis</CardTitle>
                <p className="text-sm text-slate-400">Long-term patterns across all insights</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-slate-900/50 p-4">
              <p className="mb-2 text-sm font-medium text-slate-300">Summary</p>
              <p className="text-slate-200">{trends.data.summary}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-blue-950/20 p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-400">
                  <TrendingUp className="h-4 w-4" />
                  Key Changes
                </p>
                {trends.data.changes.length ? (
                  <ul className="space-y-2">
                    {trends.data.changes.map((change, i) => (
                      <li key={i} className="text-sm text-slate-300">
                        - {change}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No significant changes detected</p>
                )}
              </div>

              <div className="rounded-lg bg-rose-950/20 p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-medium text-rose-400">
                  <AlertCircle className="h-4 w-4" />
                  Risks
                </p>
                {trends.data.risks.length ? (
                  <ul className="space-y-2">
                    {trends.data.risks.map((risk, i) => (
                      <li key={i} className="text-sm text-slate-300">
                        - {risk}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No risks identified</p>
                )}
              </div>

              <div className="rounded-lg bg-emerald-950/20 p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Opportunities
                </p>
                {trends.data.opportunities.length ? (
                  <ul className="space-y-2">
                    {trends.data.opportunities.map((opportunity, i) => (
                      <li key={i} className="text-sm text-slate-300">
                        - {opportunity}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No opportunities identified</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showTrends && trends.isLoading && (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-violet-500" />
            <span className="ml-3 text-slate-400">Analyzing trends...</span>
          </CardContent>
        </Card>
      )}

      {showTrends && trends.isError && (
        <Card className="border-rose-600/50 bg-rose-950/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-6 w-6 text-rose-400" />
            <p className="mt-3 text-slate-300">
              {trends.error instanceof Error ? trends.error.message : "Failed to load trends"}
            </p>
            <p className="mt-1 text-sm text-slate-500">Make sure you have at least 2 insights</p>
          </CardContent>
        </Card>
      )}

      {showComparison && comparison.isLoading && (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-violet-500" />
            <span className="ml-3 text-slate-400">Comparing insights...</span>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-violet-500" />
        </div>
      ) : (insights?.length ?? 0) === 0 ? (
        <Card className="border-dashed border-slate-700 bg-slate-900/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lightbulb className="h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-lg font-medium text-slate-300">No insights yet</h3>
            <p className="mt-1 text-sm text-slate-500">Generate your first insight to get started</p>
            <Button
              onClick={() => generateInsight.mutate()}
              disabled={generateInsight.isPending}
              className="mt-4 bg-violet-600 hover:bg-violet-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Insight
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {insights!.map((insight, index) => (
            <Card
              key={insight.id}
              className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950"
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20">
                    <Sparkles className="h-5 w-5 text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-lg">
                      Insight #{insights!.length - index}
                    </CardTitle>
                    <p className="text-sm text-slate-500">{new Date(insight.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-slate-200 break-words">
                  {insight.summary}
                </p>
                {insight.insights?.length ? (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Key insights</p>
                    <ul className="mt-2 space-y-1">
                      {insight.insights.slice(0, 5).map((t, i) => (
                        <li key={i} className="text-sm text-slate-300">
                          - {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {insight.recommendations?.length ? (
                  <div>
                    <p className="text-sm font-medium text-slate-400">Recommendations</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {insight.recommendations.slice(0, 6).map((t, i) => (
                        <Badge key={i} variant="secondary" className="bg-slate-800 text-slate-300">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


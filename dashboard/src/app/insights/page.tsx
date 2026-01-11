"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Lightbulb,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  GitCompare,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useState } from "react";

/**
 * Trend Icon - shows up/down/stable arrow based on trend
 */
function TrendIcon({ trend }: { trend: string }) {
  if (trend === "improving")
    return <TrendingUp className="h-5 w-5 text-emerald-500" />;
  if (trend === "degrading")
    return <TrendingDown className="h-5 w-5 text-rose-500" />;
  return <Minus className="h-5 w-5 text-slate-400" />;
}

/**
 * Priority Badge - colored based on priority level
 */
function PriorityBadge({ priority }: { priority: string }) {
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

/**
 * Insights Page
 * - Shows all generated insights
 * - Allows generating new insights
 * - Shows comparison between insights
 */
export default function InsightsPage() {
  const queryClient = useQueryClient();
  const [showComparison, setShowComparison] = useState(false);

  // Fetch all insights
  const { data: insights, isLoading } = useQuery({
    queryKey: ["insights"],
    queryFn: () => api.getInsightHistory(),
  });

  // Mutation to generate new insight
  const generateInsight = useMutation({
    mutationFn: () => api.generateInsight(),
    onSuccess: () => {
      // Refetch insights after generating a new one
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
  });

  // Fetch comparison (only when showComparison is true)
  const comparison = useQuery({
    queryKey: ["insightComparison"],
    queryFn: () => api.compareInsights(),
    enabled: showComparison && (insights?.length || 0) >= 2,
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
          <p className="mt-1 text-slate-400">
            LLM-powered analysis and recommendations
          </p>
        </div>
        <div className="flex gap-3">
          {/* Compare Button - only enabled if 2+ insights */}
          <Button
            variant="outline"
            onClick={() => setShowComparison(!showComparison)}
            disabled={(insights?.length || 0) < 2}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <GitCompare className="mr-2 h-4 w-4" />
            {showComparison ? "Hide Comparison" : "Compare Trends"}
          </Button>
          
          {/* Generate Button */}
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

      {/* Comparison Panel - shown when Compare is clicked */}
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
                  <p className="text-sm text-slate-400">
                    Comparing latest insights
                  </p>
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
            {/* AI Interpretation */}
            <div className="rounded-lg bg-slate-900/50 p-4">
              <h4 className="mb-2 text-sm font-medium text-slate-300">
                AI Interpretation
              </h4>
              <p className="text-slate-200">
                {comparison.data.explanation.interpretation}
              </p>
            </div>

            {/* Issues & Improvements Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Issues */}
              <div className="rounded-lg bg-rose-950/20 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-rose-400">
                  <AlertCircle className="h-4 w-4" />
                  Issues Detected
                </h4>
                {comparison.data.diff.issues.length > 0 ? (
                  <ul className="space-y-2">
                    {comparison.data.diff.issues.map((issue, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-300"
                      >
                        <span className="text-rose-500">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No issues detected</p>
                )}
              </div>

              {/* Improvements */}
              <div className="rounded-lg bg-emerald-950/20 p-4">
                <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Improvements
                </h4>
                {comparison.data.diff.improvements.length > 0 ? (
                  <ul className="space-y-2">
                    {comparison.data.diff.improvements.map((improvement, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-300"
                      >
                        <span className="text-emerald-500">•</span>
                        {improvement}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500">No improvements detected</p>
                )}
              </div>
            </div>

            {/* Recommended Actions */}
            <div>
              <h4 className="mb-3 text-sm font-medium text-slate-300">
                Recommended Actions
              </h4>
              <div className="space-y-2">
                {comparison.data.explanation.recommended_actions.map((action, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-lg bg-slate-900/50 p-3"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600/20 text-xs text-violet-400">
                      {i + 1}
                    </div>
                    <p className="text-sm text-slate-300">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Loading State */}
      {showComparison && comparison.isLoading && (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-violet-500" />
            <span className="ml-3 text-slate-400">Comparing insights...</span>
          </CardContent>
        </Card>
      )}

      {/* Insights List */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-slate-300">Insight History</h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : insights?.length === 0 ? (
          // Empty State
          <Card className="border-dashed border-slate-700 bg-slate-900/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Lightbulb className="h-12 w-12 text-slate-600" />
              <h3 className="mt-4 text-lg font-medium text-slate-300">
                No insights yet
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Generate your first AI insight to get started
              </p>
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
          // Insights List
          insights?.map((insight, index) => (
            <Card
              key={insight.id}
              className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20">
                      <Sparkles className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        Insight #{insights.length - index}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="h-3 w-3" />
                        {new Date(insight.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {insight.has_snapshot && (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                    >
                      Snapshot saved
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <p className="text-lg text-slate-200">{insight.summary}</p>

                {/* Key Insights */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-slate-400">
                    Key Insights
                  </h4>
                  <ul className="space-y-1">
                    {insight.insights.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-300"
                      >
                        <Lightbulb className="mt-0.5 h-4 w-4 text-amber-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="mb-2 text-sm font-medium text-slate-400">
                    Recommendations
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {insight.recommendations.map((rec, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-slate-800 text-slate-300"
                      >
                        {rec}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}


"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lightbulb, Sparkles, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

export function InsightsPage() {
  const queryClient = useQueryClient();
  const apiKey = api.getApiKey();

  const { data: insights, isLoading } = useQuery({
    queryKey: ["insights", apiKey],
    queryFn: () => api.getInsightHistory(),
  });

  const generateInsight = useMutation({
    mutationFn: () => api.generateInsight(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
          <p className="mt-1 text-slate-400">AI-generated insights for the selected app</p>
        </div>
        <Button
          onClick={() => generateInsight.mutate()}
          disabled={generateInsight.isPending}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {generateInsight.isPending ? "Generating..." : "Generate Insight"}
        </Button>
      </div>

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
          {insights!.map((insight) => (
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
                    <CardTitle className="text-lg truncate">{insight.summary}</CardTitle>
                    <p className="text-sm text-slate-500">{new Date(insight.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
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


"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Users, TrendingUp, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

/**
 * KPI Card Component
 * Displays a single metric with title, value, and icon
 */
function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-400">
          {title}
        </CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/20">
          <Icon className="h-5 w-5 text-violet-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Dashboard Home Page
 * Shows key metrics fetched from the backend API
 */
export default function DashboardPage() {
  // Fetch event counts from our API
  const { data: eventCounts, isLoading: loadingEvents } = useQuery({
    queryKey: ["eventCounts"],
    queryFn: () => api.getEventCounts(),
  });

  // Fetch insights history
  const { data: insights, isLoading: loadingInsights } = useQuery({
    queryKey: ["insights"],
    queryFn: () => api.getInsightHistory(),
  });

  // Calculate total events (sum of all event counts)
  const totalEvents = eventCounts
    ? Object.values(eventCounts).reduce((sum, count) => sum + count, 0)
    : 0;

  // Count unique event types
  const eventTypes = eventCounts ? Object.keys(eventCounts).length : 0;

  // Get latest insight
  const latestInsight = insights?.[0];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-slate-400">
            Real-time user behavior analytics
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
        >
          <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </Badge>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Events"
          value={loadingEvents ? "..." : totalEvents.toLocaleString()}
          subtitle="All tracked events"
          icon={Activity}
        />
        <KPICard
          title="Event Types"
          value={loadingEvents ? "..." : eventTypes}
          subtitle="Unique event names"
          icon={TrendingUp}
        />
        <KPICard
          title="Sessions"
          value={loadingEvents ? "..." : Math.ceil(totalEvents / 5)}
          subtitle="Estimated from events"
          icon={Users}
        />
        <KPICard
          title="AI Insights"
          value={loadingInsights ? "..." : insights?.length || 0}
          subtitle="Generated insights"
          icon={Sparkles}
        />
      </div>

      {/* Latest Insight Card (only shown if we have insights) */}
      {latestInsight && (
        <Card className="border-slate-800 bg-gradient-to-br from-violet-950/50 to-slate-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/20">
                <Sparkles className="h-4 w-4 text-violet-400" />
              </div>
              <CardTitle className="text-lg">Latest AI Insight</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-slate-200">{latestInsight.summary}</p>
            
            {/* Show first 3 insights as badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              {latestInsight.insights.slice(0, 3).map((insight, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="bg-slate-800 text-slate-300"
                >
                  {insight.length > 50 ? insight.slice(0, 50) + "..." : insight}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State - shown when no data */}
      {!loadingEvents && totalEvents === 0 && (
        <Card className="border-dashed border-slate-700 bg-slate-900/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-lg font-medium text-slate-300">
              No events yet
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Start sending events from your Android SDK to see data here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, Users, TrendingUp, Sparkles, Key, ArrowRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
        <CardTitle className="text-sm font-medium text-slate-400">{title}</CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/20">
          <Icon className="h-5 w-5 text-violet-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

/**
 * App-scoped Dashboard page content.
 * Assumes `api.getApiKey()` is already set (via AppScope).
 */
export function DashboardPage() {
  const [hasApiKey, setHasApiKey] = useState(true); // avoid flash

  useEffect(() => {
    // Defer state update to avoid cascading-render lint rule.
    const raf = requestAnimationFrame(() => setHasApiKey(api.hasApiKey()));
    return () => cancelAnimationFrame(raf);
  }, []);

  const apiKey = api.getApiKey();

  const { data: eventCounts, isLoading: loadingEvents } = useQuery({
    queryKey: ["eventCounts", apiKey],
    queryFn: () => api.getEventCounts(),
    enabled: hasApiKey,
  });

  const { data: insights, isLoading: loadingInsights } = useQuery({
    queryKey: ["insights", apiKey],
    queryFn: () => api.getInsightHistory(),
    enabled: hasApiKey,
  });

  const { data: eventVolume, isLoading: loadingEventVolume } = useQuery({
    queryKey: ["eventVolume", apiKey],
    queryFn: () => api.getEventVolume(7),
    enabled: hasApiKey,
  });

  const totalEvents = eventCounts
    ? Object.values(eventCounts).reduce((sum, count) => sum + count, 0)
    : 0;

  const eventTypes = eventCounts ? Object.keys(eventCounts).length : 0;
  const latestInsight = insights?.[0];

  const topEvents = eventCounts
    ? Object.entries(eventCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    : [];

  if (!hasApiKey) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-600/20">
              <Key className="h-8 w-8 text-violet-400" />
            </div>
            <h2 className="mt-6 text-2xl font-bold">Welcome to Behavior Analytics</h2>
            <p className="mt-2 text-slate-400">
              Generate a unique API key to start tracking events from your app.
            </p>
            <Link href="/settings">
              <Button className="mt-6 bg-violet-600 hover:bg-violet-700">
                Generate API Key
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="mt-4 text-sm text-slate-500">
              You&apos;ll use this key in your Android SDK to link events to this dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-slate-400">Real-time user behavior analytics</p>
        </div>
        <Badge
          variant="outline"
          className="border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
        >
          <span className="mr-1.5 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </Badge>
      </div>

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

      {/* Under-KPI primary chart (full-width) */}
      <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Events (last 7 days)</CardTitle>
          <p className="text-sm text-slate-400">Daily total event volume</p>
        </CardHeader>
        <CardContent>
          {loadingEventVolume ? (
            <div className="space-y-2">
              <div className="h-4 w-1/3 rounded bg-slate-800/80" />
              <div className="h-4 w-2/3 rounded bg-slate-800/70" />
              <div className="h-4 w-1/2 rounded bg-slate-800/60" />
              <div className="h-4 w-3/4 rounded bg-slate-800/50" />
              <div className="h-4 w-2/5 rounded bg-slate-800/40" />
            </div>
          ) : !eventVolume || eventVolume.length === 0 ? (
            <div className="text-sm text-slate-500">No data yet.</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={eventVolume} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <CartesianGrid stroke="rgba(148, 163, 184, 0.25)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "rgba(148, 163, 184, 0.9)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    tickFormatter={(value: string) => {
                      // Parse YYYY-MM-DD as UTC to avoid local timezone shifting the day label.
                      const d = new Date(`${value}T00:00:00Z`);
                      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                    }}
                  />
                  <YAxis
                    width={56}
                    tick={{ fill: "rgba(148, 163, 184, 0.9)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => v.toLocaleString()}
                  />
                  <Tooltip
                    cursor={{ stroke: "rgba(148, 163, 184, 0.25)" }}
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.9)",
                      border: "1px solid rgba(148, 163, 184, 0.25)",
                      borderRadius: 10,
                      color: "white",
                    }}
                    labelStyle={{ color: "rgba(226, 232, 240, 0.95)" }}
                    formatter={(value: unknown) =>
                      typeof value === "number" ? value.toLocaleString() : String(value)
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#8b5cf6" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Under-KPI secondary charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Events</CardTitle>
            <p className="text-sm text-slate-400">Top 10 event names by volume</p>
          </CardHeader>
          <CardContent>
            {loadingEvents ? (
              <div className="space-y-2">
                <div className="h-4 w-1/3 rounded bg-slate-800/80" />
                <div className="h-4 w-2/3 rounded bg-slate-800/70" />
                <div className="h-4 w-1/2 rounded bg-slate-800/60" />
                <div className="h-4 w-3/4 rounded bg-slate-800/50" />
                <div className="h-4 w-2/5 rounded bg-slate-800/40" />
              </div>
            ) : topEvents.length === 0 ? (
              <div className="text-sm text-slate-500">
                No event data yet. Send some events to see your top actions here.
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topEvents.map((e) => ({ event: e.name, count: e.count }))}
                    margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <CartesianGrid stroke="rgba(148, 163, 184, 0.25)" vertical={false} />
                    <XAxis
                      dataKey="event"
                      tick={{ fill: "rgba(148, 163, 184, 0.9)", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      width={56}
                      tick={{ fill: "rgba(148, 163, 184, 0.9)", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => v.toLocaleString()}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
                      contentStyle={{
                        background: "rgba(15, 23, 42, 0.9)",
                        border: "1px solid rgba(148, 163, 184, 0.25)",
                        borderRadius: 10,
                        color: "white",
                      }}
                      labelStyle={{ color: "rgba(226, 232, 240, 0.95)" }}
                      formatter={(value: unknown) =>
                        typeof value === "number" ? value.toLocaleString() : String(value)
                      }
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Placeholder for the next step (Primary Funnel visualization) */}
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Primary Funnel</CardTitle>
            <p className="text-sm text-slate-400">
              Coming next: sessions per step + conversion
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex min-h-[140px] items-center justify-center rounded-lg border border-dashed border-slate-700 bg-slate-900/30 text-sm text-slate-500">
              Funnel chart placeholder
            </div>
          </CardContent>
        </Card>
      </div>

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
            <div className="mt-4 flex flex-wrap gap-2">
              {latestInsight.insights.slice(0, 3).map((insight, i) => (
                <Badge key={i} variant="secondary" className="bg-slate-800 text-slate-300">
                  {insight.length > 50 ? insight.slice(0, 50) + "..." : insight}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!loadingEvents && totalEvents === 0 && (
        <Card className="border-dashed border-slate-700 bg-slate-900/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-lg font-medium text-slate-300">No events yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              Start sending events from your Android SDK to see data here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


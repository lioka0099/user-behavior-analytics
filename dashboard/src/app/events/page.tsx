"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from "@/lib/api";

/**
 * Categorize event by name
 * Returns a category based on common event naming patterns
 */
function categorizeEvent(eventName: string): string {
  const name = eventName.toLowerCase();
  if (name.includes("error") || name.includes("fail")) return "error";
  if (name.includes("view") || name.includes("screen")) return "navigation";
  if (name.includes("click") || name.includes("tap") || name.includes("press")) return "interaction";
  if (name.includes("complete") || name.includes("success") || name.includes("purchase")) return "conversion";
  return "other";
}

/**
 * Category badge colors
 */
const categoryColors: Record<string, string> = {
  error: "border-rose-500/50 bg-rose-500/10 text-rose-400",
  navigation: "border-blue-500/50 bg-blue-500/10 text-blue-400",
  interaction: "border-amber-500/50 bg-amber-500/10 text-amber-400",
  conversion: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
  other: "border-slate-500/50 bg-slate-500/10 text-slate-400",
};

/**
 * Events Page
 * Shows all tracked events with their counts and categories
 */
export default function EventsPage() {
  // Fetch event counts
  const { data: eventCounts, isLoading } = useQuery({
    queryKey: ["eventCounts"],
    queryFn: () => api.getEventCounts(),
  });

  // Transform event counts into array with categories
  const events = eventCounts
    ? Object.entries(eventCounts)
        .map(([name, count]) => ({
          name,
          count,
          category: categorizeEvent(name),
        }))
        .sort((a, b) => b.count - a.count) // Sort by count descending
    : [];

  // Calculate totals
  const totalEvents = events.reduce((sum, e) => sum + e.count, 0);
  const eventTypes = events.length;

  // Count by category
  const categoryCounts = events.reduce(
    (acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Events Explorer</h1>
        <p className="mt-1 text-slate-400">
          View all tracked events and their distribution
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">
              {isLoading ? "..." : totalEvents.toLocaleString()}
            </p>
            <p className="text-sm text-slate-400">Total Events</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold">
              {isLoading ? "..." : eventTypes}
            </p>
            <p className="text-sm text-slate-400">Event Types</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-rose-400">
              {categoryCounts.error || 0}
            </p>
            <p className="text-sm text-slate-400">Error Events</p>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-emerald-400">
              {categoryCounts.conversion || 0}
            </p>
            <p className="text-sm text-slate-400">Conversion Events</p>
          </CardContent>
        </Card>
      </div>

      {/* Events Table */}
      <Card className="border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20">
              <Activity className="h-5 w-5 text-violet-400" />
            </div>
            <CardTitle className="text-lg">Event Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-violet-500" />
            </div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center">
              <Activity className="mx-auto h-12 w-12 text-slate-600" />
              <h3 className="mt-4 text-lg font-medium text-slate-300">
                No events tracked yet
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Events will appear here when your SDK sends data
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400">Event Name</TableHead>
                  <TableHead className="text-slate-400">Category</TableHead>
                  <TableHead className="text-right text-slate-400">Count</TableHead>
                  <TableHead className="text-right text-slate-400">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => {
                  const percentage = ((event.count / totalEvents) * 100).toFixed(1);
                  return (
                    <TableRow
                      key={event.name}
                      className="border-slate-800 hover:bg-slate-800/50"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-violet-500" />
                          {event.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={categoryColors[event.category]}
                        >
                          {event.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {event.count.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Progress bar */}
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-700">
                            <div
                              className="h-full bg-violet-500 transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-12 text-sm text-slate-400">
                            {percentage}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";

function categorizeEvent(eventName: string): string {
  const name = eventName.toLowerCase();
  if (name.includes("error") || name.includes("fail")) return "error";
  if (name.includes("view") || name.includes("screen")) return "navigation";
  if (name.includes("click") || name.includes("tap") || name.includes("press")) return "interaction";
  if (name.includes("complete") || name.includes("success") || name.includes("purchase")) return "conversion";
  return "other";
}

const categoryColors: Record<string, string> = {
  error: "border-rose-500/50 bg-rose-500/10 text-rose-400",
  navigation: "border-blue-500/50 bg-blue-500/10 text-blue-400",
  interaction: "border-amber-500/50 bg-amber-500/10 text-amber-400",
  conversion: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
  other: "border-slate-500/50 bg-slate-500/10 text-slate-400",
};

export function EventsPage() {
  const apiKey = api.getApiKey();

  const { data: eventCounts, isLoading } = useQuery({
    queryKey: ["eventCounts", apiKey],
    queryFn: () => api.getEventCounts(),
  });

  const events = eventCounts
    ? Object.entries(eventCounts)
        .map(([name, count]) => ({ name, count, category: categorizeEvent(name) }))
        .sort((a, b) => b.count - a.count)
    : [];

  const totalEvents = events.reduce((sum, e) => sum + e.count, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
        <p className="mt-1 text-slate-400">All events for the selected app</p>
      </div>

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
              <h3 className="mt-4 text-lg font-medium text-slate-300">No events tracked yet</h3>
              <p className="mt-1 text-sm text-slate-500">Events will appear here when your SDK sends data</p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-400">
                  Total events: <span className="font-mono text-slate-200">{totalEvents.toLocaleString()}</span>
                </p>
                <p className="text-sm text-slate-400">
                  Event types: <span className="font-mono text-slate-200">{events.length}</span>
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Event</TableHead>
                    <TableHead className="text-slate-400">Category</TableHead>
                    <TableHead className="text-right text-slate-400">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.name} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={categoryColors[event.category]}>
                          {event.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{event.count.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


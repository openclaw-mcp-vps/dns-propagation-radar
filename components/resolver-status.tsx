"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { DnsMonitor } from "@/types/dns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function toChartTime(iso: string) {
  const date = new Date(iso);
  return `${date.getUTCHours().toString().padStart(2, "0")}:${date
    .getUTCMinutes()
    .toString()
    .padStart(2, "0")}`;
}

type ResolverStatusProps = {
  monitor: DnsMonitor;
};

export function ResolverStatus({ monitor }: ResolverStatusProps) {
  const check = monitor.latestCheck;

  if (!check) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resolver Status</CardTitle>
          <CardDescription>
            The monitor has been created. First DNS sweep is in progress.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const topResolvers = [...check.results]
    .sort((a, b) => {
      if (a.matchedExpected === b.matchedExpected) {
        return a.latencyMs - b.latencyMs;
      }
      return Number(b.matchedExpected) - Number(a.matchedExpected);
    })
    .slice(0, 16);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Propagation Timeline</CardTitle>
          <CardDescription>
            Progress over time from the last {monitor.history.length} checks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monitor.history.map((item) => ({
                  time: toChartTime(item.timestamp),
                  matched: item.matchedPercentage,
                  healthy: item.healthyPercentage
                }))}
              >
                <defs>
                  <linearGradient id="matchedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis dataKey="time" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    borderColor: "#334155",
                    color: "#f8fafc"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="matched"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#matchedGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resolver-by-Resolver Detail</CardTitle>
          <CardDescription>
            Live answers from major recursive resolvers around the world.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topResolvers.map((resolver) => (
              <div
                key={resolver.resolverId}
                className="rounded-lg border border-slate-800 bg-[#0d1117] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-100">
                      {resolver.resolverName} ({resolver.resolverIp})
                    </div>
                    <div className="text-xs text-slate-400">
                      {resolver.city}, {resolver.country}
                    </div>
                  </div>
                  <Badge
                    className={resolver.matchedExpected ? "border-emerald-500/40 text-emerald-300" : "border-amber-500/40 text-amber-300"}
                  >
                    {resolver.matchedExpected ? "Propagated" : resolver.success ? "Old Value" : "Timeout / Error"}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                  <span>{resolver.latencyMs} ms</span>
                  <span>
                    {resolver.values.length > 0 ? resolver.values.join(" | ") : resolver.error || "No value"}
                  </span>
                </div>
                <Progress value={resolver.matchedExpected ? 100 : resolver.success ? 35 : 5} className="mt-3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

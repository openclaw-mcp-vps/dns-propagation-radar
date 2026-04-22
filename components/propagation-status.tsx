"use client";

import { Activity, CheckCircle2, Clock3, ServerCrash } from "lucide-react";
import type { ReactNode } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { MonitorJob } from "@/lib/database";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

export function PropagationStatus({ monitor }: { monitor: MonitorJob }) {
  const latest = monitor.snapshots[monitor.snapshots.length - 1];
  const totalChecks = monitor.snapshots.length;
  const propagationPercent = latest?.propagationPercent ?? 0;
  const resolvedCount = latest?.resolvedCount ?? 0;
  const totalResolvers = latest?.totalResolvers ?? 0;
  const errorCount = latest?.resolverResults.filter((entry) => entry.error).length ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-lg">Propagation Status</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={monitor.status === "completed" ? "success" : monitor.status === "error" ? "danger" : "default"}>
              {monitor.status === "completed" ? "Threshold Reached" : monitor.status === "error" ? "Monitoring Error" : "Monitoring"}
            </Badge>
            {monitor.alertedAt ? <Badge variant="success">Alert Sent</Badge> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>
              {resolvedCount}/{totalResolvers} resolvers report {monitor.expectedValue}
            </span>
            <span className="font-semibold text-cyan-300">{propagationPercent.toFixed(2)}%</span>
          </div>
          <Progress value={propagationPercent} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Checks Run" value={String(totalChecks)} icon={<Activity className="h-4 w-4" />} />
          <StatCard
            label="Last Check"
            value={latest ? formatTime(latest.checkedAt) : "Waiting"}
            icon={<Clock3 className="h-4 w-4" />}
          />
          <StatCard
            label="Resolvers Updated"
            value={`${resolvedCount}/${totalResolvers}`}
            icon={<CheckCircle2 className="h-4 w-4" />}
          />
          <StatCard label="Resolver Errors" value={String(errorCount)} icon={<ServerCrash className="h-4 w-4" />} />
        </div>

        <div className="h-64 rounded-lg border border-slate-800 bg-[#0b1220] p-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={monitor.snapshots.map((snapshot) => ({
                time: formatTime(snapshot.checkedAt),
                propagation: Number(snapshot.propagationPercent.toFixed(2))
              }))}
              margin={{ top: 12, right: 16, left: 8, bottom: 4 }}
            >
              <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
              <XAxis dataKey="time" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px"
                }}
              />
              <Line
                type="monotone"
                dataKey="propagation"
                stroke="#22d3ee"
                strokeWidth={2.5}
                dot={{ stroke: "#22d3ee", strokeWidth: 2, fill: "#0f172a", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  label,
  value,
  icon
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#0b1220] p-3">
      <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span>{label}</span>
        <span className="text-cyan-300">{icon}</span>
      </div>
      <div className="text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}

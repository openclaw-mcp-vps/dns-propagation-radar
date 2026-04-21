"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { MonitorSnapshot, ResolverCheckResult } from "@/lib/types";

function statusBadgeColor(status: ResolverCheckResult["status"]): string {
  if (status === "propagated") {
    return "bg-emerald-400/15 text-emerald-300 border-emerald-400/30";
  }

  if (status === "stale") {
    return "bg-amber-400/15 text-amber-300 border-amber-400/30";
  }

  if (status === "error") {
    return "bg-rose-400/15 text-rose-300 border-rose-400/30";
  }

  return "bg-zinc-500/15 text-zinc-300 border-zinc-500/30";
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);

  return `${date.getUTCHours().toString().padStart(2, "0")}:${date
    .getUTCMinutes()
    .toString()
    .padStart(2, "0")}:${date.getUTCSeconds().toString().padStart(2, "0")} UTC`;
}

interface ResolverStatusProps {
  snapshot: MonitorSnapshot;
}

export function ResolverStatus({ snapshot }: ResolverStatusProps) {
  const sortedResults = [...snapshot.results].sort((a, b) => {
    const rank: Record<ResolverCheckResult["status"], number> = {
      propagated: 0,
      stale: 1,
      error: 2,
      pending: 3
    };

    if (rank[a.status] !== rank[b.status]) {
      return rank[a.status] - rank[b.status];
    }

    return a.resolverName.localeCompare(b.resolverName);
  });

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Propagation</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-50">{snapshot.propagationPercent.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-zinc-400">
            {snapshot.propagatedCount}/{snapshot.totalResolvers} resolvers
          </p>
        </article>
        <article className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Target</p>
          <p className="mt-2 text-sm text-zinc-200">{snapshot.targetDescription}</p>
        </article>
        <article className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Last Check</p>
          <p className="mt-2 text-sm text-zinc-200">{formatTimestamp(snapshot.checkedAt)}</p>
          <p className="mt-1 text-xs text-zinc-500">Round {snapshot.roundsCompleted}</p>
        </article>
      </div>

      <div className="h-56 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={snapshot.history}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="4 4" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value: string) => formatTimestamp(value).replace(" UTC", "")}
              stroke="#64748b"
              tick={{ fontSize: 11 }}
            />
            <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} width={34} />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                borderColor: "#374151",
                backgroundColor: "#020617",
                color: "#e2e8f0"
              }}
              formatter={(value) => {
                const numericValue = Array.isArray(value) ? Number(value[0]) : Number(value);
                return `${Number.isFinite(numericValue) ? numericValue : 0}%`;
              }}
              labelFormatter={(value) =>
                typeof value === "string" ? formatTimestamp(value) : String(value)
              }
            />
            <Line type="monotone" dataKey="propagatedPercent" stroke="#22d3ee" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/80">
        <table className="min-w-full divide-y divide-zinc-800 text-sm">
          <thead className="bg-zinc-900/80 text-left text-xs uppercase tracking-wide text-zinc-400">
            <tr>
              <th className="px-3 py-2 font-medium">Resolver</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Answer</th>
              <th className="px-3 py-2 font-medium">Latency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-zinc-200">
            {sortedResults.map((result) => (
              <tr key={result.resolverId}>
                <td className="px-3 py-2">
                  <p className="font-medium">{result.resolverName}</p>
                  <p className="text-xs text-zinc-500">
                    {result.region} · {result.resolverIp}
                  </p>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${statusBadgeColor(result.status)}`}
                  >
                    {result.status}
                  </span>
                </td>
                <td className="px-3 py-2 mono text-xs text-zinc-300">
                  {result.error ? result.error : result.values.join(", ") || "No records"}
                </td>
                <td className="px-3 py-2 text-xs text-zinc-400">
                  {result.latencyMs ? `${result.latencyMs} ms` : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

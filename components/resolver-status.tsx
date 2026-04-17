import type { ResolverCheckResult } from "@/lib/storage";

type ResolverStatusProps = {
  resolvers: ResolverCheckResult[];
};

function statusClass(status: ResolverCheckResult["status"]) {
  if (status === "match") return "text-emerald-300";
  if (status === "mismatch") return "text-amber-300";
  if (status === "error") return "text-red-300";
  return "text-slate-400";
}

export function ResolverStatus({ resolvers }: ResolverStatusProps) {
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs md:text-sm">
          <thead className="border-b border-slate-700 bg-[#0f172a] text-slate-300">
            <tr>
              <th className="px-4 py-3">Resolver</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Latency</th>
              <th className="px-4 py-3">Observed Answer</th>
            </tr>
          </thead>
          <tbody>
            {resolvers.map((resolver) => (
              <tr key={resolver.resolverId} className="border-b border-slate-800/70 text-slate-100">
                <td className="px-4 py-3">{resolver.resolverName} ({resolver.country})</td>
                <td className="px-4 py-3">{resolver.region}</td>
                <td className="px-4 py-3 font-mono text-xs">{resolver.ip}</td>
                <td className={`px-4 py-3 font-semibold ${statusClass(resolver.status)}`}>{resolver.status}</td>
                <td className="px-4 py-3">{resolver.latencyMs ? `${resolver.latencyMs} ms` : "-"}</td>
                <td className="max-w-[280px] truncate px-4 py-3" title={resolver.answers.join(", ")}>
                  {resolver.answers.join(", ") || resolver.error || "Pending"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

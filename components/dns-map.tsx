"use client";

import dynamic from "next/dynamic";
import type { ResolverCheckResult } from "@/lib/database";

const DnsMapCanvas = dynamic(
  () => import("@/components/dns-map-canvas").then((module) => module.DnsMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="h-[420px] w-full rounded-xl border border-slate-800 bg-[#0b1220] p-4 text-sm text-slate-400">
        Loading resolver map...
      </div>
    )
  }
);

export function DnsMap({ resolverResults }: { resolverResults: ResolverCheckResult[] }) {
  return <DnsMapCanvas resolverResults={resolverResults} />;
}

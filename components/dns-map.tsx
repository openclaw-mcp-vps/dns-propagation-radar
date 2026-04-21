"use client";

import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import type { ResolverCheckResult } from "@/lib/types";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

function markerColor(status: ResolverCheckResult["status"]): string {
  if (status === "propagated") {
    return "#34d399";
  }

  if (status === "stale") {
    return "#f59e0b";
  }

  if (status === "error") {
    return "#f87171";
  }

  return "#6b7280";
}

interface DNSMapProps {
  results: ResolverCheckResult[];
}

export function DNSMap({ results }: DNSMapProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-100">Global Resolver Map</h3>
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <i className="size-2 rounded-full bg-emerald-400" /> Propagated
          </span>
          <span className="flex items-center gap-1">
            <i className="size-2 rounded-full bg-amber-400" /> Stale
          </span>
          <span className="flex items-center gap-1">
            <i className="size-2 rounded-full bg-rose-400" /> Error
          </span>
        </div>
      </div>

      <ComposableMap
        projectionConfig={{ scale: 145 }}
        width={980}
        height={460}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#0f172a"
                stroke="#1f2937"
                strokeWidth={0.3}
              />
            ))
          }
        </Geographies>

        {results.map((resolver) => (
          <Marker key={resolver.resolverId} coordinates={[resolver.lng, resolver.lat]}>
            <title>
              {resolver.resolverName} ({resolver.resolverIp}) - {resolver.status}
            </title>
            <circle
              r={4}
              fill={markerColor(resolver.status)}
              stroke="#020617"
              strokeWidth={1}
              opacity={0.95}
            />
          </Marker>
        ))}
      </ComposableMap>
    </section>
  );
}

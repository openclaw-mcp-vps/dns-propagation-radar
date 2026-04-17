"use client";

import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import type React from "react";
import type { ResolverCheckResult } from "@/lib/storage";

type DnsMapProps = {
  resolvers: ResolverCheckResult[];
};

function colorByStatus(status: ResolverCheckResult["status"]) {
  if (status === "match") return "#10b981";
  if (status === "mismatch") return "#f59e0b";
  if (status === "error") return "#ef4444";
  return "#6b7280";
}

export function DnsMap({ resolvers }: DnsMapProps) {
  const LeafletMap = MapContainer as unknown as React.ComponentType<Record<string, unknown>>;
  const LeafletTileLayer = TileLayer as unknown as React.ComponentType<Record<string, unknown>>;
  const LeafletCircleMarker = CircleMarker as unknown as React.ComponentType<Record<string, unknown>>;
  const LeafletTooltip = Tooltip as unknown as React.ComponentType<Record<string, unknown>>;

  return (
    <div className="h-[380px] overflow-hidden rounded-xl border border-slate-700">
      <LeafletMap
        center={[20, 0]}
        zoom={2}
        scrollWheelZoom
        className="h-full w-full"
        worldCopyJump
      >
        <LeafletTileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {resolvers.map((resolver) => (
          <LeafletCircleMarker
            key={resolver.resolverId}
            center={[resolver.latitude, resolver.longitude]}
            radius={7}
            pathOptions={{
              color: colorByStatus(resolver.status),
              fillColor: colorByStatus(resolver.status),
              fillOpacity: 0.85,
              weight: 1
            }}
          >
            <LeafletTooltip>
              <div className="text-xs">
                <p className="font-semibold">{resolver.resolverName} ({resolver.country})</p>
                <p>{resolver.ip}</p>
                <p>Status: {resolver.status}</p>
                <p>Answer: {resolver.answers.join(", ") || "no response"}</p>
              </div>
            </LeafletTooltip>
          </LeafletCircleMarker>
        ))}
      </LeafletMap>
    </div>
  );
}

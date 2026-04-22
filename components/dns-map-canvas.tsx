"use client";

import { useMemo } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { ResolverCheckResult } from "@/lib/database";

function markerColor(result: ResolverCheckResult): string {
  if (result.error) {
    return "#f43f5e";
  }

  return result.matched ? "#10b981" : "#f59e0b";
}

export function DnsMapCanvas({ resolverResults }: { resolverResults: ResolverCheckResult[] }) {
  const points = useMemo(
    () => resolverResults.filter((entry) => Number.isFinite(entry.lat) && Number.isFinite(entry.lng)),
    [resolverResults]
  );

  return (
    <div className="h-[420px] overflow-hidden rounded-xl border border-slate-800">
      <MapContainer center={[18, 12]} zoom={2} minZoom={2} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {points.map((point) => (
          <CircleMarker
            key={point.resolverId}
            center={[point.lat, point.lng]}
            radius={7}
            pathOptions={{
              color: markerColor(point),
              fillColor: markerColor(point),
              fillOpacity: 0.85,
              weight: 1
            }}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <div className="font-semibold">
                  {point.label} ({point.ip})
                </div>
                <div>
                  {point.city}, {point.country}
                </div>
                <div>Provider: {point.provider}</div>
                <div>Status: {point.error ? `Error: ${point.error}` : point.matched ? "Updated" : "Still old value"}</div>
                {!point.error && point.values.length > 0 ? (
                  <div className="break-all">Answer: {point.values.join(", ")}</div>
                ) : null}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";
import { ResolverQueryResult } from "@/types/dns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const WorldMap = dynamic(() => import("react-world-map"), { ssr: false });

type WorldMapPanelProps = {
  results: ResolverQueryResult[];
};

type CountrySummary = {
  countryCode: string;
  successCount: number;
  totalCount: number;
};

export function WorldMapPanel({ results }: WorldMapPanelProps) {
  const grouped = results.reduce<Record<string, CountrySummary>>((acc, result) => {
    if (!acc[result.countryCode]) {
      acc[result.countryCode] = {
        countryCode: result.countryCode,
        successCount: 0,
        totalCount: 0
      };
    }

    acc[result.countryCode].totalCount += 1;
    if (result.matchedExpected) {
      acc[result.countryCode].successCount += 1;
    }

    return acc;
  }, {});

  const mapData = Object.values(grouped).map((item) => ({
    country: item.countryCode,
    value: Math.round((item.successCount / item.totalCount) * 100)
  }));

  const hottest = [...mapData].sort((a, b) => b.value - a.value).slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Propagation Map</CardTitle>
        <CardDescription>
          Countries shade from low to high confidence based on resolver matches.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border border-slate-800 bg-[#0d1117] p-3">
          <WorldMap
            value={mapData}
            size="responsive"
            color="#3b82f6"
            backgroundColor="#0d1117"
            tooltipBgColor="#111827"
            tooltipTextColor="#f8fafc"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {hottest.map((entry) => (
            <div key={entry.country} className="rounded-lg border border-slate-800 bg-[#0d1117] p-3">
              <div className="text-xs text-slate-400">{entry.country}</div>
              <div className="mt-1 text-lg font-semibold text-slate-100">{entry.value}%</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

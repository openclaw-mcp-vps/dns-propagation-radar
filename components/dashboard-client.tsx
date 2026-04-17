"use client";

import { useEffect, useMemo, useState } from "react";
import { DnsMap } from "@/components/dns-map";
import { ResolverStatus } from "@/components/resolver-status";
import type { DnsCheckSession } from "@/lib/storage";

type DnsCheckResponse = {
  check: DnsCheckSession;
  websocketHint?: string;
};

const RECORD_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS"];

function buildWsUrl(checkId: string, wsPortHint?: string) {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  const protocol = url.protocol === "https:" ? "wss:" : "ws:";
  const port = wsPortHint ?? "3010";
  return `${protocol}//${url.hostname}:${port}/?checkId=${checkId}`;
}

export function DashboardClient() {
  const [domain, setDomain] = useState("umami.microtool.dev");
  const [recordType, setRecordType] = useState("A");
  const [expectedValue, setExpectedValue] = useState("");
  const [email, setEmail] = useState("");
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("");
  const [thresholdPercent, setThresholdPercent] = useState(95);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [check, setCheck] = useState<DnsCheckSession | null>(null);
  const [wsPortHint, setWsPortHint] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!check?.id) return;

    const socket = new WebSocket(buildWsUrl(check.id, wsPortHint));
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as { type: string; payload: DnsCheckSession };
      if (payload.type === "check:update") {
        setCheck(payload.payload);
      }
    };

    const poll = setInterval(async () => {
      const response = await fetch(`/api/dns-check?id=${check.id}`);
      if (!response.ok) return;
      const body = (await response.json()) as { check: DnsCheckSession };
      setCheck(body.check);
    }, 20000);

    return () => {
      clearInterval(poll);
      socket.close();
    };
  }, [check?.id, wsPortHint]);

  const startCheck = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/dns-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain,
        recordType,
        expectedValue
      })
    });

    const body = (await response.json()) as DnsCheckResponse & { error?: string };
    setLoading(false);

    if (!response.ok) {
      setError(body.error ?? "Could not start DNS check.");
      return;
    }

    setCheck(body.check);
    setWsPortHint(body.websocketHint);

    if (email || discordWebhookUrl) {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checkId: body.check.id,
          thresholdPercent,
          email: email || undefined,
          discordWebhookUrl: discordWebhookUrl || undefined
        })
      });
    }
  };

  const stats = useMemo(() => {
    if (!check) return null;

    const totals = {
      match: 0,
      mismatch: 0,
      error: 0,
      pending: 0
    } as Record<DnsCheckSession["resolvers"][number]["status"], number>;

    for (const resolver of check.resolvers) totals[resolver.status] += 1;
    return totals;
  }, [check]);

  return (
    <div className="space-y-6">
      <section className="panel p-5 md:p-6">
        <h1 className="text-2xl font-semibold text-white">Live DNS Propagation Dashboard</h1>
        <p className="mt-2 text-sm text-slate-300">
          Start a check, then monitor global resolver convergence every 60 seconds.
        </p>

        <form onSubmit={startCheck} className="mt-5 grid gap-3 md:grid-cols-2">
          <input
            className="rounded-md border border-slate-700 bg-[#0d1117] px-3 py-2 text-sm text-white"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            placeholder="Domain (e.g. app.example.com)"
            required
          />
          <input
            className="rounded-md border border-slate-700 bg-[#0d1117] px-3 py-2 text-sm text-white"
            value={expectedValue}
            onChange={(event) => setExpectedValue(event.target.value)}
            placeholder="Expected value (IP, CNAME, MX host...)"
            required
          />
          <select
            className="rounded-md border border-slate-700 bg-[#0d1117] px-3 py-2 text-sm text-white"
            value={recordType}
            onChange={(event) => setRecordType(event.target.value)}
          >
            {RECORD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            className="rounded-md border border-slate-700 bg-[#0d1117] px-3 py-2 text-sm text-white"
            type="number"
            min={1}
            max={100}
            value={thresholdPercent}
            onChange={(event) => setThresholdPercent(Number(event.target.value))}
            placeholder="Notification threshold %"
          />
          <input
            className="rounded-md border border-slate-700 bg-[#0d1117] px-3 py-2 text-sm text-white"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Alert email (optional)"
            type="email"
          />
          <input
            className="rounded-md border border-slate-700 bg-[#0d1117] px-3 py-2 text-sm text-white"
            value={discordWebhookUrl}
            onChange={(event) => setDiscordWebhookUrl(event.target.value)}
            placeholder="Discord webhook URL (optional)"
            type="url"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Starting..." : "Start 40-Resolver Check"}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      </section>

      {check ? (
        <>
          <section className="panel p-5 md:p-6">
            <div className="grid gap-3 md:grid-cols-5">
              <div>
                <p className="text-xs uppercase text-slate-400">Domain</p>
                <p className="mt-1 text-sm text-white">{check.domain}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Record Type</p>
                <p className="mt-1 text-sm text-white">{check.recordType}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Expected Value</p>
                <p className="mt-1 text-sm text-white">{check.expectedValue}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Propagation</p>
                <p className="mt-1 text-sm font-semibold text-emerald-300">{check.propagationPercent.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Last Run</p>
                <p className="mt-1 text-sm text-white">{check.lastRunAt ? new Date(check.lastRunAt).toLocaleTimeString() : "Pending"}</p>
              </div>
            </div>
            {stats ? (
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="badge border-emerald-500/40 text-emerald-300">Match: {stats.match}</span>
                <span className="badge border-amber-500/40 text-amber-300">Mismatch: {stats.mismatch}</span>
                <span className="badge border-red-500/40 text-red-300">Error: {stats.error}</span>
                <span className="badge">Pending: {stats.pending}</span>
              </div>
            ) : null}
          </section>

          <DnsMap resolvers={check.resolvers} />
          <ResolverStatus resolvers={check.resolvers} />
        </>
      ) : null}
    </div>
  );
}

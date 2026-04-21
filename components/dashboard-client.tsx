"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, Radar, RefreshCcw } from "lucide-react";
import { DNSMap } from "@/components/dns-map";
import { NotificationSettings } from "@/components/notification-settings";
import { ResolverStatus } from "@/components/resolver-status";
import { SUPPORTED_RECORD_TYPES, type DNSRecordType, type MonitorSnapshot } from "@/lib/types";

export function DashboardClient() {
  const [domain, setDomain] = useState("");
  const [recordType, setRecordType] = useState<DNSRecordType>("A");
  const [targetValue, setTargetValue] = useState("");
  const [monitorId, setMonitorId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<MonitorSnapshot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamState, setStreamState] = useState<"idle" | "connected" | "reconnecting">("idle");

  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!monitorId) {
      return;
    }

    const source = new EventSource(`/api/events?monitorId=${encodeURIComponent(monitorId)}`);
    sourceRef.current = source;

    const consumeSnapshot = (event: MessageEvent<string>) => {
      const parsed = JSON.parse(event.data) as MonitorSnapshot;
      setSnapshot(parsed);
    };

    source.addEventListener("snapshot", consumeSnapshot as EventListener);
    source.addEventListener("update", consumeSnapshot as EventListener);

    source.onopen = () => {
      setStreamState("connected");
    };

    source.onerror = () => {
      setStreamState("reconnecting");
    };

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [monitorId]);

  useEffect(() => {
    return () => {
      sourceRef.current?.close();
    };
  }, []);

  const statusBadge = useMemo(() => {
    if (streamState === "connected") {
      return "text-emerald-300 border-emerald-400/30 bg-emerald-500/10";
    }

    if (streamState === "reconnecting") {
      return "text-amber-300 border-amber-400/30 bg-amber-500/10";
    }

    return "text-zinc-300 border-zinc-700 bg-zinc-900";
  }, [streamState]);

  async function startMonitoring(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/dns-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          domain,
          recordType,
          targetValue: targetValue.trim() || undefined
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        monitorId?: string;
        snapshot?: MonitorSnapshot;
      };

      if (!response.ok || !payload.monitorId || !payload.snapshot) {
        throw new Error(payload.error ?? "Unable to start DNS monitor.");
      }

      setMonitorId(payload.monitorId);
      setSnapshot(payload.snapshot);
      setStreamState("reconnecting");
    } catch (monitorError) {
      if (monitorError instanceof Error) {
        setError(monitorError.message);
      } else {
        setError("Unexpected error while starting monitor.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function refreshSnapshot() {
    if (!monitorId) {
      return;
    }

    const response = await fetch(`/api/dns-check?monitorId=${encodeURIComponent(monitorId)}`);
    const payload = (await response.json()) as { snapshot?: MonitorSnapshot };

    if (response.ok && payload.snapshot) {
      setSnapshot(payload.snapshot);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-zinc-50">
              <Radar className="size-5 text-cyan-300" />
              DNS Propagation Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Polling every 60 seconds across {snapshot?.totalResolvers ?? 40}+ resolvers.
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusBadge}`}>
            stream: {streamState}
          </span>
        </div>

        <form className="mt-5 grid gap-3 lg:grid-cols-[2fr_120px_2fr_auto]" onSubmit={startMonitoring}>
          <label className="text-sm text-zinc-300">
            Domain
            <input
              required
              type="text"
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              placeholder="example.com"
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-400/40 transition focus:ring"
            />
          </label>

          <label className="text-sm text-zinc-300">
            Record
            <select
              value={recordType}
              onChange={(event) => setRecordType(event.target.value as DNSRecordType)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-400/40 transition focus:ring"
            >
              {SUPPORTED_RECORD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-zinc-300">
            Expected Value (optional)
            <input
              type="text"
              value={targetValue}
              onChange={(event) => setTargetValue(event.target.value)}
              placeholder={recordType === "A" ? "76.76.21.21" : "new-target.example.net"}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-cyan-400/40 transition focus:ring"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-[23px] inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-cyan-400 px-4 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Start
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            onClick={refreshSnapshot}
            disabled={!monitorId}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-2 text-zinc-200 transition hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className="size-3.5" />
            Refresh Snapshot
          </button>

          {error ? <p className="text-rose-300">{error}</p> : null}
        </div>
      </section>

      {snapshot ? (
        <>
          <DNSMap results={snapshot.results} />
          <ResolverStatus snapshot={snapshot} />
          <NotificationSettings monitorId={snapshot.id} />
        </>
      ) : (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-8 text-center text-zinc-300">
          Start a monitor to stream resolver responses and propagation history.
        </section>
      )}
    </div>
  );
}

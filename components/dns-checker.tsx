"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, Pause, Play, Plus, RefreshCcw, ShieldAlert, Zap } from "lucide-react";
import { DnsMonitor, DnsRecordType, MonitorListResponse, MonitorWebsocketMessage } from "@/types/dns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ResolverStatus } from "@/components/resolver-status";
import { WorldMapPanel } from "@/components/world-map";

const recordTypes: DnsRecordType[] = ["A", "AAAA", "CNAME", "MX", "TXT", "NS"];

type CreateMonitorForm = {
  domain: string;
  recordType: DnsRecordType;
  expectedValue: string;
  thresholdPercentage: number;
  email: string;
  discordWebhook: string;
};

const initialForm: CreateMonitorForm = {
  domain: "",
  recordType: "A",
  expectedValue: "",
  thresholdPercentage: 95,
  email: "",
  discordWebhook: ""
};

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T;
  if (!response.ok) {
    const error = payload as { error?: string };
    throw new Error(error.error || "Request failed");
  }
  return payload;
}

export function DnsChecker() {
  const [form, setForm] = useState<CreateMonitorForm>(initialForm);
  const [monitors, setMonitors] = useState<DnsMonitor[]>([]);
  const [selectedMonitorId, setSelectedMonitorId] = useState<string | null>(null);
  const [websocketUrl, setWebsocketUrl] = useState("ws://localhost:3002");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [pollingNow, setPollingNow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const selectedMonitor = useMemo(
    () => monitors.find((monitor) => monitor.id === selectedMonitorId) ?? null,
    [monitors, selectedMonitorId]
  );

  const refreshMonitors = async () => {
    const data = await parseJson<MonitorListResponse>(await fetch("/api/dns/monitor", { cache: "no-store" }));
    setMonitors(data.monitors);
    setWebsocketUrl(data.websocketUrl);

    if (!selectedMonitorId && data.monitors.length > 0) {
      setSelectedMonitorId(data.monitors[0].id);
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        await refreshMonitors();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load monitors");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      void refreshMonitors().catch(() => {
        // no-op
      });
    }, 30_000);

    return () => clearInterval(timer);
  }, [selectedMonitorId]);

  useEffect(() => {
    if (!selectedMonitorId) {
      return;
    }

    const ws = new WebSocket(websocketUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "subscribe",
          monitorId: selectedMonitorId
        })
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as MonitorWebsocketMessage;
      if (message.type === "monitor-update") {
        setMonitors((current) => {
          const idx = current.findIndex((item) => item.id === message.monitor.id);
          if (idx < 0) {
            return [message.monitor, ...current];
          }

          const copy = [...current];
          copy[idx] = message.monitor;
          return copy;
        });
      }

      if (message.type === "monitor-error") {
        setError(message.error);
      }
    };

    ws.onerror = () => {
      setError("WebSocket connection failed. Live updates paused.");
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [selectedMonitorId, websocketUrl]);

  const createMonitor = async () => {
    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/dns/monitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: form.domain,
          recordType: form.recordType,
          expectedValue: form.expectedValue,
          thresholdPercentage: form.thresholdPercentage,
          notification: {
            email: form.email || undefined,
            discordWebhook: form.discordWebhook || undefined
          }
        })
      });

      const payload = await parseJson<{ monitor: DnsMonitor }>(response);
      setMonitors((current) => [payload.monitor, ...current]);
      setSelectedMonitorId(payload.monitor.id);
      setForm(initialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Monitor creation failed");
    } finally {
      setCreating(false);
    }
  };

  const toggleMonitor = async (monitor: DnsMonitor) => {
    try {
      const response = await fetch("/api/dns/monitor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monitorId: monitor.id, active: !monitor.active })
      });
      const payload = await parseJson<{ monitor: DnsMonitor }>(response);
      setMonitors((current) => current.map((item) => (item.id === payload.monitor.id ? payload.monitor : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update monitor");
    }
  };

  const checkNow = async (monitor: DnsMonitor) => {
    setPollingNow(true);
    try {
      const response = await fetch("/api/dns/monitor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monitorId: monitor.id, runNow: true })
      });
      const payload = await parseJson<{ monitor: DnsMonitor }>(response);
      setMonitors((current) => current.map((item) => (item.id === payload.monitor.id ? payload.monitor : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Manual check failed");
    } finally {
      setPollingNow(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-300">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading monitors...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-amber-500/40">
          <CardContent className="flex items-start gap-3 p-4 text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <p className="text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create a Monitoring Session</CardTitle>
          <CardDescription>
            Poll 40+ resolvers every 60 seconds and trigger alerts once your threshold is reached.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Domain</label>
              <Input
                placeholder="example.com"
                value={form.domain}
                onChange={(event) => setForm((prev) => ({ ...prev, domain: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Record Type</label>
              <select
                className="h-10 w-full rounded-md border border-slate-700 bg-[#0d1117] px-3 text-sm text-slate-100"
                value={form.recordType}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, recordType: event.target.value as DnsRecordType }))
                }
              >
                {recordTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Expected New Value</label>
              <Input
                placeholder="76.76.21.21"
                value={form.expectedValue}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, expectedValue: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Threshold (%)</label>
              <Input
                type="number"
                min={50}
                max={100}
                value={form.thresholdPercentage}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    thresholdPercentage: Number(event.target.value) || 95
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Alert Email (optional)</label>
              <Input
                placeholder="you@company.com"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Discord Webhook (optional)</label>
              <Input
                placeholder="https://discord.com/api/webhooks/..."
                value={form.discordWebhook}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, discordWebhook: event.target.value }))
                }
              />
            </div>
          </div>

          <Button
            onClick={createMonitor}
            disabled={creating || !form.domain || !form.expectedValue}
            className="w-full sm:w-auto"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating monitor
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" /> Start monitoring
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {monitors.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-slate-300">
            Start your first monitor to see live propagation data across global resolvers.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Your Active Monitors</CardTitle>
              <CardDescription>Switch between domains and run an immediate check on demand.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {monitors.map((monitor) => {
                const selected = monitor.id === selectedMonitorId;
                const percentage = monitor.latestCheck?.stats.matchedPercentage ?? 0;

                return (
                  <button
                    type="button"
                    key={monitor.id}
                    className={`rounded-lg border p-4 text-left transition ${
                      selected
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-800 bg-[#0d1117] hover:border-slate-700"
                    }`}
                    onClick={() => setSelectedMonitorId(monitor.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-slate-100">{monitor.domain}</div>
                        <div className="text-xs text-slate-400">
                          {monitor.recordType} → {monitor.expectedValue}
                        </div>
                      </div>
                      <Badge className={monitor.active ? "text-emerald-300" : "text-slate-300"}>
                        {monitor.active ? "Running" : "Paused"}
                      </Badge>
                    </div>
                    <div className="mt-3 text-xs text-slate-400">Propagation {percentage.toFixed(1)}%</div>
                    <Progress value={percentage} className="mt-2" />
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {selectedMonitor && (
            <div className="space-y-6">
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-100">
                      {selectedMonitor.domain} {selectedMonitor.recordType}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Waiting for resolver majority to adopt {selectedMonitor.expectedValue}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => toggleMonitor(selectedMonitor)}>
                      {selectedMonitor.active ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" /> Resume
                        </>
                      )}
                    </Button>
                    <Button variant="outline" disabled={pollingNow} onClick={() => checkNow(selectedMonitor)}>
                      {pollingNow ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running
                        </>
                      ) : (
                        <>
                          <RefreshCcw className="mr-2 h-4 w-4" /> Check now
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Zap className="h-4 w-4 text-blue-400" /> Propagated
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-slate-100">
                      {selectedMonitor.latestCheck?.stats.matchedPercentage.toFixed(1) ?? "0.0"}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 text-slate-300">
                      <ShieldAlert className="h-4 w-4 text-emerald-400" /> Healthy Queries
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-slate-100">
                      {selectedMonitor.latestCheck?.stats.healthyPercentage.toFixed(1) ?? "0.0"}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="text-sm text-slate-300">Threshold</div>
                    <div className="mt-2 text-2xl font-semibold text-slate-100">
                      {selectedMonitor.thresholdPercentage}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <div className="text-sm text-slate-300">Last Check (UTC)</div>
                    <div className="mt-2 text-sm font-semibold text-slate-100">
                      {selectedMonitor.lastCheckedAt
                        ? new Date(selectedMonitor.lastCheckedAt).toLocaleString("en-US", {
                            timeZone: "UTC"
                          })
                        : "Pending"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedMonitor.latestCheck && (
                <WorldMapPanel results={selectedMonitor.latestCheck.results} />
              )}

              <ResolverStatus monitor={selectedMonitor} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

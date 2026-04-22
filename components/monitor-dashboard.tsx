"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Globe2, Loader2, PlayCircle } from "lucide-react";
import type { ReactNode } from "react";
import type { DnsRecordType, MonitorJob } from "@/lib/database";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DnsMap } from "@/components/dns-map";
import { PropagationStatus } from "@/components/propagation-status";

const recordTypes: DnsRecordType[] = ["A", "AAAA", "CNAME", "MX", "TXT", "NS"];

type MonitoringEvent = {
  type: "snapshot" | "error" | "completed";
  monitorId: string;
  monitor: MonitorJob | null;
  error?: string;
};

export function MonitorDashboard() {
  const [domain, setDomain] = useState("umami.microtool.dev");
  const [recordType, setRecordType] = useState<DnsRecordType>("A");
  const [expectedValue, setExpectedValue] = useState("");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("");
  const [alertThreshold, setAlertThreshold] = useState("95");
  const [monitor, setMonitor] = useState<MonitorJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  useEffect(() => {
    const lastMonitorId = window.localStorage.getItem("dnsr:lastMonitorId");
    if (!lastMonitorId) {
      return;
    }

    void (async () => {
      try {
        const response = await fetch(`/api/monitor/${lastMonitorId}`);
        if (!response.ok) {
          window.localStorage.removeItem("dnsr:lastMonitorId");
          return;
        }

        const payload = (await response.json()) as { monitor?: MonitorJob };
        if (!payload.monitor) {
          return;
        }

        setMonitor(payload.monitor);
        connectSSE(payload.monitor.id);
      } catch {
        // Ignore restore failures and allow manual monitor start.
      }
    })();
  }, []);

  const latestSnapshot = useMemo(
    () => monitor?.snapshots[monitor.snapshots.length - 1] ?? null,
    [monitor]
  );

  function connectSSE(monitorId: string) {
    eventSourceRef.current?.close();
    const eventSource = new EventSource(`/api/sse?monitorId=${monitorId}`);
    eventSourceRef.current = eventSource;

    const handleEvent = (event: Event) => {
      if (!(event instanceof MessageEvent)) {
        return;
      }
      const payload = JSON.parse(event.data) as MonitoringEvent;
      if (payload.monitor) {
        setMonitor(payload.monitor);
      }
      setConnected(true);

      if (payload.type === "error" && payload.error) {
        setError(payload.error);
      }
    };

    eventSource.addEventListener("snapshot", handleEvent);
    eventSource.addEventListener("completed", handleEvent);
    eventSource.addEventListener("monitor-error", handleEvent);
    eventSource.addEventListener("ping", () => {
      setConnected(true);
    });

    eventSource.onerror = () => {
      setConnected(false);
    };
  }

  async function startMonitoring() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/start-monitoring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          domain,
          recordType,
          expectedValue,
          notificationEmail,
          discordWebhookUrl,
          alertThreshold: Number(alertThreshold)
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        monitor?: MonitorJob;
      };

      if (!response.ok || !payload.monitor) {
        setError(payload.error ?? "Could not start monitoring session");
        return;
      }

      setMonitor(payload.monitor);
      window.localStorage.setItem("dnsr:lastMonitorId", payload.monitor.id);
      connectSSE(payload.monitor.id);
    } catch {
      setError("Network error while starting monitoring");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-cyan-300" />
                Start DNS Monitoring
              </CardTitle>
              <CardDescription>
                Poll 40+ global resolvers every 60 seconds and track when your expected DNS value is visible worldwide.
              </CardDescription>
            </div>
            <Badge variant={connected ? "success" : "default"}>{connected ? "Live SSE" : "Idle"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <Field label="Domain">
            <Input value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="example.com" />
          </Field>

          <Field label="Record Type">
            <Select value={recordType} onChange={(event) => setRecordType(event.target.value as DnsRecordType)}>
              {recordTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Expected DNS Value">
            <Input
              value={expectedValue}
              onChange={(event) => setExpectedValue(event.target.value)}
              placeholder={recordType === "TXT" ? "v=spf1 include:_spf.google.com ~all" : "76.76.21.21"}
            />
          </Field>

          <Field label="Alert Threshold (%)">
            <Input
              type="number"
              min={50}
              max={100}
              value={alertThreshold}
              onChange={(event) => setAlertThreshold(event.target.value)}
            />
          </Field>

          <Field label="Notification Email (optional)">
            <Input
              type="email"
              value={notificationEmail}
              onChange={(event) => setNotificationEmail(event.target.value)}
              placeholder="ops@company.com"
            />
          </Field>

          <Field label="Discord Webhook URL (optional)">
            <Input
              value={discordWebhookUrl}
              onChange={(event) => setDiscordWebhookUrl(event.target.value)}
              placeholder="https://discord.com/api/webhooks/..."
            />
          </Field>

          <div className="lg:col-span-2">
            <Button
              className="w-full"
              onClick={startMonitoring}
              disabled={loading || !domain.trim() || !expectedValue.trim()}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Start Monitoring
                </>
              )}
            </Button>
          </div>

          {error ? (
            <div className="lg:col-span-2 rounded-md border border-rose-800 bg-rose-950/40 p-3 text-sm text-rose-300">
              {error}
            </div>
          ) : null}

          <div className="lg:col-span-2 rounded-md border border-slate-800 bg-[#0b1220] p-3 text-sm text-slate-300">
            <div className="mb-1 flex items-center gap-2 font-medium text-slate-200">
              <Bell className="h-4 w-4 text-cyan-300" />
              Alert behavior
            </div>
            The monitor sends notifications when propagation crosses your threshold. If email is blank, it uses your paid account email.
          </div>
        </CardContent>
      </Card>

      {monitor ? (
        <>
          <PropagationStatus monitor={monitor} />

          <Card>
            <CardHeader>
              <CardTitle>Global Resolver Map</CardTitle>
              <CardDescription>
                Green markers already see your expected value. Amber markers still show old answers. Red markers failed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DnsMap resolverResults={latestSnapshot?.resolverResults ?? []} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest Resolver Results</CardTitle>
              <CardDescription>
                Ordered by resolver location with the current DNS answer from each endpoint.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="px-2 py-2 font-medium">Resolver</th>
                      <th className="px-2 py-2 font-medium">Location</th>
                      <th className="px-2 py-2 font-medium">Status</th>
                      <th className="px-2 py-2 font-medium">Answer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(latestSnapshot?.resolverResults ?? []).map((result) => (
                      <tr key={result.resolverId} className="border-b border-slate-900 text-slate-200">
                        <td className="px-2 py-2">
                          <div className="font-medium">{result.label}</div>
                          <div className="text-xs text-slate-400">{result.ip}</div>
                        </td>
                        <td className="px-2 py-2">
                          {result.city}, {result.country}
                        </td>
                        <td className="px-2 py-2">
                          {result.error ? (
                            <Badge variant="danger">Error</Badge>
                          ) : result.matched ? (
                            <Badge variant="success">Updated</Badge>
                          ) : (
                            <Badge>Pending</Badge>
                          )}
                        </td>
                        <td className="max-w-[380px] px-2 py-2">
                          <span className="block truncate" title={result.values.join(", ") || result.error || "No answer"}>
                            {result.values.join(", ") || result.error || "No answer"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

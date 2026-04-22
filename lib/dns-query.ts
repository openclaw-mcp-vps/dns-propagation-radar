import { Resolver as NodeResolver } from "node:dns/promises";
import { randomUUID } from "node:crypto";
import cron, { ScheduledTask } from "node-cron";
import { z } from "zod";
import {
  DEFAULT_MONITOR_INTERVAL_SECONDS,
  DEFAULT_THRESHOLD_PERCENTAGE,
  GLOBAL_DNS_RESOLVERS,
  SUPPORTED_RECORD_TYPES
} from "@/lib/dns-resolvers";
import { listMonitors, upsertMonitor } from "@/lib/database";
import { sendThresholdNotification } from "@/lib/notifications";
import { broadcastMonitorUpdate, broadcastMonitorError } from "@/lib/websocket";
import {
  DnsCheckResponse,
  DnsMonitor,
  DnsRecordType,
  MonitorNotificationConfig,
  PropagationHistoryPoint,
  ResolverDefinition,
  ResolverQueryResult
} from "@/types/dns";

const querySchema = z.object({
  domain: z.string().trim().min(3).max(253),
  recordType: z.enum(SUPPORTED_RECORD_TYPES),
  expectedValue: z.string().trim().optional()
});

const monitorSchema = querySchema.extend({
  expectedValue: z.string().trim().min(1),
  thresholdPercentage: z.number().int().min(50).max(100).optional(),
  intervalSeconds: z.number().int().min(60).max(3600).optional(),
  notification: z
    .object({
      email: z.string().email().optional(),
      discordWebhook: z.string().url().optional()
    })
    .optional()
});

const TIMEOUT_MS = 5_000;
const MAX_HISTORY_POINTS = 240;

declare global {
  // eslint-disable-next-line no-var
  var dnsRadarMonitorTask: ScheduledTask | undefined;
}

function normalizeDomain(input: string) {
  return input.trim().toLowerCase().replace(/\.+$/, "");
}

function normalizeRecordValue(recordType: DnsRecordType, value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (recordType === "MX" && value && typeof value === "object") {
    const candidate = value as { exchange?: string; priority?: number };
    if (candidate.exchange) {
      return `${candidate.priority ?? 0} ${candidate.exchange}`;
    }
  }

  if (recordType === "TXT") {
    if (Array.isArray(value)) {
      return value.map((chunk) => String(chunk)).join("");
    }
  }

  return JSON.stringify(value);
}

function toSafeError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown DNS query error";
}

async function queryResolver(
  resolver: ResolverDefinition,
  domain: string,
  recordType: DnsRecordType,
  expectedValue: string | null
): Promise<ResolverQueryResult> {
  const started = Date.now();
  const client = new NodeResolver();
  client.setServers([resolver.ip]);

  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Timed out after 5 seconds")), TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([client.resolve(domain, recordType), timeout]);
    const values = Array.isArray(result)
      ? result.map((item) => normalizeRecordValue(recordType, item))
      : [normalizeRecordValue(recordType, result)];

    const compactValues = values
      .map((value) => value.replace(/\.$/, "").trim())
      .filter(Boolean);

    const normalizedExpected = expectedValue?.toLowerCase().trim() ?? null;
    const matchedExpected =
      normalizedExpected === null
        ? false
        : compactValues.some((value) => value.toLowerCase().includes(normalizedExpected));

    return {
      resolverId: resolver.id,
      resolverName: resolver.name,
      resolverIp: resolver.ip,
      region: resolver.region,
      countryCode: resolver.countryCode,
      city: resolver.city,
      country: resolver.country,
      success: true,
      matchedExpected,
      values: compactValues,
      error: null,
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - started
    };
  } catch (error) {
    return {
      resolverId: resolver.id,
      resolverName: resolver.name,
      resolverIp: resolver.ip,
      region: resolver.region,
      countryCode: resolver.countryCode,
      city: resolver.city,
      country: resolver.country,
      success: false,
      matchedExpected: false,
      values: [],
      error: toSafeError(error),
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - started
    };
  }
}

export async function runDnsCheck(input: z.input<typeof querySchema>): Promise<DnsCheckResponse> {
  const parsed = querySchema.parse(input);
  const domain = normalizeDomain(parsed.domain);
  const expectedValue = parsed.expectedValue?.trim() || null;

  const results = await Promise.all(
    GLOBAL_DNS_RESOLVERS.map((resolver) => queryResolver(resolver, domain, parsed.recordType, expectedValue))
  );

  const successfulResolvers = results.filter((result) => result.success).length;
  const matchedResolvers = results.filter((result) => result.matchedExpected).length;

  return {
    domain,
    recordType: parsed.recordType,
    expectedValue,
    checkedAt: new Date().toISOString(),
    results,
    stats: {
      totalResolvers: results.length,
      successfulResolvers,
      matchedResolvers,
      matchedPercentage: Number(((matchedResolvers / results.length) * 100).toFixed(2)),
      healthyPercentage: Number(((successfulResolvers / results.length) * 100).toFixed(2))
    }
  };
}

export async function createMonitor(input: z.input<typeof monitorSchema>) {
  const parsed = monitorSchema.parse(input);

  const monitor: DnsMonitor = {
    id: randomUUID(),
    domain: normalizeDomain(parsed.domain),
    recordType: parsed.recordType,
    expectedValue: parsed.expectedValue,
    thresholdPercentage: parsed.thresholdPercentage ?? DEFAULT_THRESHOLD_PERCENTAGE,
    intervalSeconds: parsed.intervalSeconds ?? DEFAULT_MONITOR_INTERVAL_SECONDS,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastCheckedAt: null,
    alertSentAt: null,
    notification: parsed.notification ?? {},
    latestCheck: null,
    history: []
  };

  await upsertMonitor(monitor);

  return monitor;
}

export async function runSingleMonitorCheck(monitorId: string) {
  const monitors = await listMonitors();
  const monitor = monitors.find((item) => item.id === monitorId);

  if (!monitor) {
    throw new Error("Monitor not found");
  }

  if (!monitor.active) {
    return monitor;
  }

  const check = await runDnsCheck({
    domain: monitor.domain,
    recordType: monitor.recordType,
    expectedValue: monitor.expectedValue
  });

  const historyPoint: PropagationHistoryPoint = {
    timestamp: check.checkedAt,
    matchedPercentage: check.stats.matchedPercentage,
    healthyPercentage: check.stats.healthyPercentage,
    matchedResolvers: check.stats.matchedResolvers,
    successfulResolvers: check.stats.successfulResolvers,
    totalResolvers: check.stats.totalResolvers
  };

  let updated: DnsMonitor = {
    ...monitor,
    latestCheck: check,
    lastCheckedAt: check.checkedAt,
    updatedAt: check.checkedAt,
    history: [...monitor.history, historyPoint].slice(-MAX_HISTORY_POINTS)
  };

  const hitThreshold = check.stats.matchedPercentage >= monitor.thresholdPercentage;
  if (hitThreshold && !monitor.alertSentAt) {
    await sendThresholdNotification(updated);
    updated = {
      ...updated,
      alertSentAt: new Date().toISOString()
    };
  }

  await upsertMonitor(updated);
  broadcastMonitorUpdate(updated);

  return updated;
}

function shouldRunMonitorNow(monitor: DnsMonitor) {
  if (!monitor.active) {
    return false;
  }

  if (!monitor.lastCheckedAt) {
    return true;
  }

  const last = new Date(monitor.lastCheckedAt).getTime();
  return Date.now() - last >= monitor.intervalSeconds * 1000;
}

export async function runDueMonitorChecks() {
  const monitors = await listMonitors();
  const due = monitors.filter(shouldRunMonitorNow);

  await Promise.all(
    due.map(async (monitor) => {
      try {
        await runSingleMonitorCheck(monitor.id);
      } catch (error) {
        broadcastMonitorError(monitor.id, toSafeError(error));
      }
    })
  );
}

export function startMonitorScheduler() {
  if (global.dnsRadarMonitorTask) {
    return global.dnsRadarMonitorTask;
  }

  const task = cron.schedule("* * * * *", () => {
    void runDueMonitorChecks();
  });

  global.dnsRadarMonitorTask = task;
  return task;
}

export function parseMonitorNotification(input: unknown): MonitorNotificationConfig {
  if (!input || typeof input !== "object") {
    return {};
  }

  const candidate = input as { email?: unknown; discordWebhook?: unknown };
  const email = typeof candidate.email === "string" ? candidate.email.trim() : "";
  const discordWebhook =
    typeof candidate.discordWebhook === "string" ? candidate.discordWebhook.trim() : "";

  return {
    ...(email ? { email } : {}),
    ...(discordWebhook ? { discordWebhook } : {})
  };
}

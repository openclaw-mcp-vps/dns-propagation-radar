import { createHash } from "node:crypto";
import { Resolver } from "node:dns/promises";
import { EventEmitter } from "node:events";
import cron from "node-cron";
import { DNS_RESOLVERS } from "@/lib/dns-resolvers";
import {
  createNotificationSubscription,
  getMonitorSnapshotFromDatabase,
  listSubscriptionsForMonitor,
  markSubscriptionNotified,
  saveMonitorSnapshot
} from "@/lib/database";
import { sendPropagationNotification } from "@/lib/notifications";
import type {
  DNSRecordType,
  MonitorSnapshot,
  ResolverCheckResult,
  StartMonitorInput
} from "@/lib/types";
import { SUPPORTED_RECORD_TYPES } from "@/lib/types";

interface MonitorInternal {
  id: string;
  domain: string;
  recordType: DNSRecordType;
  targetValue: string | null;
  targetTokens: string[] | null;
  snapshot: MonitorSnapshot;
  polling: boolean;
}

const monitors = new Map<string, MonitorInternal>();
const events = new EventEmitter();

events.setMaxListeners(0);

let scheduler: ReturnType<typeof cron.schedule> | null = null;

function eventName(monitorId: string): string {
  return `monitor:update:${monitorId}`;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("query_timeout")), timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

function normalizeValue(value: string): string {
  return value
    .trim()
    .replace(/^"|"$/g, "")
    .replace(/\.$/, "")
    .toLowerCase();
}

function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .replace(/\.$/, "");
}

function normalizeTargetTokens(targetValue: string | null | undefined): string[] | null {
  if (!targetValue || !targetValue.trim()) {
    return null;
  }

  const tokens = targetValue
    .split(",")
    .map((token) => normalizeValue(token))
    .filter(Boolean);

  return tokens.length > 0 ? tokens : null;
}

function normalizeResponseValues(recordType: DNSRecordType, raw: unknown): string[] {
  if (recordType === "TXT") {
    const entries = raw as string[][];
    return [...new Set(entries.map((entry) => entry.join("")))]
      .map((value) => value.trim())
      .filter(Boolean)
      .sort();
  }

  if (recordType === "MX") {
    const entries = raw as { exchange: string; priority: number }[];
    return [...new Set(entries.map((entry) => `${entry.priority} ${entry.exchange.replace(/\.$/, "")}`))]
      .map((value) => value.trim())
      .filter(Boolean)
      .sort();
  }

  if (recordType === "A" || recordType === "AAAA" || recordType === "CNAME" || recordType === "NS") {
    const entries = raw as string[];
    return [...new Set(entries.map((entry) => entry.replace(/\.$/, "").trim()))]
      .filter(Boolean)
      .sort();
  }

  return [];
}

function answerSignature(values: string[]): string {
  if (values.length === 0) {
    return "__empty__";
  }

  return values.map((value) => normalizeValue(value)).sort().join("|");
}

function hasTargetMatch(values: string[], targetTokens: string[] | null): boolean {
  if (!targetTokens || targetTokens.length === 0) {
    return false;
  }

  const normalizedValues = values.map((value) => normalizeValue(value));
  return targetTokens.some((token) => normalizedValues.includes(token));
}

function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown DNS query error";
}

function createPendingSnapshot(input: {
  id: string;
  domain: string;
  recordType: DNSRecordType;
  targetValue: string | null;
}): MonitorSnapshot {
  const now = new Date().toISOString();

  const pendingResults: ResolverCheckResult[] = DNS_RESOLVERS.map((resolver) => ({
    resolverId: resolver.id,
    resolverName: resolver.name,
    provider: resolver.provider,
    resolverIp: resolver.ip,
    region: resolver.location.region,
    countryCode: resolver.location.countryCode,
    lat: resolver.location.lat,
    lng: resolver.location.lng,
    status: "pending",
    values: [],
    latencyMs: null,
    checkedAt: now,
    error: null
  }));

  return {
    id: input.id,
    domain: input.domain,
    recordType: input.recordType,
    targetValue: input.targetValue,
    targetDescription: input.targetValue
      ? `Expected value: ${input.targetValue}`
      : "Auto target: majority resolver answer",
    propagationPercent: 0,
    propagatedCount: 0,
    totalResolvers: DNS_RESOLVERS.length,
    checkedAt: now,
    roundsCompleted: 0,
    history: [],
    results: pendingResults
  };
}

async function queryResolver(input: {
  resolverIp: string;
  domain: string;
  recordType: DNSRecordType;
}): Promise<string[]> {
  const resolver = new Resolver();
  resolver.setServers([input.resolverIp]);

  if (input.recordType === "A") {
    return normalizeResponseValues("A", await withTimeout(resolver.resolve4(input.domain), 9000));
  }

  if (input.recordType === "AAAA") {
    return normalizeResponseValues("AAAA", await withTimeout(resolver.resolve6(input.domain), 9000));
  }

  if (input.recordType === "CNAME") {
    return normalizeResponseValues("CNAME", await withTimeout(resolver.resolveCname(input.domain), 9000));
  }

  if (input.recordType === "TXT") {
    return normalizeResponseValues("TXT", await withTimeout(resolver.resolveTxt(input.domain), 9000));
  }

  if (input.recordType === "MX") {
    return normalizeResponseValues("MX", await withTimeout(resolver.resolveMx(input.domain), 9000));
  }

  return normalizeResponseValues("NS", await withTimeout(resolver.resolveNs(input.domain), 9000));
}

function applyAutoTargetResolution(results: ResolverCheckResult[]): {
  updatedResults: ResolverCheckResult[];
  propagatedCount: number;
  targetDescription: string;
} {
  const signatureCounts = new Map<string, number>();
  const signatureValues = new Map<string, string[]>();

  for (const result of results) {
    if (result.status === "error") {
      continue;
    }

    const signature = answerSignature(result.values);
    signatureCounts.set(signature, (signatureCounts.get(signature) ?? 0) + 1);
    signatureValues.set(signature, result.values);
  }

  if (signatureCounts.size === 0) {
    return {
      updatedResults: results,
      propagatedCount: 0,
      targetDescription: "No successful resolver answers yet"
    };
  }

  const top = [...signatureCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const [majoritySignature] = top;
  const majorityValues = signatureValues.get(majoritySignature) ?? [];

  let propagatedCount = 0;

  const updatedResults = results.map((result) => {
    if (result.status === "error") {
      return result;
    }

    if (answerSignature(result.values) === majoritySignature) {
      propagatedCount += 1;
      return { ...result, status: "propagated" as const };
    }

    return { ...result, status: "stale" as const };
  });

  return {
    updatedResults,
    propagatedCount,
    targetDescription:
      majorityValues.length > 0
        ? `Majority value: ${majorityValues.join(", ")}`
        : "Majority value: empty answer"
  };
}

async function pollMonitor(monitorId: string): Promise<void> {
  const monitor = monitors.get(monitorId);

  if (!monitor || monitor.polling) {
    return;
  }

  monitor.polling = true;

  try {
    const checkedAt = new Date().toISOString();

    const rawResults = await Promise.all(
      DNS_RESOLVERS.map(async (resolver) => {
        const startedAt = Date.now();

        try {
          const values = await queryResolver({
            resolverIp: resolver.ip,
            domain: monitor.domain,
            recordType: monitor.recordType
          });

          const matched = hasTargetMatch(values, monitor.targetTokens);

          return {
            resolverId: resolver.id,
            resolverName: resolver.name,
            provider: resolver.provider,
            resolverIp: resolver.ip,
            region: resolver.location.region,
            countryCode: resolver.location.countryCode,
            lat: resolver.location.lat,
            lng: resolver.location.lng,
            status: monitor.targetTokens
              ? matched
                ? ("propagated" as const)
                : ("stale" as const)
              : ("stale" as const),
            values,
            latencyMs: Date.now() - startedAt,
            checkedAt,
            error: null
          } satisfies ResolverCheckResult;
        } catch (error) {
          return {
            resolverId: resolver.id,
            resolverName: resolver.name,
            provider: resolver.provider,
            resolverIp: resolver.ip,
            region: resolver.location.region,
            countryCode: resolver.location.countryCode,
            lat: resolver.location.lat,
            lng: resolver.location.lng,
            status: "error" as const,
            values: [],
            latencyMs: Date.now() - startedAt,
            checkedAt,
            error: sanitizeError(error)
          } satisfies ResolverCheckResult;
        }
      })
    );

    const resolution = monitor.targetTokens
      ? {
          updatedResults: rawResults,
          propagatedCount: rawResults.filter((result) => result.status === "propagated").length,
          targetDescription: `Expected value: ${monitor.targetValue}`
        }
      : applyAutoTargetResolution(rawResults);

    const propagationPercent =
      (resolution.propagatedCount / Math.max(DNS_RESOLVERS.length, 1)) * 100;

    const nextHistory = [
      ...monitor.snapshot.history,
      {
        timestamp: checkedAt,
        propagatedPercent: Number(propagationPercent.toFixed(1))
      }
    ].slice(-240);

    const nextSnapshot: MonitorSnapshot = {
      ...monitor.snapshot,
      targetDescription: resolution.targetDescription,
      checkedAt,
      propagationPercent: Number(propagationPercent.toFixed(1)),
      propagatedCount: resolution.propagatedCount,
      roundsCompleted: monitor.snapshot.roundsCompleted + 1,
      history: nextHistory,
      results: resolution.updatedResults
    };

    monitor.snapshot = nextSnapshot;
    await saveMonitorSnapshot(nextSnapshot);

    events.emit(eventName(monitorId), nextSnapshot);

    const subscriptions = await listSubscriptionsForMonitor(monitorId);

    for (const subscription of subscriptions) {
      if (subscription.notifiedAt) {
        continue;
      }

      if (nextSnapshot.propagationPercent < subscription.thresholdPercent) {
        continue;
      }

      try {
        await sendPropagationNotification({
          subscription,
          snapshot: nextSnapshot
        });

        await markSubscriptionNotified(subscription.id);
      } catch (error) {
        console.error("[dns-poller] notification delivery failed", error);
      }
    }
  } finally {
    monitor.polling = false;
  }
}

async function pollAllMonitors(): Promise<void> {
  const ids = [...monitors.keys()];
  await Promise.allSettled(ids.map((monitorId) => pollMonitor(monitorId)));
}

function ensureScheduler() {
  if (scheduler) {
    return;
  }

  scheduler = cron.schedule("* * * * *", () => {
    void pollAllMonitors();
  });
}

function monitorIdForInput(input: {
  domain: string;
  recordType: DNSRecordType;
  targetValue: string | null;
}): string {
  return createHash("sha1")
    .update(`${input.domain}|${input.recordType}|${input.targetValue ?? ""}`)
    .digest("hex")
    .slice(0, 16);
}

export function isSupportedRecordType(value: string): value is DNSRecordType {
  return SUPPORTED_RECORD_TYPES.includes(value as DNSRecordType);
}

export function normalizeDomainInput(input: string): string {
  return normalizeDomain(input);
}

export function isValidDomain(domain: string): boolean {
  const pattern = /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z0-9-]{2,63}$/i;
  return pattern.test(domain);
}

export async function startMonitor(input: StartMonitorInput): Promise<MonitorSnapshot> {
  const domain = normalizeDomain(input.domain);
  const targetValue = input.targetValue?.trim() || null;

  const id = monitorIdForInput({
    domain,
    recordType: input.recordType,
    targetValue
  });

  const existing = monitors.get(id);

  if (existing) {
    return existing.snapshot;
  }

  const snapshot = createPendingSnapshot({
    id,
    domain,
    recordType: input.recordType,
    targetValue
  });

  monitors.set(id, {
    id,
    domain,
    recordType: input.recordType,
    targetValue,
    targetTokens: normalizeTargetTokens(targetValue),
    snapshot,
    polling: false
  });

  await saveMonitorSnapshot(snapshot);
  ensureScheduler();
  void pollMonitor(id);

  return snapshot;
}

export async function getMonitorSnapshot(monitorId: string): Promise<MonitorSnapshot | null> {
  const monitor = monitors.get(monitorId);

  if (monitor) {
    return monitor.snapshot;
  }

  const fromDb = await getMonitorSnapshotFromDatabase(monitorId);

  if (!fromDb) {
    return null;
  }

  monitors.set(monitorId, {
    id: fromDb.id,
    domain: fromDb.domain,
    recordType: fromDb.recordType,
    targetValue: fromDb.targetValue,
    targetTokens: normalizeTargetTokens(fromDb.targetValue),
    snapshot: fromDb,
    polling: false
  });

  ensureScheduler();
  void pollMonitor(monitorId);

  return fromDb;
}

export function subscribeToMonitorUpdates(
  monitorId: string,
  listener: (snapshot: MonitorSnapshot) => void
): () => void {
  const name = eventName(monitorId);
  events.on(name, listener);

  return () => {
    events.off(name, listener);
  };
}

export async function createMonitorSubscription(input: {
  monitorId: string;
  email?: string;
  discordWebhookUrl?: string;
  thresholdPercent: number;
}) {
  const subscription = await createNotificationSubscription(input);

  const snapshot = await getMonitorSnapshot(input.monitorId);

  if (snapshot && snapshot.propagationPercent >= subscription.thresholdPercent) {
    try {
      await sendPropagationNotification({
        subscription,
        snapshot
      });

      await markSubscriptionNotified(subscription.id);
      return {
        ...subscription,
        notifiedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error("[dns-poller] immediate notification delivery failed", error);
    }
  }

  return subscription;
}

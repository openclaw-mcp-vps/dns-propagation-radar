import { randomUUID } from "node:crypto";
import { Resolver } from "node:dns/promises";
import cron from "node-cron";
import { DNS_RESOLVERS } from "@/lib/dns-resolvers";
import { sendPropagationNotifications } from "@/lib/notification-service";
import { broadcastCheckUpdate, ensureWebsocketServer } from "@/lib/websocket-server";
import {
  type DnsCheckSession,
  type ResolverCheckResult,
  getCheck,
  listRunningChecks,
  upsertCheck
} from "@/lib/storage";

const DNS_TYPES = ["A", "AAAA", "CNAME", "MX", "TXT", "NS"] as const;

type RecordType = (typeof DNS_TYPES)[number];

type CreateCheckInput = {
  domain: string;
  recordType: string;
  expectedValue: string;
};

let schedulerInitialized = false;
const inFlightChecks = new Set<string>();

function normalizeAnswer(answer: unknown) {
  if (typeof answer === "string") return answer;
  if (Array.isArray(answer)) return answer.join(";");
  if (answer && typeof answer === "object") {
    const typed = answer as Record<string, unknown>;
    if (typeof typed.exchange === "string") return typed.exchange;
    if (typeof typed.address === "string") return typed.address;
    if (typeof typed.value === "string") return typed.value;
  }
  return JSON.stringify(answer);
}

async function resolveWithServer(domain: string, type: RecordType, serverIp: string) {
  const resolver = new Resolver();
  resolver.setServers([serverIp]);

  const startedAt = Date.now();
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("DNS query timed out after 5 seconds")), 5000);
  });

  const query = resolver.resolve(domain, type as never);
  const result = (await Promise.race([query, timeout])) as unknown[];

  return {
    answers: result.map(normalizeAnswer),
    latencyMs: Date.now() - startedAt
  };
}

function calculatePropagation(resolvers: ResolverCheckResult[]) {
  const completed = resolvers.filter((item) => item.status !== "pending");
  if (completed.length === 0) return 0;
  const matched = completed.filter((item) => item.status === "match").length;
  return (matched / completed.length) * 100;
}

export async function runCheckOnce(checkId: string) {
  if (inFlightChecks.has(checkId)) return null;
  inFlightChecks.add(checkId);

  const session = await getCheck(checkId);
  if (!session || session.status !== "running") {
    inFlightChecks.delete(checkId);
    return null;
  }

  const expected = session.expectedValue.toLowerCase().trim();

  try {
    const resolverResults = await Promise.all(
      DNS_RESOLVERS.map(async (resolver): Promise<ResolverCheckResult> => {
        try {
          const response = await resolveWithServer(session.domain, session.recordType as RecordType, resolver.ip);
          const normalizedAnswers = response.answers.map((answer) => answer.toLowerCase().trim());
          const match = normalizedAnswers.some((answer) => answer.includes(expected));

          return {
            resolverId: resolver.id,
            resolverName: resolver.name,
            region: resolver.region,
            country: resolver.country,
            latitude: resolver.latitude,
            longitude: resolver.longitude,
            ip: resolver.ip,
            status: match ? "match" : "mismatch",
            answers: response.answers,
            latencyMs: response.latencyMs,
            checkedAt: new Date().toISOString(),
            error: null
          };
        } catch (error) {
          return {
            resolverId: resolver.id,
            resolverName: resolver.name,
            region: resolver.region,
            country: resolver.country,
            latitude: resolver.latitude,
            longitude: resolver.longitude,
            ip: resolver.ip,
            status: "error",
            answers: [],
            latencyMs: 0,
            checkedAt: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Unknown DNS error"
          };
        }
      })
    );

    session.resolvers = resolverResults;
    session.lastRunAt = new Date().toISOString();
    session.propagationPercent = calculatePropagation(resolverResults);

    const threshold = session.notifications?.thresholdPercent ?? 95;
    if (!session.notified && session.propagationPercent >= threshold) {
      await sendPropagationNotifications(session);
      session.notified = true;
      if (session.propagationPercent >= 99.9) {
        session.status = "completed";
      }
    }

    await upsertCheck(session);
    broadcastCheckUpdate(session.id, { type: "check:update", payload: session });

    return session;
  } finally {
    inFlightChecks.delete(checkId);
  }
}

async function runAllRunningChecks() {
  const runningChecks = await listRunningChecks();
  await Promise.all(runningChecks.map((check) => runCheckOnce(check.id)));
}

export function ensureDnsScheduler() {
  ensureWebsocketServer();

  if (schedulerInitialized) return;
  schedulerInitialized = true;

  cron.schedule("*/1 * * * *", () => {
    runAllRunningChecks().catch(() => {
      // Keep scheduler alive even if one pass fails.
    });
  });
}

export function isValidRecordType(value: string): value is RecordType {
  return DNS_TYPES.includes(value as RecordType);
}

export function createCheckSession(input: CreateCheckInput): DnsCheckSession {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    domain: input.domain,
    recordType: input.recordType,
    expectedValue: input.expectedValue,
    createdAt: now,
    lastRunAt: null,
    status: "running",
    propagationPercent: 0,
    notified: false,
    resolvers: DNS_RESOLVERS.map((resolver) => ({
      resolverId: resolver.id,
      resolverName: resolver.name,
      region: resolver.region,
      country: resolver.country,
      latitude: resolver.latitude,
      longitude: resolver.longitude,
      ip: resolver.ip,
      status: "pending",
      answers: [],
      latencyMs: 0,
      checkedAt: null,
      error: null
    }))
  };
}

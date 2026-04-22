import fs from "node:fs/promises";
import path from "node:path";
import { GLOBAL_RESOLVERS } from "@/lib/nameservers";

export type DnsRecordType = "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS";

export type ResolverCheckResult = {
  resolverId: string;
  label: string;
  provider: string;
  ip: string;
  city: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  checkedAt: string;
  values: string[];
  matched: boolean;
  error?: string;
  durationMs?: number;
};

export type MonitoringSnapshot = {
  checkedAt: string;
  resolvedCount: number;
  totalResolvers: number;
  propagationPercent: number;
  resolverResults: ResolverCheckResult[];
};

export type MonitorJob = {
  id: string;
  ownerEmail: string;
  domain: string;
  recordType: DnsRecordType;
  expectedValue: string;
  alertThreshold: number;
  createdAt: string;
  updatedAt: string;
  status: "running" | "completed" | "error";
  notification: {
    email?: string;
    discordWebhookUrl?: string;
  };
  alertedAt?: string;
  lastError?: string;
  snapshots: MonitoringSnapshot[];
};

export type PurchaseRecord = {
  email: string;
  status: "active" | "disabled";
  createdAt: string;
  lastPaymentAt: string;
  stripeCustomerId?: string;
  stripeSessionId?: string;
};

type StoreData = {
  monitors: Record<string, MonitorJob>;
  purchases: Record<string, PurchaseRecord>;
};

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "store.json");

let writeChain: Promise<void> = Promise.resolve();

const initialStore = (): StoreData => ({
  monitors: {},
  purchases: {}
});

async function ensureStoreFile(): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify(initialStore(), null, 2), "utf8");
  }
}

export async function readStore(): Promise<StoreData> {
  await ensureStoreFile();
  const raw = await fs.readFile(dataFile, "utf8");
  if (!raw.trim()) {
    return initialStore();
  }

  try {
    const parsed = JSON.parse(raw) as StoreData;
    return {
      monitors: parsed.monitors ?? {},
      purchases: parsed.purchases ?? {}
    };
  } catch {
    return initialStore();
  }
}

export async function writeStore(mutator: (data: StoreData) => void): Promise<void> {
  writeChain = writeChain.then(async () => {
    const store = await readStore();
    mutator(store);
    await fs.writeFile(dataFile, JSON.stringify(store, null, 2), "utf8");
  });

  return writeChain;
}

export async function createMonitorJob(input: {
  ownerEmail: string;
  domain: string;
  recordType: DnsRecordType;
  expectedValue: string;
  alertThreshold?: number;
  notification?: { email?: string; discordWebhookUrl?: string };
}): Promise<MonitorJob> {
  const now = new Date().toISOString();
  const id = `mon_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;

  const monitor: MonitorJob = {
    id,
    ownerEmail: input.ownerEmail,
    domain: input.domain,
    recordType: input.recordType,
    expectedValue: input.expectedValue,
    alertThreshold: input.alertThreshold ?? 95,
    createdAt: now,
    updatedAt: now,
    status: "running",
    notification: {
      email: input.notification?.email,
      discordWebhookUrl: input.notification?.discordWebhookUrl
    },
    snapshots: []
  };

  await writeStore((store) => {
    store.monitors[id] = monitor;
  });

  return monitor;
}

export async function updateMonitorJob(
  monitorId: string,
  updater: (job: MonitorJob) => MonitorJob
): Promise<MonitorJob | null> {
  let updated: MonitorJob | null = null;

  await writeStore((store) => {
    const current = store.monitors[monitorId];
    if (!current) {
      return;
    }

    updated = updater(current);
    updated.updatedAt = new Date().toISOString();
    store.monitors[monitorId] = updated;
  });

  return updated;
}

export async function getMonitorJob(monitorId: string): Promise<MonitorJob | null> {
  const store = await readStore();
  return store.monitors[monitorId] ?? null;
}

export async function appendMonitorSnapshot(
  monitorId: string,
  snapshot: MonitoringSnapshot,
  maxSnapshots = 120
): Promise<MonitorJob | null> {
  return updateMonitorJob(monitorId, (job) => {
    const nextSnapshots = [...job.snapshots, snapshot];
    if (nextSnapshots.length > maxSnapshots) {
      nextSnapshots.splice(0, nextSnapshots.length - maxSnapshots);
    }

    return {
      ...job,
      status: "running",
      snapshots: nextSnapshots,
      lastError: undefined
    };
  });
}

export async function setMonitorError(monitorId: string, errorMessage: string): Promise<void> {
  await updateMonitorJob(monitorId, (job) => ({
    ...job,
    status: "error",
    lastError: errorMessage
  }));
}

export async function setMonitorAlerted(monitorId: string): Promise<void> {
  await updateMonitorJob(monitorId, (job) => ({
    ...job,
    alertedAt: new Date().toISOString(),
    status: "completed"
  }));
}

export async function upsertPurchaseRecord(input: {
  email: string;
  stripeCustomerId?: string;
  stripeSessionId?: string;
}): Promise<PurchaseRecord> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const now = new Date().toISOString();

  const purchase: PurchaseRecord = {
    email: normalizedEmail,
    status: "active",
    createdAt: now,
    lastPaymentAt: now,
    stripeCustomerId: input.stripeCustomerId,
    stripeSessionId: input.stripeSessionId
  };

  await writeStore((store) => {
    const existing = store.purchases[normalizedEmail];
    store.purchases[normalizedEmail] = {
      ...existing,
      ...purchase,
      createdAt: existing?.createdAt ?? now
    };
  });

  return purchase;
}

export async function getPurchaseRecord(email: string): Promise<PurchaseRecord | null> {
  const store = await readStore();
  return store.purchases[email.trim().toLowerCase()] ?? null;
}

export function sanitizeExpectedValue(value: string): string {
  return value.trim().replace(/\.$/, "").toLowerCase();
}

export function ensureExpectedValue(value: string, type: DnsRecordType): string {
  const clean = sanitizeExpectedValue(value);

  if (type === "TXT") {
    return value.trim();
  }

  if (type === "MX") {
    return clean.replace(/^\d+\s+/, "");
  }

  return clean;
}

export function normalizeAnswerValue(value: string, type: DnsRecordType): string {
  if (type === "TXT") {
    return value.trim();
  }

  const clean = sanitizeExpectedValue(value);
  if (type === "MX") {
    return clean.replace(/^\d+\s+/, "");
  }

  return clean;
}

export function countMatches(
  resolverResults: ResolverCheckResult[]
): { resolvedCount: number; propagationPercent: number } {
  const totalResolvers = resolverResults.length || GLOBAL_RESOLVERS.length;
  const resolvedCount = resolverResults.filter((entry) => entry.matched).length;
  return {
    resolvedCount,
    propagationPercent: Number(((resolvedCount / totalResolvers) * 100).toFixed(2))
  };
}

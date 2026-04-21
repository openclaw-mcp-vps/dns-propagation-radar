import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type {
  MonitorSnapshot,
  NotificationSubscription,
  PersistedDatabase,
  PurchaseRecord
} from "@/lib/types";

const DATA_DIRECTORY = path.join(process.cwd(), ".data");
const DATABASE_FILE = path.join(DATA_DIRECTORY, "database.json");

const EMPTY_DATABASE: PersistedDatabase = {
  purchases: [],
  subscriptions: [],
  snapshots: {}
};

let writeChain = Promise.resolve();

async function ensureDatabaseFile() {
  await mkdir(DATA_DIRECTORY, { recursive: true });

  try {
    await readFile(DATABASE_FILE, "utf8");
  } catch {
    await writeFile(DATABASE_FILE, JSON.stringify(EMPTY_DATABASE, null, 2), "utf8");
  }
}

async function readDatabase(): Promise<PersistedDatabase> {
  await ensureDatabaseFile();
  const raw = await readFile(DATABASE_FILE, "utf8");
  const parsed = JSON.parse(raw) as Partial<PersistedDatabase>;

  return {
    purchases: parsed.purchases ?? [],
    subscriptions: parsed.subscriptions ?? [],
    snapshots: parsed.snapshots ?? {}
  };
}

async function writeDatabase(data: PersistedDatabase) {
  await writeFile(DATABASE_FILE, JSON.stringify(data, null, 2), "utf8");
}

async function queueWrite<T>(operation: (db: PersistedDatabase) => Promise<T> | T): Promise<T> {
  const task = writeChain.then(async () => {
    const db = await readDatabase();
    const result = await operation(db);
    await writeDatabase(db);
    return result;
  });

  writeChain = task.then(
    () => undefined,
    () => undefined
  );

  return task;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function addPurchase(input: {
  email: string;
  providerReference: string;
}): Promise<PurchaseRecord> {
  const normalizedEmail = normalizeEmail(input.email);

  return queueWrite((db) => {
    const existing = db.purchases.find(
      (record) =>
        record.email === normalizedEmail && record.providerReference === input.providerReference
    );

    if (existing) {
      return existing;
    }

    const nextRecord: PurchaseRecord = {
      id: randomUUID(),
      email: normalizedEmail,
      provider: "stripe",
      providerReference: input.providerReference,
      createdAt: new Date().toISOString()
    };

    db.purchases.push(nextRecord);
    return nextRecord;
  });
}

export async function hasPurchaseForEmail(email: string): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email);
  const db = await readDatabase();
  return db.purchases.some((purchase) => purchase.email === normalizedEmail);
}

export async function saveMonitorSnapshot(snapshot: MonitorSnapshot): Promise<void> {
  await queueWrite((db) => {
    db.snapshots[snapshot.id] = snapshot;
  });
}

export async function getMonitorSnapshotFromDatabase(
  monitorId: string
): Promise<MonitorSnapshot | null> {
  const db = await readDatabase();
  return db.snapshots[monitorId] ?? null;
}

export async function createNotificationSubscription(input: {
  monitorId: string;
  email?: string;
  discordWebhookUrl?: string;
  thresholdPercent: number;
}): Promise<NotificationSubscription> {
  const email = input.email?.trim() ? normalizeEmail(input.email) : null;
  const webhook = input.discordWebhookUrl?.trim() ? input.discordWebhookUrl.trim() : null;

  return queueWrite((db) => {
    const next: NotificationSubscription = {
      id: randomUUID(),
      monitorId: input.monitorId,
      email,
      discordWebhookUrl: webhook,
      thresholdPercent: input.thresholdPercent,
      createdAt: new Date().toISOString(),
      notifiedAt: null
    };

    db.subscriptions.push(next);
    return next;
  });
}

export async function listSubscriptionsForMonitor(
  monitorId: string
): Promise<NotificationSubscription[]> {
  const db = await readDatabase();
  return db.subscriptions.filter((subscription) => subscription.monitorId === monitorId);
}

export async function markSubscriptionNotified(subscriptionId: string): Promise<void> {
  await queueWrite((db) => {
    const record = db.subscriptions.find((subscription) => subscription.id === subscriptionId);

    if (record) {
      record.notifiedAt = new Date().toISOString();
    }
  });
}

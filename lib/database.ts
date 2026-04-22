import { promises as fs } from "node:fs";
import path from "node:path";
import { AccessGrant, DatabaseShape, DnsMonitor } from "@/types/dns";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "database.json");

const defaultData: DatabaseShape = {
  monitors: [],
  accessGrants: []
};

let writeQueue: Promise<void> = Promise.resolve();

async function ensureDatabaseFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_FILE);
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify(defaultData, null, 2), "utf8");
  }
}

export async function readDatabase(): Promise<DatabaseShape> {
  await ensureDatabaseFile();
  const raw = await fs.readFile(DB_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw) as DatabaseShape;
    return {
      monitors: Array.isArray(parsed.monitors) ? parsed.monitors : [],
      accessGrants: Array.isArray(parsed.accessGrants) ? parsed.accessGrants : []
    };
  } catch {
    return defaultData;
  }
}

export async function writeDatabase(mutator: (current: DatabaseShape) => DatabaseShape | Promise<DatabaseShape>) {
  writeQueue = writeQueue.then(async () => {
    const current = await readDatabase();
    const next = await mutator(current);
    const temp = `${DB_FILE}.tmp`;
    await fs.writeFile(temp, JSON.stringify(next, null, 2), "utf8");
    await fs.rename(temp, DB_FILE);
  });

  await writeQueue;
}

export async function listMonitors() {
  const db = await readDatabase();
  return db.monitors;
}

export async function getMonitorById(id: string): Promise<DnsMonitor | null> {
  const db = await readDatabase();
  return db.monitors.find((m) => m.id === id) ?? null;
}

export async function upsertMonitor(monitor: DnsMonitor) {
  await writeDatabase((db) => {
    const idx = db.monitors.findIndex((m) => m.id === monitor.id);
    if (idx >= 0) {
      db.monitors[idx] = monitor;
    } else {
      db.monitors.unshift(monitor);
    }
    return db;
  });
}

export async function updateMonitor(
  id: string,
  updater: (existing: DnsMonitor) => DnsMonitor | null
) {
  let updated: DnsMonitor | null | undefined;

  await writeDatabase((db) => {
    const idx = db.monitors.findIndex((m) => m.id === id);
    if (idx < 0) {
      updated = undefined;
      return db;
    }

    const next = updater(db.monitors[idx]);
    if (!next) {
      db.monitors.splice(idx, 1);
      updated = null;
      return db;
    }

    db.monitors[idx] = next;
    updated = next;
    return db;
  });

  return updated;
}

export async function listAccessGrants() {
  const db = await readDatabase();
  return db.accessGrants;
}

export async function hasAccessGrant(email: string) {
  const db = await readDatabase();
  const lowered = email.trim().toLowerCase();
  return db.accessGrants.some((grant) => grant.email.toLowerCase() === lowered);
}

export async function addAccessGrant(grant: AccessGrant) {
  await writeDatabase((db) => {
    const lowered = grant.email.toLowerCase();
    const exists = db.accessGrants.some((item) => item.email.toLowerCase() === lowered);
    if (!exists) {
      db.accessGrants.unshift(grant);
    }
    return db;
  });
}

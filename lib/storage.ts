import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type ResolverCheckResult = {
  resolverId: string;
  resolverName: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  ip: string;
  status: "match" | "mismatch" | "error" | "pending";
  answers: string[];
  latencyMs: number;
  checkedAt: string | null;
  error: string | null;
};

export type NotificationSettings = {
  thresholdPercent: number;
  email?: string;
  discordWebhookUrl?: string;
};

export type DnsCheckSession = {
  id: string;
  domain: string;
  recordType: string;
  expectedValue: string;
  createdAt: string;
  lastRunAt: string | null;
  status: "running" | "completed";
  propagationPercent: number;
  notified: boolean;
  resolvers: ResolverCheckResult[];
  notifications?: NotificationSettings;
};

type AppState = {
  checks: DnsCheckSession[];
  paidEmails: string[];
};

const DATA_DIR = join(process.cwd(), "data");
const STATE_FILE = join(DATA_DIR, "state.json");

const EMPTY_STATE: AppState = {
  checks: [],
  paidEmails: []
};

async function ensureStateFile() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(STATE_FILE, "utf8");
  } catch {
    await writeFile(STATE_FILE, JSON.stringify(EMPTY_STATE, null, 2), "utf8");
  }
}

export async function readState(): Promise<AppState> {
  await ensureStateFile();
  const content = await readFile(STATE_FILE, "utf8");
  return JSON.parse(content) as AppState;
}

export async function writeState(next: AppState) {
  await ensureStateFile();
  await writeFile(STATE_FILE, JSON.stringify(next, null, 2), "utf8");
}

export async function upsertCheck(session: DnsCheckSession) {
  const state = await readState();
  const index = state.checks.findIndex((item) => item.id === session.id);
  if (index === -1) state.checks.unshift(session);
  else state.checks[index] = session;
  await writeState(state);
}

export async function getCheck(checkId: string) {
  const state = await readState();
  return state.checks.find((item) => item.id === checkId) ?? null;
}

export async function listChecks(limit = 10) {
  const state = await readState();
  return state.checks.slice(0, limit);
}

export async function listRunningChecks() {
  const state = await readState();
  return state.checks.filter((item) => item.status === "running");
}

export async function saveNotificationSettings(checkId: string, notifications: NotificationSettings) {
  const state = await readState();
  const session = state.checks.find((item) => item.id === checkId);
  if (!session) return null;
  session.notifications = notifications;
  await writeState(state);
  return session;
}

export async function addPaidEmail(email: string) {
  const state = await readState();
  if (!state.paidEmails.includes(email)) {
    state.paidEmails.push(email);
    await writeState(state);
  }
}

export async function hasPaidEmail(email: string) {
  const state = await readState();
  return state.paidEmails.includes(email);
}

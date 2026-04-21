export const SUPPORTED_RECORD_TYPES = ["A", "AAAA", "CNAME", "TXT", "MX", "NS"] as const;

export type DNSRecordType = (typeof SUPPORTED_RECORD_TYPES)[number];

export interface DNSResolverLocation {
  lat: number;
  lng: number;
  region: string;
  countryCode: string;
}

export interface DNSResolverDefinition {
  id: string;
  name: string;
  provider: string;
  ip: string;
  location: DNSResolverLocation;
}

export type ResolverResultStatus = "pending" | "propagated" | "stale" | "error";

export interface ResolverCheckResult {
  resolverId: string;
  resolverName: string;
  provider: string;
  resolverIp: string;
  region: string;
  countryCode: string;
  lat: number;
  lng: number;
  status: ResolverResultStatus;
  values: string[];
  latencyMs: number | null;
  checkedAt: string;
  error: string | null;
}

export interface MonitorHistoryPoint {
  timestamp: string;
  propagatedPercent: number;
}

export interface MonitorSnapshot {
  id: string;
  domain: string;
  recordType: DNSRecordType;
  targetValue: string | null;
  targetDescription: string;
  propagationPercent: number;
  propagatedCount: number;
  totalResolvers: number;
  checkedAt: string;
  roundsCompleted: number;
  history: MonitorHistoryPoint[];
  results: ResolverCheckResult[];
}

export interface StartMonitorInput {
  domain: string;
  recordType: DNSRecordType;
  targetValue?: string | null;
}

export interface NotificationSubscription {
  id: string;
  monitorId: string;
  email: string | null;
  discordWebhookUrl: string | null;
  thresholdPercent: number;
  createdAt: string;
  notifiedAt: string | null;
}

export interface PurchaseRecord {
  id: string;
  email: string;
  provider: "stripe";
  providerReference: string;
  createdAt: string;
}

export interface PersistedDatabase {
  purchases: PurchaseRecord[];
  subscriptions: NotificationSubscription[];
  snapshots: Record<string, MonitorSnapshot>;
}

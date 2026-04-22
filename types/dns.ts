export type DnsRecordType = "A" | "AAAA" | "CNAME" | "MX" | "TXT" | "NS";

export type ResolverRegion = "NA" | "SA" | "EU" | "AF" | "ME" | "AP";

export type ResolverDefinition = {
  id: string;
  name: string;
  ip: string;
  city: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  region: ResolverRegion;
};

export type ResolverQueryResult = {
  resolverId: string;
  resolverName: string;
  resolverIp: string;
  region: ResolverRegion;
  countryCode: string;
  city: string;
  country: string;
  success: boolean;
  matchedExpected: boolean;
  values: string[];
  error: string | null;
  checkedAt: string;
  latencyMs: number;
};

export type DnsCheckStats = {
  totalResolvers: number;
  successfulResolvers: number;
  matchedResolvers: number;
  matchedPercentage: number;
  healthyPercentage: number;
};

export type DnsCheckResponse = {
  domain: string;
  recordType: DnsRecordType;
  expectedValue: string | null;
  checkedAt: string;
  results: ResolverQueryResult[];
  stats: DnsCheckStats;
};

export type PropagationHistoryPoint = {
  timestamp: string;
  matchedPercentage: number;
  healthyPercentage: number;
  matchedResolvers: number;
  successfulResolvers: number;
  totalResolvers: number;
};

export type MonitorNotificationConfig = {
  email?: string;
  discordWebhook?: string;
};

export type DnsMonitor = {
  id: string;
  domain: string;
  recordType: DnsRecordType;
  expectedValue: string;
  thresholdPercentage: number;
  intervalSeconds: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastCheckedAt: string | null;
  alertSentAt: string | null;
  notification: MonitorNotificationConfig;
  latestCheck: DnsCheckResponse | null;
  history: PropagationHistoryPoint[];
};

export type MonitorListResponse = {
  monitors: DnsMonitor[];
  websocketUrl: string;
};

export type MonitorWebsocketMessage =
  | {
      type: "subscribed";
      monitorId: string;
      at: string;
    }
  | {
      type: "monitor-update";
      monitor: DnsMonitor;
      at: string;
    }
  | {
      type: "monitor-error";
      monitorId: string;
      error: string;
      at: string;
    };

export type AccessGrant = {
  email: string;
  grantedAt: string;
  source: "stripe-webhook" | "manual";
  reference: string;
};

export type DatabaseShape = {
  monitors: DnsMonitor[];
  accessGrants: AccessGrant[];
};

import { Resolver } from "node:dns/promises";
import { GLOBAL_RESOLVERS, type GlobalResolver } from "@/lib/nameservers";
import {
  type DnsRecordType,
  type ResolverCheckResult,
  normalizeAnswerValue
} from "@/lib/database";

type ResolveValue = string[];

const QUERY_TIMEOUT_MS = 6500;

function normalizeDomain(domain: string): string {
  return domain.trim().replace(/\.$/, "").toLowerCase();
}

async function resolveByType(
  resolver: Resolver,
  domain: string,
  recordType: DnsRecordType
): Promise<ResolveValue> {
  switch (recordType) {
    case "A": {
      const entries = await resolver.resolve4(domain);
      return entries;
    }
    case "AAAA": {
      const entries = await resolver.resolve6(domain);
      return entries;
    }
    case "CNAME": {
      const entries = await resolver.resolveCname(domain);
      return entries;
    }
    case "MX": {
      const entries = await resolver.resolveMx(domain);
      return entries.map((entry) => `${entry.priority} ${entry.exchange}`);
    }
    case "TXT": {
      const entries = await resolver.resolveTxt(domain);
      return entries.map((parts) => parts.join(""));
    }
    case "NS": {
      const entries = await resolver.resolveNs(domain);
      return entries;
    }
    default:
      return [];
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function querySingleResolver(input: {
  resolver: GlobalResolver;
  domain: string;
  recordType: DnsRecordType;
  expectedValue: string;
}): Promise<ResolverCheckResult> {
  const checkedAt = new Date().toISOString();
  const started = performance.now();

  const resolver = new Resolver();
  resolver.setServers([input.resolver.ip]);

  try {
    const values = await withTimeout(
      resolveByType(resolver, normalizeDomain(input.domain), input.recordType),
      QUERY_TIMEOUT_MS
    );

    const normalizedValues = values.map((value) => normalizeAnswerValue(value, input.recordType));
    const normalizedExpected = normalizeAnswerValue(input.expectedValue, input.recordType);
    const matched = normalizedValues.includes(normalizedExpected);

    return {
      resolverId: input.resolver.id,
      provider: input.resolver.provider,
      label: input.resolver.label,
      ip: input.resolver.ip,
      city: input.resolver.city,
      country: input.resolver.country,
      region: input.resolver.region,
      lat: input.resolver.lat,
      lng: input.resolver.lng,
      checkedAt,
      values,
      matched,
      durationMs: Math.round(performance.now() - started)
    };
  } catch (error) {
    return {
      resolverId: input.resolver.id,
      provider: input.resolver.provider,
      label: input.resolver.label,
      ip: input.resolver.ip,
      city: input.resolver.city,
      country: input.resolver.country,
      region: input.resolver.region,
      lat: input.resolver.lat,
      lng: input.resolver.lng,
      checkedAt,
      values: [],
      matched: false,
      error: error instanceof Error ? error.message : "Unknown DNS resolver error",
      durationMs: Math.round(performance.now() - started)
    };
  }
}

async function runInBatches<T, R>(
  items: T[],
  batchSize: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    const batchResults = await Promise.all(batch.map((item) => worker(item)));
    results.push(...batchResults);
  }

  return results;
}

export async function queryGlobalResolvers(input: {
  domain: string;
  recordType: DnsRecordType;
  expectedValue: string;
}): Promise<ResolverCheckResult[]> {
  const domain = normalizeDomain(input.domain);

  const results = await runInBatches(GLOBAL_RESOLVERS, 8, (resolver) =>
    querySingleResolver({
      resolver,
      domain,
      recordType: input.recordType,
      expectedValue: input.expectedValue
    })
  );

  return results;
}

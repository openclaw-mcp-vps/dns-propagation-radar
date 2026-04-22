import { NextResponse } from "next/server";
import { z } from "zod";
import { countMatches, ensureExpectedValue } from "@/lib/database";
import { queryGlobalResolvers } from "@/lib/dns-resolver";

export const runtime = "nodejs";

const payloadSchema = z.object({
  domain: z
    .string()
    .trim()
    .min(1)
    .refine((value) => /^[a-zA-Z0-9.-]+$/.test(value), "Invalid domain format"),
  recordType: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS"]),
  expectedValue: z.string().trim().min(1)
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request payload",
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const expectedValue = ensureExpectedValue(parsed.data.expectedValue, parsed.data.recordType);

  const resolverResults = await queryGlobalResolvers({
    domain: parsed.data.domain,
    recordType: parsed.data.recordType,
    expectedValue
  });

  const summary = countMatches(resolverResults);

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    domain: parsed.data.domain,
    recordType: parsed.data.recordType,
    expectedValue,
    summary: {
      ...summary,
      totalResolvers: resolverResults.length
    },
    resolverResults
  });
}

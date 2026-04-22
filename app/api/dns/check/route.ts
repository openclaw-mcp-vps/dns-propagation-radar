import { NextResponse } from "next/server";
import { z } from "zod";
import { runDnsCheck } from "@/lib/dns-query";
import { SUPPORTED_RECORD_TYPES } from "@/lib/dns-resolvers";

export const runtime = "nodejs";

const schema = z.object({
  domain: z.string().min(3),
  recordType: z.enum(SUPPORTED_RECORD_TYPES),
  expectedValue: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const result = await runDnsCheck(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "DNS check failed" },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createCheckSession,
  ensureDnsScheduler,
  isValidRecordType,
  runCheckOnce
} from "@/lib/dns-poller";
import { getCheck, listChecks, upsertCheck } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createSchema = z.object({
  domain: z.string().min(3).max(255),
  recordType: z.string(),
  expectedValue: z.string().min(1).max(512)
});

export async function GET(request: Request) {
  ensureDnsScheduler();

  const { searchParams } = new URL(request.url);
  const checkId = searchParams.get("id");

  if (checkId) {
    const check = await getCheck(checkId);
    if (!check) return NextResponse.json({ error: "Check not found" }, { status: 404 });
    return NextResponse.json({ check });
  }

  const checks = await listChecks(15);
  return NextResponse.json({ checks });
}

export async function POST(request: Request) {
  ensureDnsScheduler();

  const body = await request.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const recordType = parsed.data.recordType.toUpperCase();
  if (!isValidRecordType(recordType)) {
    return NextResponse.json({ error: "Unsupported record type" }, { status: 400 });
  }

  const session = createCheckSession({
    domain: parsed.data.domain.toLowerCase().trim(),
    recordType,
    expectedValue: parsed.data.expectedValue.trim()
  });

  await upsertCheck(session);
  runCheckOnce(session.id).catch(() => {
    // Keep API fast and return session immediately.
  });

  const wsPort = process.env.WS_PORT ?? "3010";

  return NextResponse.json({
    check: session,
    websocketHint: wsPort
  });
}

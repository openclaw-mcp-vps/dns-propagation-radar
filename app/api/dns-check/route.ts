import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  getMonitorSnapshot,
  isSupportedRecordType,
  isValidDomain,
  normalizeDomainInput,
  startMonitor
} from "@/lib/dns-poller";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ensurePaidAccess() {
  const cookieStore = await cookies();
  return cookieStore.get("dpr_access")?.value === "paid";
}

export async function POST(request: NextRequest) {
  if (!(await ensurePaidAccess())) {
    return NextResponse.json({ error: "Paid access required." }, { status: 402 });
  }

  let body: {
    domain?: string;
    recordType?: string;
    targetValue?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const domain = normalizeDomainInput(body.domain ?? "");
  const recordType = (body.recordType ?? "A").toUpperCase();

  if (!isValidDomain(domain)) {
    return NextResponse.json(
      { error: "Enter a valid domain, for example: example.com" },
      { status: 400 }
    );
  }

  if (!isSupportedRecordType(recordType)) {
    return NextResponse.json(
      { error: "Unsupported record type. Use A, AAAA, CNAME, TXT, MX, or NS." },
      { status: 400 }
    );
  }

  const snapshot = await startMonitor({
    domain,
    recordType,
    targetValue: body.targetValue ?? null
  });

  return NextResponse.json({
    monitorId: snapshot.id,
    snapshot
  });
}

export async function GET(request: NextRequest) {
  if (!(await ensurePaidAccess())) {
    return NextResponse.json({ error: "Paid access required." }, { status: 402 });
  }

  const monitorId = request.nextUrl.searchParams.get("monitorId");

  if (!monitorId) {
    return NextResponse.json({ error: "monitorId is required" }, { status: 400 });
  }

  const snapshot = await getMonitorSnapshot(monitorId);

  if (!snapshot) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  return NextResponse.json({ snapshot });
}

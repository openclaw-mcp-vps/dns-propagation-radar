import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, verifyAccessCookie } from "@/lib/auth";
import { getPurchaseRecord } from "@/lib/database";
import { getMonitorState } from "@/lib/monitoring";

export const runtime = "nodejs";

export async function GET(
  _: Request,
  context: {
    params: Promise<{ monitorId: string }>;
  }
) {
  const cookieStore = await cookies();
  const access = verifyAccessCookie(cookieStore.get(ACCESS_COOKIE_NAME)?.value);
  if (!access?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const purchase = await getPurchaseRecord(access.email);
  if (!purchase || purchase.status !== "active") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { monitorId } = await context.params;
  const monitor = await getMonitorState(monitorId);
  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  if (monitor.ownerEmail !== access.email) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  return NextResponse.json({ monitor });
}

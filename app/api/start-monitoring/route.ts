import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { ACCESS_COOKIE_NAME, verifyAccessCookie } from "@/lib/auth";
import { createMonitorJob, ensureExpectedValue, getPurchaseRecord } from "@/lib/database";
import { startMonitorLoop } from "@/lib/monitoring";

export const runtime = "nodejs";

const requestSchema = z.object({
  domain: z
    .string()
    .trim()
    .min(1)
    .refine((value) => /^[a-zA-Z0-9.-]+$/.test(value), "Invalid domain format"),
  recordType: z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS"]),
  expectedValue: z.string().trim().min(1),
  alertThreshold: z.number().min(50).max(100).optional(),
  notificationEmail: z.string().email().optional().or(z.literal("")),
  discordWebhookUrl: z.string().url().optional().or(z.literal(""))
});

async function hasActivePaidAccess() {
  const cookieStore = await cookies();
  const payload = verifyAccessCookie(cookieStore.get(ACCESS_COOKIE_NAME)?.value);

  if (!payload?.email) {
    return null;
  }

  const purchase = await getPurchaseRecord(payload.email);
  if (!purchase || purchase.status !== "active") {
    return null;
  }

  return payload.email;
}

export async function POST(request: Request) {
  const accessEmail = await hasActivePaidAccess();
  if (!accessEmail) {
    return NextResponse.json(
      {
        error: "Paid access required. Complete checkout and unlock with your purchase email."
      },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

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

  const monitor = await createMonitorJob({
    ownerEmail: accessEmail,
    domain: parsed.data.domain,
    recordType: parsed.data.recordType,
    expectedValue,
    alertThreshold: parsed.data.alertThreshold ?? 95,
    notification: {
      email:
        typeof parsed.data.notificationEmail === "string" && parsed.data.notificationEmail.length > 0
          ? parsed.data.notificationEmail
          : accessEmail,
      discordWebhookUrl:
        typeof parsed.data.discordWebhookUrl === "string" && parsed.data.discordWebhookUrl.length > 0
          ? parsed.data.discordWebhookUrl
          : undefined
    }
  });

  startMonitorLoop(monitor.id);

  return NextResponse.json({
    monitor,
    sseUrl: `/api/sse?monitorId=${monitor.id}`,
    nextPollInSeconds: 60
  });
}

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createMonitorSubscription } from "@/lib/dns-poller";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();

  if (cookieStore.get("dpr_access")?.value !== "paid") {
    return NextResponse.json(
      { error: "A paid session cookie is required before creating alerts." },
      { status: 402 }
    );
  }

  let body: {
    monitorId?: string;
    email?: string;
    discordWebhookUrl?: string;
    thresholdPercent?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const monitorId = body.monitorId?.trim();
  const email = body.email?.trim();
  const discordWebhookUrl = body.discordWebhookUrl?.trim();
  const threshold = Number(body.thresholdPercent ?? 95);

  if (!monitorId) {
    return NextResponse.json({ error: "monitorId is required" }, { status: 400 });
  }

  if (!email && !discordWebhookUrl) {
    return NextResponse.json(
      { error: "Add at least one notification channel (email or Discord webhook)." },
      { status: 400 }
    );
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (discordWebhookUrl && !isValidWebhookUrl(discordWebhookUrl)) {
    return NextResponse.json(
      { error: "Discord webhook URL must be a valid https URL." },
      { status: 400 }
    );
  }

  if (Number.isNaN(threshold) || threshold < 50 || threshold > 100) {
    return NextResponse.json(
      { error: "Threshold must be between 50 and 100." },
      { status: 400 }
    );
  }

  const subscription = await createMonitorSubscription({
    monitorId,
    email,
    discordWebhookUrl,
    thresholdPercent: threshold
  });

  return NextResponse.json({
    success: true,
    subscription
  });
}

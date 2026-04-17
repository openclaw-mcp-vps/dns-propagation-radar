import { NextResponse } from "next/server";
import { z } from "zod";
import { saveNotificationSettings } from "@/lib/storage";

export const runtime = "nodejs";

const notificationSchema = z.object({
  checkId: z.string().uuid(),
  thresholdPercent: z.number().min(1).max(100).default(95),
  email: z.string().email().optional(),
  discordWebhookUrl: z.string().url().optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = notificationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!parsed.data.email && !parsed.data.discordWebhookUrl) {
    return NextResponse.json({ error: "Provide at least one notification channel" }, { status: 400 });
  }

  const updated = await saveNotificationSettings(parsed.data.checkId, {
    thresholdPercent: parsed.data.thresholdPercent,
    email: parsed.data.email,
    discordWebhookUrl: parsed.data.discordWebhookUrl
  });

  if (!updated) {
    return NextResponse.json({ error: "Check not found" }, { status: 404 });
  }

  return NextResponse.json({ check: updated });
}

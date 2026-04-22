import { NextResponse } from "next/server";
import { z } from "zod";
import { getMonitorById } from "@/lib/database";
import { sendNotification, sendThresholdNotification } from "@/lib/notifications";

export const runtime = "nodejs";

const schema = z
  .object({
    monitorId: z.string().uuid().optional(),
    title: z.string().min(3).optional(),
    message: z.string().min(3).optional(),
    email: z.string().email().optional(),
    discordWebhook: z.string().url().optional()
  })
  .refine((value) => value.monitorId || (value.title && value.message), {
    message: "Provide monitorId or title/message"
  });

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());

    if (payload.monitorId) {
      const monitor = await getMonitorById(payload.monitorId);
      if (!monitor) {
        return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
      }

      await sendThresholdNotification({
        ...monitor,
        notification: {
          email: payload.email || monitor.notification.email,
          discordWebhook: payload.discordWebhook || monitor.notification.discordWebhook
        }
      });

      return NextResponse.json({ ok: true });
    }

    const outcomes = await sendNotification({
      title: payload.title || "DNS Propagation Alert",
      message: payload.message || "Propagation threshold reached.",
      email: payload.email,
      discordWebhook: payload.discordWebhook
    });

    return NextResponse.json({ ok: true, outcomes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Notification failed" },
      { status: 400 }
    );
  }
}

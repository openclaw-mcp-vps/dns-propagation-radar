import { NextResponse } from "next/server";
import { z } from "zod";
import { SUPPORTED_RECORD_TYPES } from "@/lib/dns-resolvers";
import {
  createMonitor,
  parseMonitorNotification,
  runSingleMonitorCheck,
  startMonitorScheduler
} from "@/lib/dns-query";
import { getWebsocketUrl, ensureWebsocketServer } from "@/lib/websocket";
import { listMonitors, updateMonitor } from "@/lib/database";

export const runtime = "nodejs";

const createSchema = z.object({
  domain: z.string().min(3),
  recordType: z.enum(SUPPORTED_RECORD_TYPES),
  expectedValue: z.string().min(1),
  thresholdPercentage: z.number().int().min(50).max(100).optional(),
  notification: z
    .object({
      email: z.string().email().optional(),
      discordWebhook: z.string().url().optional()
    })
    .optional()
});

const patchSchema = z.object({
  monitorId: z.string().uuid(),
  active: z.boolean().optional(),
  runNow: z.boolean().optional(),
  notification: z
    .object({
      email: z.string().email().optional(),
      discordWebhook: z.string().url().optional()
    })
    .optional()
});

async function bootRealtimeLayer() {
  startMonitorScheduler();
  ensureWebsocketServer();
}

export async function GET() {
  await bootRealtimeLayer();
  const monitors = await listMonitors();

  return NextResponse.json({
    monitors: monitors.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    websocketUrl: getWebsocketUrl()
  });
}

export async function POST(request: Request) {
  try {
    await bootRealtimeLayer();
    const payload = createSchema.parse(await request.json());
    const monitor = await createMonitor({
      ...payload,
      notification: parseMonitorNotification(payload.notification)
    });

    const latest = await runSingleMonitorCheck(monitor.id);
    return NextResponse.json({ monitor: latest }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create monitor" },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await bootRealtimeLayer();
    const payload = patchSchema.parse(await request.json());

    if (typeof payload.active === "boolean" || payload.notification) {
      const updated = await updateMonitor(payload.monitorId, (monitor) => ({
        ...monitor,
        active: typeof payload.active === "boolean" ? payload.active : monitor.active,
        notification: payload.notification
          ? {
              ...monitor.notification,
              ...parseMonitorNotification(payload.notification)
            }
          : monitor.notification,
        updatedAt: new Date().toISOString()
      }));

      if (!updated) {
        return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
      }

      if (payload.runNow) {
        const refreshed = await runSingleMonitorCheck(updated.id);
        return NextResponse.json({ monitor: refreshed });
      }

      return NextResponse.json({ monitor: updated });
    }

    if (payload.runNow) {
      const refreshed = await runSingleMonitorCheck(payload.monitorId);
      return NextResponse.json({ monitor: refreshed });
    }

    return NextResponse.json({ error: "No update requested" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update monitor" },
      { status: 400 }
    );
  }
}

const deleteSchema = z.object({
  monitorId: z.string().uuid()
});

export async function DELETE(request: Request) {
  try {
    const { monitorId } = deleteSchema.parse(await request.json());
    const removed = await updateMonitor(monitorId, () => null);
    if (removed === undefined) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not remove monitor" },
      { status: 400 }
    );
  }
}

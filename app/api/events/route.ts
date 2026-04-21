import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getMonitorSnapshot, subscribeToMonitorUpdates } from "@/lib/dns-poller";
import type { MonitorSnapshot } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serializeEvent(event: string, payload: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();

  if (cookieStore.get("dpr_access")?.value !== "paid") {
    return NextResponse.json({ error: "Paid access required." }, { status: 402 });
  }

  const monitorId = request.nextUrl.searchParams.get("monitorId");

  if (!monitorId) {
    return NextResponse.json({ error: "monitorId is required" }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      let heartbeat: ReturnType<typeof setInterval> | null = null;
      let unsubscribe = () => {};

      const close = () => {
        if (closed) {
          return;
        }

        closed = true;

        if (heartbeat) {
          clearInterval(heartbeat);
        }
        unsubscribe();

        try {
          controller.close();
        } catch {
          // Connection can already be closed by the client.
        }
      };

      const send = (event: string, payload: unknown) => {
        if (closed) {
          return;
        }

        controller.enqueue(encoder.encode(serializeEvent(event, payload)));
      };

      send("ready", { monitorId, connectedAt: new Date().toISOString() });

      const initialSnapshot = await getMonitorSnapshot(monitorId);

      if (initialSnapshot) {
        send("snapshot", initialSnapshot);
      }

      unsubscribe = subscribeToMonitorUpdates(monitorId, (snapshot: MonitorSnapshot) => {
        send("update", snapshot);
      });

      heartbeat = setInterval(() => {
        send("ping", { now: new Date().toISOString() });
      }, 25000);

      request.signal.addEventListener("abort", close, { once: true });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}

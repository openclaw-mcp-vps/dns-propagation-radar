import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, verifyAccessCookie } from "@/lib/auth";
import { getPurchaseRecord } from "@/lib/database";
import { getMonitorState, subscribeToMonitor } from "@/lib/monitoring";

export const runtime = "nodejs";

function eventChunk(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function getAuthorizedEmail(): Promise<string | null> {
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

export async function GET(request: Request) {
  const authorizedEmail = await getAuthorizedEmail();
  if (!authorizedEmail) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const url = new URL(request.url);
  const monitorId = url.searchParams.get("monitorId");

  if (!monitorId) {
    return NextResponse.json({ error: "monitorId is required" }, { status: 400 });
  }

  const currentMonitor = await getMonitorState(monitorId);
  if (!currentMonitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  if (currentMonitor.ownerEmail !== authorizedEmail) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(eventChunk("ready", { monitorId })));
      controller.enqueue(
        encoder.encode(
          eventChunk("snapshot", {
            monitor: currentMonitor,
            snapshot: currentMonitor.snapshots[currentMonitor.snapshots.length - 1] ?? null
          })
        )
      );

      const unsubscribe = subscribeToMonitor(monitorId, (payload) => {
        const eventName = payload.type === "error" ? "monitor-error" : payload.type;
        controller.enqueue(encoder.encode(eventChunk(eventName, payload)));
      });

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(eventChunk("ping", { ts: Date.now() })));
      }, 20_000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });
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

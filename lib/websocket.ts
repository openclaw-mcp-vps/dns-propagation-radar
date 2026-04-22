import { WebSocket, WebSocketServer } from "ws";
import { DnsMonitor, MonitorWebsocketMessage } from "@/types/dns";

type SubscriptionMap = Map<string, Set<WebSocket>>;

declare global {
  // eslint-disable-next-line no-var
  var dnsRadarWss: WebSocketServer | undefined;
  // eslint-disable-next-line no-var
  var dnsRadarSubscriptions: SubscriptionMap | undefined;
}

function safeParseMessage(raw: Buffer) {
  try {
    return JSON.parse(raw.toString("utf8")) as { type?: string; monitorId?: string };
  } catch {
    return null;
  }
}

function serialize(message: MonitorWebsocketMessage) {
  return JSON.stringify(message);
}

function getSubscriptions() {
  if (!global.dnsRadarSubscriptions) {
    global.dnsRadarSubscriptions = new Map<string, Set<WebSocket>>();
  }
  return global.dnsRadarSubscriptions;
}

function getPublicWebsocketUrl() {
  return process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:3002";
}

export function ensureWebsocketServer() {
  if (global.dnsRadarWss) {
    return global.dnsRadarWss;
  }

  const port = Number(process.env.WEBSOCKET_PORT || "3002");
  const wss = new WebSocketServer({ port });

  wss.on("connection", (socket) => {
    socket.on("message", (raw) => {
      const message = safeParseMessage(raw as Buffer);
      if (!message || message.type !== "subscribe" || !message.monitorId) {
        return;
      }

      const subscriptions = getSubscriptions();
      const existing = subscriptions.get(message.monitorId) ?? new Set<WebSocket>();
      existing.add(socket);
      subscriptions.set(message.monitorId, existing);

      socket.send(
        serialize({
          type: "subscribed",
          monitorId: message.monitorId,
          at: new Date().toISOString()
        })
      );
    });

    socket.on("close", () => {
      const subscriptions = getSubscriptions();
      for (const [monitorId, sockets] of subscriptions.entries()) {
        sockets.delete(socket);
        if (sockets.size === 0) {
          subscriptions.delete(monitorId);
        }
      }
    });
  });

  global.dnsRadarWss = wss;
  return wss;
}

export function getWebsocketUrl() {
  return getPublicWebsocketUrl();
}

function publish(monitorId: string, payload: MonitorWebsocketMessage) {
  const subscriptions = getSubscriptions();
  const sockets = subscriptions.get(monitorId);

  if (!sockets || sockets.size === 0) {
    return;
  }

  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(serialize(payload));
    }
  }
}

export function broadcastMonitorUpdate(monitor: DnsMonitor) {
  publish(monitor.id, {
    type: "monitor-update",
    monitor,
    at: new Date().toISOString()
  });
}

export function broadcastMonitorError(monitorId: string, error: string) {
  publish(monitorId, {
    type: "monitor-error",
    monitorId,
    error,
    at: new Date().toISOString()
  });
}

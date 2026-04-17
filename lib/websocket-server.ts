import { WebSocketServer, type WebSocket } from "ws";

type ClientInfo = {
  socket: WebSocket;
  checkId: string;
};

type GlobalWithWs = typeof globalThis & {
  __dnsWsServer?: WebSocketServer;
  __dnsWsClients?: Set<ClientInfo>;
};

const wsGlobal = globalThis as GlobalWithWs;

function getWsPort() {
  return Number(process.env.WS_PORT ?? 3010);
}

export function ensureWebsocketServer() {
  if (wsGlobal.__dnsWsServer) return wsGlobal.__dnsWsServer;

  wsGlobal.__dnsWsClients = new Set<ClientInfo>();
  const wss = new WebSocketServer({ port: getWsPort() });

  wss.on("connection", (socket, request) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    const checkId = url.searchParams.get("checkId") ?? "";
    const client: ClientInfo = { socket, checkId };
    wsGlobal.__dnsWsClients?.add(client);

    socket.on("close", () => {
      wsGlobal.__dnsWsClients?.delete(client);
    });
  });

  wsGlobal.__dnsWsServer = wss;
  return wss;
}

export function broadcastCheckUpdate(checkId: string, payload: unknown) {
  const clients = wsGlobal.__dnsWsClients;
  if (!clients) return;

  const message = JSON.stringify(payload);
  for (const client of clients) {
    if (client.checkId === checkId && client.socket.readyState === client.socket.OPEN) {
      client.socket.send(message);
    }
  }
}

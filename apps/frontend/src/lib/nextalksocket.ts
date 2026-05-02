import { io } from "socket.io-client";
import { DEPLOY_FALLBACK_SOCKET_BASE } from "./nextalkdeployfallbacks";

function resolveSocketUrl(): string {
  const socketEnv = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (socketEnv) return socketEnv;

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:4000";
    }
    return DEPLOY_FALLBACK_SOCKET_BASE;
  }
  return "http://localhost:4000";
}

export const socket = io(resolveSocketUrl(), {
  autoConnect: false,
  transports: ["websocket", "polling"]
});

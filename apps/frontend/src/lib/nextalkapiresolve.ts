import { DEPLOY_FALLBACK_API_BASE } from "./nextalkdeployfallbacks";

/** Assure un suffixe `/api` (erreur fréquente : URL Render sans `/api`). */
export function normalizeBackendApiUrl(raw: string | undefined): string {
  const r = String(raw ?? "").trim();
  if (!r) return DEPLOY_FALLBACK_API_BASE;
  const u = r.replace(/\/+$/, "");
  if (u.endsWith("/api")) return u;
  return `${u}/api`;
}

/**
 * Base URL pour axios côté client / SSR.
 * En prod dans le navigateur : `/api` → proxifié par Next.js (rewrites), même origine = pas de CORS.
 */
export function resolveAxiosApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:4000/api";
    }
    return "/api";
  }
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const socketEnv = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (envUrl) return normalizeBackendApiUrl(envUrl);
  if (socketEnv) return normalizeBackendApiUrl(`${socketEnv.replace(/\/+$/, "")}/api`);
  return DEPLOY_FALLBACK_API_BASE;
}

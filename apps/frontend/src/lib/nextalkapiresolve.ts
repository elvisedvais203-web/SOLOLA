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
 * Base URL pour axios.
 *
 * Navigateur (hors localhost) : toujours `/api` (same-origin). Le route handler
 * `app/api/[...path]` relaie vers le backend ; évite CORS et les erreurs si
 * `NEXT_PUBLIC_*` est mal défini au build.
 *
 * SSR / Node : URL absolue depuis les variables d’environnement.
 */
export function resolveAxiosApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const socketEnv = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();

  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "/api";
    }
    return "/api";
  }

  if (envUrl) return normalizeBackendApiUrl(envUrl);
  if (socketEnv) return normalizeBackendApiUrl(`${socketEnv.replace(/\/+$/, "")}/api`);
  return DEPLOY_FALLBACK_API_BASE;
}

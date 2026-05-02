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
 * Navigateur (prod) : si `NEXT_PUBLIC_API_URL` ou `NEXT_PUBLIC_SOCKET_URL` est défini au **build**,
 * on appelle le backend **directement** (HTTPS). C’est plus fiable que le proxy Next sur Render.
 * Sinon on utilise le proxy same-origin `/api` (rewrites).
 *
 * SSR / Node : URL absolue depuis les variables d’environnement.
 */
export function resolveAxiosApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const socketEnv = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();

  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:4000/api";
    }

    if (envUrl || socketEnv) {
      const fromEnv = envUrl || `${socketEnv!.replace(/\/+$/, "")}/api`;
      return normalizeBackendApiUrl(fromEnv);
    }

    return "/api";
  }

  if (envUrl) return normalizeBackendApiUrl(envUrl);
  if (socketEnv) return normalizeBackendApiUrl(`${socketEnv.replace(/\/+$/, "")}/api`);
  return DEPLOY_FALLBACK_API_BASE;
}

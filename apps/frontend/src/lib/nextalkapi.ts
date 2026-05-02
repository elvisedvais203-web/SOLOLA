import axios, { type AxiosResponse } from "axios";
import { DEPLOY_FALLBACK_API_BASE } from "./nextalkdeployfallbacks";
import type { AppUser } from "./nextalksession";
import { resolveAxiosApiBaseUrl } from "./nextalkapiresolve";

/** Réponses `/auth/email/*`, `/auth/firebase/verify` : tokens + utilisateur applicatif. */
export type AuthApiSessionResponse = {
  tokens: { accessToken: string; refreshToken: string };
  user: AppUser;
};

const api = axios.create({
  baseURL: resolveAxiosApiBaseUrl(),
  timeout: 20000,
  withCredentials: false
});

let refreshPromise: Promise<string> | null = null;

/** En prod navigateur : récupère l’origine backend côté serveur puis appelle l’API en direct (contourne un proxy /api défaillant). */
let clientBackendBootstrap: Promise<void> | null = null;

function isBrowserProd(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h !== "localhost" && h !== "127.0.0.1";
}

async function ensureClientDirectBackendBase(): Promise<void> {
  if (!isBrowserProd()) return;
  if (process.env.NEXT_PUBLIC_API_VIA_PROXY === "1") return;

  const base = String(api.defaults.baseURL ?? "");
  if (base.startsWith("http://") || base.startsWith("https://")) return;

  if (!clientBackendBootstrap) {
    clientBackendBootstrap = (async () => {
      try {
        const r = await fetch("/api/__nextalk/backend", { cache: "no-store" });
        if (r.ok) {
          const j = (await r.json()) as { origin?: string };
          const o = String(j.origin ?? "").trim().replace(/\/+$/, "");
          if (o.startsWith("http://") || o.startsWith("https://")) {
            api.defaults.baseURL = `${o}/api`;
            return;
          }
        }
      } catch {
        /* ignore */
      }
      /* Dernier recours : URL publique connue (évite de rester bloqué sur /api si le proxy Next échoue). */
      api.defaults.baseURL = DEPLOY_FALLBACK_API_BASE;
    })();
  }
  await clientBackendBootstrap;
}

/** À appeler tôt (ex. page /auth) pour que la base soit prête avant le premier POST. */
export async function prewarmClientApiBase(): Promise<void> {
  await ensureClientDirectBackendBase();
}

/** Force le repli Render par défaut (ex. nouvelle tentative après ERR_NETWORK). */
export function forceApiDeployFallbackBase(): void {
  if (isBrowserProd() && process.env.NEXT_PUBLIC_API_VIA_PROXY !== "1") {
    api.defaults.baseURL = DEPLOY_FALLBACK_API_BASE;
  }
}

export function isAxiosNetworkError(error: unknown): boolean {
  const e = error as { code?: string; message?: string };
  const raw = String(e?.message ?? "");
  return (
    e?.code === "ERR_NETWORK" ||
    e?.code === "ECONNABORTED" ||
    raw.toLowerCase().includes("network error") ||
    raw.toLowerCase().includes("timeout")
  );
}

/**
 * POST avec une seconde tentative : si erreur réseau alors que la base était encore /api,
 * force le repli absolu puis réessaie une fois.
 */
export async function apiPostAuthWithResilience<T extends AuthApiSessionResponse = AuthApiSessionResponse>(
  path: string,
  body: Record<string, unknown>
): Promise<AxiosResponse<T>> {
  await ensureClientDirectBackendBase();
  try {
    return await api.post<T>(path, body);
  } catch (first: unknown) {
    if (!isAxiosNetworkError(first)) throw first;
    forceApiDeployFallbackBase();
    const delay = 450;
    await new Promise((r) => setTimeout(r, delay));
    return await api.post<T>(path, body);
  }
}

api.interceptors.request.use(async (config) => {
  await ensureClientDirectBackendBase();
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (typeof window !== "undefined") {
      const status = error?.response?.status;
      const message = String(error?.response?.data?.message ?? "").toLowerCase();
      const restriction = error?.response?.data?.restriction as
        | { type?: "SUSPENDED" | "BANNED"; reason?: string; until?: string | null }
        | undefined;
      const mustLogout =
        status === 401 ||
        (status === 403 && (message.includes("banni") || message.includes("suspendu") || message.includes("session invalidee")));

      // One-shot refresh flow (retry the original request once).
      const original = error?.config as (typeof error)["config"] & { _klRetried?: boolean };
      const canTryRefresh =
        status === 401 &&
        !original?._klRetried &&
        !String(original?.url ?? "").includes("/auth/refresh") &&
        Boolean(localStorage.getItem("refreshToken"));

      if (canTryRefresh) {
        try {
          original._klRetried = true;
          if (!refreshPromise) {
            refreshPromise = (async () => {
              const refreshToken = localStorage.getItem("refreshToken");
              const resp = await api.post("/auth/refresh", { refreshToken });
              const accessToken = resp.data?.tokens?.accessToken as string | undefined;
              const nextRefresh = resp.data?.tokens?.refreshToken as string | undefined;
              const user = resp.data?.user;
              if (!accessToken || !nextRefresh || !user) {
                throw new Error("Refresh invalide");
              }
              localStorage.setItem("accessToken", accessToken);
              localStorage.setItem("refreshToken", nextRefresh);
              localStorage.setItem("currentUser", JSON.stringify(user));
              return accessToken;
            })().finally(() => {
              refreshPromise = null;
            });
          }

          const newAccess = await refreshPromise;
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api.request(original);
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("currentUser");
          window.location.href = "/auth";
          return Promise.reject(error);
        }
      }

      if (mustLogout) {
        if (status === 403) {
          sessionStorage.setItem(
            "kl_account_restriction",
            JSON.stringify({
              type: restriction?.type ?? (message.includes("banni") ? "BANNED" : "SUSPENDED"),
              reason: restriction?.reason ?? error?.response?.data?.message ?? "Compte restreint",
              until: restriction?.until ?? null,
              ts: new Date().toISOString()
            })
          );
        }
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("currentUser");

        if (status === 403 && !window.location.pathname.startsWith("/account-restricted")) {
          window.location.href = "/account-restricted";
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

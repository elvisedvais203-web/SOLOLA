import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { DEPLOY_FALLBACK_API_BASE } from "./nextalkdeployfallbacks";
import type { AppUser } from "./nextalksession";
import { normalizeBackendApiUrl, resolveAxiosApiBaseUrl } from "./nextalkapiresolve";

/** Réponses `/auth/firebase/verify` (et `/auth/refresh`) : tokens + utilisateur applicatif. */
export type AuthApiSessionResponse = {
  tokens: { accessToken: string; refreshToken: string };
  user: AppUser;
};

const DEFAULT_AXIOS_TIMEOUT_MS = 55000;

const api = axios.create({
  baseURL: resolveAxiosApiBaseUrl(),
  timeout: DEFAULT_AXIOS_TIMEOUT_MS,
  withCredentials: false
});

let refreshPromise: Promise<string> | null = null;
let clientBackendBootstrap: Promise<void> | null = null;

function isBrowserProd(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h !== "localhost" && h !== "127.0.0.1";
}

function useBrowserDirectApi(): boolean {
  return process.env.NEXT_PUBLIC_API_DIRECT === "1";
}

function pushUniqueApiBase(list: string[], raw: string | undefined): void {
  if (!raw?.trim()) return;
  const u = normalizeBackendApiUrl(raw.trim());
  if (!list.includes(u)) list.push(u);
}

export async function getOrderedApiBases(): Promise<string[]> {
  const bases: string[] = [];

  if (typeof window !== "undefined" && isBrowserProd() && useBrowserDirectApi()) {
    try {
      const r = await fetch("/api/__nextalk/backend", { cache: "no-store" });
      if (r.ok) {
        const j = (await r.json()) as { origin?: string };
        const o = String(j.origin ?? "").trim().replace(/\/+$/, "");
        if (o.startsWith("http://") || o.startsWith("https://")) {
          pushUniqueApiBase(bases, `${o}/api`);
        }
      }
    } catch {
      /* ignore */
    }
  }

  pushUniqueApiBase(bases, process.env.NEXT_PUBLIC_API_URL);
  const sock = process.env.NEXT_PUBLIC_SOCKET_URL?.trim();
  if (sock) {
    pushUniqueApiBase(bases, `${sock.replace(/\/+$/, "")}/api`);
  }
  pushUniqueApiBase(bases, DEPLOY_FALLBACK_API_BASE);

  if (!bases.length) {
    pushUniqueApiBase(bases, DEPLOY_FALLBACK_API_BASE);
  }
  return bases;
}

async function ensureClientDirectBackendBase(): Promise<void> {
  if (!isBrowserProd()) return;
  if (!useBrowserDirectApi()) return;

  const base = String(api.defaults.baseURL ?? "");
  if (base.startsWith("http://") || base.startsWith("https://")) return;

  if (!clientBackendBootstrap) {
    clientBackendBootstrap = (async () => {
      const bases = await getOrderedApiBases();
      api.defaults.baseURL = bases[0] ?? DEPLOY_FALLBACK_API_BASE;
    })();
  }
  await clientBackendBootstrap;
}

export async function prewarmClientApiBase(): Promise<void> {
  await ensureClientDirectBackendBase();
}

export function forceApiDeployFallbackBase(): void {
  if (isBrowserProd() && useBrowserDirectApi()) {
    api.defaults.baseURL = DEPLOY_FALLBACK_API_BASE;
  }
}

export function isAxiosNetworkError(error: unknown): boolean {
  const e = error as { code?: string; message?: string; response?: unknown };
  if (e?.response != null) return false;
  const raw = String(e?.message ?? "");
  return (
    e?.code === "ERR_NETWORK" ||
    e?.code === "ECONNABORTED" ||
    e?.code === "ENOTFOUND" ||
    e?.code === "ECONNRESET" ||
    raw.toLowerCase().includes("network error") ||
    raw.toLowerCase().includes("timeout")
  );
}

function isTransientServerError(error: unknown): boolean {
  const s = (error as { response?: { status?: number } })?.response?.status;
  return s === 502 || s === 503 || s === 504 || s === 408;
}

function isRetriableApiFailure(error: unknown): boolean {
  return isAxiosNetworkError(error) || isTransientServerError(error);
}

export async function apiPostAuthWithResilience<T extends AuthApiSessionResponse = AuthApiSessionResponse>(
  path: string,
  body: Record<string, unknown>
): Promise<AxiosResponse<T>> {
  await ensureClientDirectBackendBase();
  return api.post<T>(path, body, { timeout: DEFAULT_AXIOS_TIMEOUT_MS });
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
    const cfg = error?.config as (InternalAxiosRequestConfig & { _klBaseAttempt?: number }) | undefined;
    if (typeof window !== "undefined" && cfg && isBrowserProd() && useBrowserDirectApi()) {
      const attempt = cfg._klBaseAttempt ?? 0;
      if (isRetriableApiFailure(error)) {
        const bases = await getOrderedApiBases();
        if (attempt + 1 < bases.length) {
          cfg._klBaseAttempt = attempt + 1;
          cfg.baseURL = bases[attempt + 1];
          await new Promise((r) => setTimeout(r, 400 + attempt * 250));
          return api.request(cfg);
        }
      }
    }

    if (typeof window !== "undefined") {
      const status = error?.response?.status;
      const message = String(error?.response?.data?.message ?? "").toLowerCase();
      const restriction = error?.response?.data?.restriction as
        | { type?: "SUSPENDED" | "BANNED"; reason?: string; until?: string | null }
        | undefined;
      const mustLogout =
        status === 401 ||
        (status === 403 && (message.includes("banni") || message.includes("suspendu") || message.includes("session invalidee")));

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

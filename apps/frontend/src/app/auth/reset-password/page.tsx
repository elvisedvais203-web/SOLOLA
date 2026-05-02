"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api from "../../../lib/nextalkapi";
import { storeSession } from "../../../lib/nextalksession";
import { SololaThemedLogo } from "../../../components/sololathemedlogo";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"error" | "success">("success");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(tokenFromUrl);
  }, [tokenFromUrl]);

  useEffect(() => {
    const root = document.documentElement;
    const prevTheme = root.getAttribute("data-theme");
    root.setAttribute("data-theme", "light");
    return () => {
      if (prevTheme == null) root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", prevTheme);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    const t = token.trim();
    if (!t) {
      setStatus("Lien invalide ou token manquant. Redemande une réinitialisation depuis la page « Mot de passe oublié ».");
      setStatusType("error");
      return;
    }
    if (password.length < 8) {
      setStatus("Mot de passe trop court (minimum 8 caractères).");
      setStatusType("error");
      return;
    }
    if (password !== confirm) {
      setStatus("Les mots de passe ne correspondent pas.");
      setStatusType("error");
      return;
    }
    setLoading(true);
    try {
      const resp = await api.post("/auth/password/reset", {
        token: t,
        newPassword: password
      });
      storeSession({
        accessToken: resp.data.tokens.accessToken,
        refreshToken: resp.data.tokens.refreshToken,
        user: resp.data.user
      });
      setStatus("Mot de passe mis à jour. Redirection…");
      setStatusType("success");
      setTimeout(() => router.replace("/dashboard"), 600);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setStatus(e?.response?.data?.message ?? e?.message ?? "Token invalide ou expiré.");
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[100svh] max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <Link href="/auth" className="mx-auto inline-flex flex-col items-center gap-2">
          <SololaThemedLogo width={56} height={56} className="rounded-2xl" priority sizes="56px" />
          <span className="font-heading text-xl font-bold text-white">Solola</span>
        </Link>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
        <h1 className="text-lg font-semibold text-[#10172b]">Nouveau mot de passe</h1>
        <p className="mt-1 text-xs text-slate-600">Choisis un mot de passe sécurisé (8 caractères minimum).</p>

        <form onSubmit={(ev) => void submit(ev)} className="mt-5 space-y-3">
          {!tokenFromUrl ? (
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#10172b] placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[rgba(76,111,255,0.25)]"
              placeholder="Coller le token reçu par e-mail"
              disabled={loading}
              autoComplete="off"
            />
          ) : null}
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#10172b] placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[rgba(76,111,255,0.25)]"
            placeholder="Nouveau mot de passe"
            disabled={loading}
          />
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#10172b] placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[rgba(76,111,255,0.25)]"
            placeholder="Confirmer le mot de passe"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !password || !confirm || (!tokenFromUrl && !token.trim())}
            className="w-full rounded-xl bg-[#4c6fff] py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(76,111,255,0.25)] transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Enregistrement…" : "Enregistrer et se connecter"}
          </button>
        </form>

        {status ? (
          <div
            className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
              statusType === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {status}
          </div>
        ) : null}

        <p className="mt-5 text-center text-xs text-slate-600">
          <Link href="/auth/forgot-password" className="font-semibold text-[#4c6fff] underline underline-offset-2">
            Redemander un lien
          </Link>
          {" · "}
          <Link href="/auth" className="text-slate-500 underline underline-offset-2">
            Connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

function ResetFallback() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-md items-center justify-center px-4">
      <p className="text-sm text-slate-500">Chargement…</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

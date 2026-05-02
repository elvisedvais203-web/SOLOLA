"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../../../lib/nextalkapi";
import { SololaThemedLogo } from "../../../components/sololathemedlogo";

const FIREBASE_AUTH_ONLY =
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_ONLY === "1" ||
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_ONLY === "true";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"error" | "success">("success");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const prevTheme = root.getAttribute("data-theme");
    root.setAttribute("data-theme", "light");
    return () => {
      if (prevTheme == null) root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", prevTheme);
    };
  }, []);

  useEffect(() => {
    if (FIREBASE_AUTH_ONLY) {
      router.replace("/auth");
    }
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("Entrez une adresse e-mail valide.");
      setStatusType("error");
      return;
    }
    setLoading(true);
    try {
      const resp = await api.post("/auth/password/request-reset", { email: trimmed });
      const token = resp.data?.token as string | undefined;
      const devHint =
        token && process.env.NODE_ENV !== "production"
          ? ` En développement, ouvre ce lien pour définir un nouveau mot de passe : ${typeof window !== "undefined" ? window.location.origin : ""}/auth/reset-password?token=${encodeURIComponent(token)}`
          : "";
      setStatus(
        `Si un compte existe pour cette adresse, tu recevras un lien de réinitialisation (vérifie aussi les courriers indésirables).${devHint}`
      );
      setStatusType("success");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setStatus(e?.response?.data?.message ?? e?.message ?? "Impossible d’envoyer la demande pour le moment.");
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  }

  if (FIREBASE_AUTH_ONLY) {
    return (
      <div className="mx-auto flex min-h-[100svh] max-w-md flex-col justify-center px-4 py-12">
        <p className="text-center text-sm text-slate-500">Redirection vers la connexion…</p>
      </div>
    );
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
        <h1 className="text-lg font-semibold text-[#10172b]">Mot de passe oublié</h1>
        <p className="mt-1 text-xs text-slate-600">
          Indique l’e-mail de ton compte. Tu recevras un lien pour choisir un nouveau mot de passe.
        </p>

        <form onSubmit={(ev) => void submit(ev)} className="mt-5 space-y-3">
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#10172b] placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[rgba(76,111,255,0.25)]"
            placeholder="Adresse e-mail"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full rounded-xl bg-[#4c6fff] py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(76,111,255,0.25)] transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Envoi…" : "Envoyer le lien"}
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
          <Link href="/auth" className="font-semibold text-[#4c6fff] underline underline-offset-2">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

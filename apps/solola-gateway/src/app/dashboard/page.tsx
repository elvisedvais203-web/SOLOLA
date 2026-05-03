"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AnimatedBackground } from "@/components/gateway/AnimatedBackground";

const AUTH_KEY = "solola-gateway-auth";
const EMAIL_KEY = "solola-gateway-email";

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(AUTH_KEY) !== "1") {
        router.replace("/");
        return;
      }
      setEmail(sessionStorage.getItem(EMAIL_KEY));
    } catch {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router]);

  function logout() {
    try {
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(EMAIL_KEY);
    } catch {
      /* ignore */
    }
    router.replace("/");
  }

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0D0D0D] text-white/60">
        Chargement…
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden text-white">
      <AnimatedBackground />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/55 via-black/65 to-black/80" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-3xl flex-col px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/40">
              Solola
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Tableau de bord
            </h1>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/85 backdrop-blur-md transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6C5CE7]"
          >
            Déconnexion
          </button>
        </header>

        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="rounded-3xl border border-white/[0.09] bg-[var(--glass)] p-8 shadow-[0_0_80px_rgba(108,92,231,0.12)] backdrop-blur-2xl sm:p-10"
        >
          <p className="text-sm font-medium text-[#00D1FF]/95">Bienvenue 👋</p>
          <p className="mt-3 text-lg text-white/90">
            Tu es connecté
            {email ? (
              <>
                {" "}
                en tant que{" "}
                <span className="font-medium text-white">{email}</span>
              </>
            ) : null}
            .
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/48">
            C’est une démo front : la vraie auth arrivera avec ton API NestJS.
            En attendant, tu peux revenir à la gateway ou te déconnecter.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex rounded-xl bg-gradient-to-r from-[#2563eb] via-[#6C5CE7] to-[#a855f7] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_28px_rgba(108,92,231,0.35)]"
            >
              Retour à l’accueil
            </Link>
          </div>
        </motion.main>
      </div>
    </div>
  );
}

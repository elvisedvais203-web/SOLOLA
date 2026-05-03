"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Ancien retour OAuth par paramètres d’URL — désactivé ; seule la connexion Firebase sur /auth est supportée. */
export default function SocialSuccessRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth");
  }, [router]);

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-[#0D0D0D] px-4">
      <p className="text-sm text-slate-400">Redirection vers la connexion Firebase…</p>
    </div>
  );
}

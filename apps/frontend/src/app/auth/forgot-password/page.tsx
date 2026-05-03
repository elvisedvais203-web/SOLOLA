"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** L’auth applicative par e-mail est désactivée ; seule Firebase est proposée sur /auth. */
export default function ForgotPasswordPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/auth");
  }, [router]);

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-[#0D0D0D] px-4">
      <p className="text-sm text-slate-400">Redirection vers la connexion…</p>
    </div>
  );
}

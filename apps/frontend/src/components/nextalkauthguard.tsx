"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isLoggedIn } from "../lib/nextalksession";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
      return;
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
        <p className="text-sm">
          {!isLoggedIn()
            ? "Redirection vers la connexion…"
            : "Chargement de ton espace…"}
        </p>
        <p className="max-w-sm text-xs text-slate-500">
          Si tu restes bloqué après t’être connecté avec Google ou un SMS, l’API Solola n’a peut‑être pas
          enregistré la session : reviens sur la page de connexion, le système réessaiera automatiquement.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

import { Suspense } from "react";
import AuthClientSimple from "./nextalkauthclientsimple";

export const dynamic = "force-dynamic";

function AuthFallback() {
  return (
    <div className="mx-auto flex min-h-[100svh] max-w-6xl items-center justify-center px-4">
      <p className="text-sm text-slate-500">Chargement de la connexion…</p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <AuthClientSimple />
    </Suspense>
  );
}

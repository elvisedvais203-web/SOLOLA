import { Suspense } from "react";
import { MainPage } from "../../components/solola/MainPage";

function AuthFallback() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-[#0D0D0D] px-4">
      <p className="text-sm text-slate-400">Chargement de Solola Gateway…</p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <MainPage />
    </Suspense>
  );
}

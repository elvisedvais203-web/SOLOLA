"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";

function ResetRedirect() {
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

function ResetFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <p className="text-sm text-slate-500">Chargement…</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetFallback />}>
      <ResetRedirect />
    </Suspense>
  );
}

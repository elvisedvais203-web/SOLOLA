"use client";

import dynamic from "next/dynamic";
import { AuthGuard } from "../../components/nextalkauthguard";

const NextalkChat = dynamic(
  () => import("../../components/nextalkchat").then((module) => module.NextalkChat),
  { ssr: false, loading: () => <p className="p-4 text-sm text-slate-400">Chargement des messages...</p> }
);

export default function MessagesPage() {
  return (
    <AuthGuard>
      <div className="min-h-[calc(100dvh-8rem)]">
        <NextalkChat />
      </div>
    </AuthGuard>
  );
}

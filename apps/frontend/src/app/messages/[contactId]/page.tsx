"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { AuthGuard } from "../../../components/nextalkauthguard";

const NextalkChat = dynamic(
  () => import("../../../components/nextalkchat").then((module) => module.NextalkChat),
  { ssr: false, loading: () => <p className="p-4 text-sm text-slate-400">Chargement de la conversation...</p> }
);

export default function ConversationPage() {
  const { contactId } = useParams<{ contactId: string }>();

  return (
    <AuthGuard>
      <div className="min-h-[calc(100dvh-8rem)]">
        <NextalkChat contactId={contactId} />
      </div>
    </AuthGuard>
  );
}

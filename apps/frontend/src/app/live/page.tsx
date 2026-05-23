"use client";

import Link from "next/link";
import { AuthGuard } from "../../components/nextalkauthguard";
import { SectionHeader } from "../../components/nextalksectionheader";
import { useSololaPlan } from "../../hooks/useSololaPlan";

export default function LivePage() {
  const { can } = useSololaPlan();

  return (
    <AuthGuard>
      <section className="mx-auto max-w-3xl pb-12">
        <SectionHeader title="Live" accent="violet" />
        <div className="glass rounded-3xl p-6 text-center">
          {can("live") ? (
            <>
              <p className="text-sm text-slate-300">
                Le module live streaming est active pour ton plan. La diffusion RTMP/WebRTC sera branchee dans la prochaine iteration.
              </p>
              <button type="button" className="btn-neon mt-4 rounded-xl px-4 py-2 text-sm" disabled>
                Demarrer un live (bientot)
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-300">
                Le live streaming est reserve au plan Pro.
              </p>
              <Link href="/settings/plan" className="btn-neon mt-4 inline-flex rounded-xl px-4 py-2 text-sm">
                Voir les plans
              </Link>
            </>
          )}
        </div>
      </section>
    </AuthGuard>
  );
}

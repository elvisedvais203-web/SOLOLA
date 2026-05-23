"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthGuard } from "../../../components/nextalkauthguard";
import { useSololaPlan } from "../../../hooks/useSololaPlan";
import {
  PLAN_PRIVILEGES,
  SOLOLA_PLANS,
  type SololaPlanId
} from "../../../lib/sololaplan";

export default function SettingsPlanPage() {
  const router = useRouter();
  const { plan, setPlan } = useSololaPlan();

  const choosePlan = (id: SololaPlanId) => {
    setPlan(id);
    if (id === "PRO") {
      router.push("/premium");
    }
  };

  return (
    <AuthGuard>
      <section className="mx-auto max-w-5xl pb-10">
        <div className="mb-4">
          <h1 className="font-heading text-3xl font-bold text-white">Abonnement Solola</h1>
          <p className="mt-1 text-sm text-slate-400">
            Plans Free, Standard et Pro — privileges style Telegram avec fonctionnalites Instagram.
          </p>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {SOLOLA_PLANS.map((item) => {
            const active = plan === item.id;
            return (
              <article
                key={item.id}
                className={`glass rounded-3xl border p-5 ${active ? "border-neoblue shadow-[0_0_24px_rgba(50,184,255,0.25)]" : "border-white/10"}`}
              >
                <p className={`inline-block rounded-full bg-gradient-to-r ${item.accent} px-3 py-1 text-xs font-semibold text-white`}>
                  {item.title}
                </p>
                <p className="mt-3 text-2xl font-bold text-white">{item.price}</p>
                <p className="mt-1 text-sm text-slate-400">{item.subtitle}</p>
                <button
                  type="button"
                  onClick={() => choosePlan(item.id)}
                  className={`mt-4 w-full rounded-2xl py-2.5 text-sm font-semibold ${active ? "btn-outline-neon" : "btn-neon"}`}
                >
                  {active ? "Plan actif" : "Choisir"}
                </button>
              </article>
            );
          })}
        </div>

        <div className="glass overflow-hidden rounded-3xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Fonctionnalite</th>
                  <th className="px-4 py-3">Free</th>
                  <th className="px-4 py-3">Standard</th>
                  <th className="px-4 py-3">Pro</th>
                </tr>
              </thead>
              <tbody>
                {PLAN_PRIVILEGES.map((row) => (
                  <tr key={row.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-slate-200">{row.label}</td>
                    <td className="px-4 py-3">{row.free ? "✅" : "—"}</td>
                    <td className="px-4 py-3">{row.standard ? "✅" : "—"}</td>
                    <td className="px-4 py-3">{row.pro ? "✅" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/settings" className="btn-outline-neon rounded-2xl px-4 py-2 text-sm">
            Retour parametres
          </Link>
          <Link href="/premium" className="btn-neon rounded-2xl px-4 py-2 text-sm">
            Payer avec Mobile Money
          </Link>
        </div>
      </section>
    </AuthGuard>
  );
}

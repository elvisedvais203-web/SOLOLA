"use client";

import Link from "next/link";
import { useSololaPlan } from "../hooks/useSololaPlan";
import { SOLOLA_PLANS } from "../lib/sololaplan";

export function SololaPlanBadge() {
  const { plan } = useSololaPlan();
  const meta = SOLOLA_PLANS.find((p) => p.id === plan) ?? SOLOLA_PLANS[0];

  return (
    <Link
      href="/settings/plan"
      className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${meta.accent} px-3 py-1 text-xs font-semibold text-white`}
    >
      Plan {meta.title}
      <span aria-hidden>›</span>
    </Link>
  );
}

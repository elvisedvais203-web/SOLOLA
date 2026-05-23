"use client";

import { useEffect, useState } from "react";
import { getStoredUser } from "../lib/nextalksession";
import {
  hasPrivilege,
  resolvePlanFromUser,
  type SololaPlanId
} from "../lib/sololaplan";

const PLAN_STORAGE_KEY = "solola_selected_plan";

export function getStoredPlanId(): SololaPlanId | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PLAN_STORAGE_KEY);
  if (raw === "FREE" || raw === "STANDARD" || raw === "PRO") return raw;
  return null;
}

export function storePlanId(plan: SololaPlanId) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PLAN_STORAGE_KEY, plan);
  window.dispatchEvent(new CustomEvent("solola:plan:updated", { detail: plan }));
}

export function useSololaPlan() {
  const [plan, setPlan] = useState<SololaPlanId>("FREE");

  useEffect(() => {
    const sync = () => {
      const user = getStoredUser();
      const stored = getStoredPlanId();
      const fromUser = resolvePlanFromUser(user?.planTier ?? null);
      setPlan(stored ?? fromUser);
    };
    sync();
    window.addEventListener("solola:plan:updated", sync);
    return () => window.removeEventListener("solola:plan:updated", sync);
  }, []);

  return {
    plan,
    setPlan: storePlanId,
    can: (privilegeId: string) => hasPrivilege(plan, privilegeId)
  };
}

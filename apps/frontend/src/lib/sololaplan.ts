export type SololaPlanId = "FREE" | "STANDARD" | "PRO";

export type PlanPrivilege = {
  id: string;
  label: string;
  free: boolean;
  standard: boolean;
  pro: boolean;
};

export const SOLOLA_PLANS: {
  id: SololaPlanId;
  title: string;
  subtitle: string;
  price: string;
  accent: string;
}[] = [
  { id: "FREE", title: "Gratuit", subtitle: "Essentiel social + chat", price: "0 €", accent: "from-slate-500/30 to-slate-700/20" },
  { id: "STANDARD", title: "Standard", subtitle: "Plus de stockage et outils", price: "4,99 €/mois", accent: "from-neoblue/30 to-cyan-500/20" },
  { id: "PRO", title: "Pro", subtitle: "Business, analytics, priorité", price: "14,99 €/mois", accent: "from-neoviolet/40 to-pink-500/20" }
];

export const PLAN_PRIVILEGES: PlanPrivilege[] = [
  { id: "dm", label: "Messages prives illimites", free: true, standard: true, pro: true },
  { id: "groups", label: "Groupes (jusqu'a 200 membres)", free: true, standard: true, pro: true },
  { id: "groups_large", label: "Groupes massifs (1000+ membres)", free: false, standard: false, pro: true },
  { id: "channels", label: "Creation de canaux", free: false, standard: true, pro: true },
  { id: "reels", label: "Reels HD + analytics", free: false, standard: true, pro: true },
  { id: "stories", label: "Stories 24h + highlights", free: true, standard: true, pro: true },
  { id: "live", label: "Live streaming", free: false, standard: false, pro: true },
  { id: "calls", label: "Appels audio/video", free: false, standard: true, pro: true },
  { id: "files", label: "Envoi fichiers lourds (PDF/ZIP)", free: false, standard: true, pro: true },
  { id: "scheduled", label: "Messages programmes", free: false, standard: false, pro: true },
  { id: "ephemeral", label: "Messages ephemeres", free: true, standard: true, pro: true },
  { id: "cloud", label: "Sauvegarde cloud multi-appareils", free: false, standard: false, pro: true },
  { id: "2fa", label: "Double authentification avancee", free: false, standard: true, pro: true },
  { id: "e2e", label: "Chats secrets chiffres E2E", free: false, standard: false, pro: true },
  { id: "bots", label: "Bots et automatisations", free: false, standard: false, pro: true },
  { id: "ads", label: "Sans publicite", free: false, standard: true, pro: true },
  { id: "creator", label: "Monetisation createur", free: false, standard: false, pro: true },
  { id: "shop", label: "Boutique e-commerce", free: false, standard: false, pro: true },
  { id: "ai_moderation", label: "Moderation IA avancee", free: false, standard: true, pro: true }
];

export function resolvePlanFromUser(planTier?: "FREE" | "PREMIUM" | null): SololaPlanId {
  if (planTier === "PREMIUM") return "PRO";
  return "FREE";
}

export function hasPrivilege(plan: SololaPlanId, privilegeId: string): boolean {
  const row = PLAN_PRIVILEGES.find((p) => p.id === privilegeId);
  if (!row) return false;
  if (plan === "PRO") return row.pro;
  if (plan === "STANDARD") return row.standard;
  return row.free;
}

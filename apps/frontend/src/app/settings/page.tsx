"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AuthGuard } from "../../components/nextalkauthguard";
import { SololaPlanBadge } from "../../components/sololaplanbadge";
import { useSololaPlan } from "../../hooks/useSololaPlan";
import { logoutSession } from "../../lib/nextalksession";
import { hasPrivilege } from "../../lib/sololaplan";
import { fetchCsrfToken } from "../../services/nextalksecurity";
import { getMyProfile, updateProfileSettings } from "../../services/nextalkprofile";

type RowType = "toggle" | "link" | "value";
type Row = {
  id: string;
  icon: string;
  title: string;
  description?: string;
  type: RowType;
  keyName?: string;
  value?: string;
};
type Section = { id: string; title: string; rows: Row[] };

const SETTINGS_SECTIONS: Section[] = [
  { id: "compte", title: "Compte", rows: [
    { id: "profil", icon: "👤", title: "Modifier le profil", description: "Nom, bio, photo et liens", type: "link" },
    { id: "email", icon: "✉️", title: "Email principal", description: "Gérer l'adresse de connexion", type: "value", value: "elvis@solola.app" },
    { id: "username", icon: "#️⃣", title: "Nom d'utilisateur", description: "Votre identifiant public", type: "value", value: "@elvis.solola" }
  ]},
  { id: "securite", title: "Sécurité", rows: [
    { id: "2fa", icon: "🛡️", title: "Double authentification", description: "Code de sécurité à la connexion", type: "toggle", keyName: "twoFactor" },
    { id: "biometrie", icon: "🧬", title: "Verrouillage biométrique", description: "Protéger l'accès à l'app", type: "toggle", keyName: "biometricLock" },
    { id: "sessions", icon: "📱", title: "Sessions actives", description: "Appareils actuellement connectés", type: "link" }
  ]},
  { id: "confidentialite", title: "Confidentialité", rows: [
    { id: "private", icon: "🔒", title: "Compte privé", description: "Valider les abonnés manuellement", type: "toggle", keyName: "privateAccount" },
    { id: "online", icon: "🟢", title: "Statut en ligne", description: "Afficher votre présence", type: "toggle", keyName: "showOnline" },
    { id: "blocked", icon: "🚫", title: "Comptes bloqués", description: "Gérer vos restrictions", type: "link" }
  ]},
  { id: "notifications", title: "Notifications", rows: [
    { id: "notifPush", icon: "🔔", title: "Notifications push", description: "Messages, likes, appels", type: "toggle", keyName: "pushNotifications" },
    { id: "notifEmail", icon: "📩", title: "Notifications email", description: "Résumé quotidien et sécurité", type: "toggle", keyName: "emailNotifications" },
    { id: "notifSound", icon: "🔊", title: "Sons système", description: "Feedback sonore de l'app", type: "toggle", keyName: "soundEffects" }
  ]},
  { id: "medias", title: "Médias & contenu", rows: [
    { id: "quality", icon: "🎬", title: "Qualité des médias", description: "Lecture HD automatique", type: "toggle", keyName: "hdMedia" },
    { id: "autoplay", icon: "▶️", title: "Autoplay des vidéos", description: "Reels et stories automatiques", type: "toggle", keyName: "autoplayVideos" },
    { id: "content", icon: "🧹", title: "Filtre contenu sensible", description: "Modération intelligente", type: "link" }
  ]},
  { id: "data", title: "Données & stockage", rows: [
    { id: "storage", icon: "💾", title: "Stockage local", description: "Cache des médias et conversations", type: "link" },
    { id: "backup", icon: "☁️", title: "Sauvegarde cloud", description: "Synchronisation automatique", type: "toggle", keyName: "cloudBackup" },
    { id: "export", icon: "📦", title: "Exporter mes données", description: "Archive complète du compte", type: "link" }
  ]},
  { id: "apparence", title: "Apparence", rows: [
    { id: "dark", icon: "🌙", title: "Dark mode", description: "Thème sombre néon", type: "toggle", keyName: "darkMode" },
    { id: "theme", icon: "🎨", title: "Palette d'interface", description: "Néon, classique, minimal", type: "link" },
    { id: "font", icon: "🔠", title: "Taille du texte", description: "Confort de lecture", type: "link" }
  ]},
  { id: "accessibilite", title: "Accessibilité", rows: [
    { id: "contrast", icon: "⚫", title: "Contraste élevé", description: "Lisibilité renforcée", type: "toggle", keyName: "highContrast" },
    { id: "reduce", icon: "🌀", title: "Réduire les animations", description: "Transitions plus douces", type: "toggle", keyName: "reducedMotion" },
    { id: "voice", icon: "🗣️", title: "Assistances vocales", description: "Navigation et dictée", type: "link" }
  ]},
  { id: "messages", title: "Messages & appels", rows: [
    { id: "readReceipts", icon: "✅", title: "Accusés de lecture", description: "Afficher Lu / Reçu", type: "toggle", keyName: "readReceipts" },
    { id: "encryption", icon: "🔐", title: "Chiffrement renforcé", description: "Protection avancée des échanges", type: "toggle", keyName: "secureMessaging" },
    { id: "callPrefs", icon: "📞", title: "Préférences d'appel", description: "Audio, vidéo, qualité", type: "link" }
  ]},
  { id: "canaux", title: "Canaux & contenu", rows: [
    { id: "channelSuggest", icon: "📡", title: "Suggestions de canaux", description: "Découverte personnalisée", type: "toggle", keyName: "channelSuggestions" },
    { id: "autofollow", icon: "🧭", title: "Suivi automatique des tendances", description: "Activer les recommandations", type: "toggle", keyName: "autoTrendFollow" },
    { id: "creator", icon: "🧑‍💻", title: "Outils créateurs", description: "Monétisation et analytics", type: "link" }
  ]},
  { id: "ia", title: "IA & personnalisation", rows: [
    { id: "aiFeed", icon: "🤖", title: "Feed intelligent", description: "Optimiser l'ordre des contenus", type: "toggle", keyName: "aiFeed" },
    { id: "aiSafety", icon: "🧠", title: "Filtrage IA de sécurité", description: "Détection proactive des abus", type: "toggle", keyName: "aiSafety" },
    { id: "aiPersona", icon: "✨", title: "Persona Solola", description: "Configurer votre expérience IA", type: "link" }
  ]},
  { id: "devices", title: "Appareils & connexions", rows: [
    { id: "deviceList", icon: "🖥️", title: "Mes appareils", description: "Sessions desktop et mobile", type: "link" },
    { id: "wifiOnly", icon: "📶", title: "Upload uniquement en Wi‑Fi", description: "Économie de données", type: "toggle", keyName: "wifiOnlyUpload" },
    { id: "bluetooth", icon: "🛰️", title: "Connexion accessoires", description: "Audio et périphériques", type: "link" }
  ]},
  { id: "billing", title: "Facturation / abonnement", rows: [
    { id: "plan", icon: "💳", title: "Abonnement (Free / Standard / Pro)", description: "Privileges Telegram + Instagram", type: "link" },
    { id: "payment", icon: "🏦", title: "Moyens de paiement", description: "Carte et mobile money", type: "link" },
    { id: "invoices", icon: "🧾", title: "Factures", description: "Historique de paiement", type: "link" }
  ]},
  { id: "advanced", title: "Avancé (développeur)", rows: [
    { id: "debug", icon: "🧪", title: "Mode debug UI", description: "Afficher les informations techniques", type: "toggle", keyName: "debugUI" },
    { id: "logs", icon: "📘", title: "Journaux applicatifs", description: "Diagnostiquer l'app", type: "link" },
    { id: "api", icon: "🛠️", title: "Paramètres API", description: "Endpoints et sandbox", type: "link" }
  ]},
  { id: "support", title: "Support", rows: [
    { id: "help", icon: "❓", title: "Centre d'aide", description: "FAQ, guides et tutoriels", type: "link" },
    { id: "contact", icon: "💬", title: "Contacter le support", description: "Assistance Solola 24/7", type: "link" },
    { id: "report", icon: "⚠️", title: "Signaler un problème", description: "Bug, abus ou incident", type: "link" }
  ]},
  { id: "danger", title: "Déconnexion / suppression", rows: [
    { id: "logout", icon: "🚪", title: "Se déconnecter", description: "Fermer la session actuelle", type: "link" },
    { id: "delete", icon: "🗑️", title: "Supprimer le compte", description: "Action irréversible", type: "link" }
  ]}
];

function IOSSwitch({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <motion.button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-[#34C759]" : "bg-white/20"}`}
      animate={{ backgroundColor: checked ? "#34C759" : "rgba(255,255,255,0.2)" }}
      transition={{ duration: 0.2 }}
    >
      <motion.span
        className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow"
        animate={{ x: checked ? 23 : 2 }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
      />
    </motion.button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { plan } = useSololaPlan();
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState("Chargement des parametres...");
  const [accountEmail, setAccountEmail] = useState("");
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    darkMode: true,
    pushNotifications: true,
    emailNotifications: false,
    soundEffects: true,
    twoFactor: true,
    biometricLock: false,
    privateAccount: false,
    showOnline: true,
    hdMedia: true,
    autoplayVideos: true,
    cloudBackup: true,
    highContrast: false,
    reducedMotion: false,
    readReceipts: true,
    secureMessaging: true,
    channelSuggestions: true,
    autoTrendFollow: false,
    aiFeed: true,
    aiSafety: true,
    wifiOnlyUpload: false,
    debugUI: false
  });

  useEffect(() => {
    void (async () => {
      try {
        const profile = await getMyProfile();
        const s = profile?.settings;
        setAccountEmail(String(profile?.email ?? ""));
        if (s) {
          setToggles((prev) => ({
            ...prev,
            darkMode: String(s.theme ?? "DARK").toUpperCase() === "DARK",
            readReceipts: Boolean(s.readReceipts),
            showOnline: !Boolean(s.hideOnlineStatus),
            privateAccount: String(s.profileVisibility ?? "VISIBLE") === "HIDDEN",
            pushNotifications: Boolean(s.notifMessages) && Boolean(s.notifLikes),
            cloudBackup: Boolean(s.autoSaveMedia)
          }));
        }
        setFeedback("Parametres synchronises avec ton compte.");
      } catch {
        setFeedback("Mode hors ligne : reglages locaux uniquement.");
      }
    })();
  }, []);

  const persistSettings = async (patch: Record<string, boolean>, title: string) => {
    try {
      const csrf = await fetchCsrfToken();
      await updateProfileSettings(
        {
          theme: patch.darkMode === false ? "light" : "dark",
          readReceipts: patch.readReceipts,
          hideOnlineStatus: patch.showOnline === false,
          profileVisibility: patch.privateAccount ? "HIDDEN" : "VISIBLE",
          notifMessages: patch.pushNotifications,
          notifLikes: patch.pushNotifications,
          autoSaveMedia: patch.cloudBackup
        },
        csrf
      );
      setFeedback(`${title} enregistre sur le serveur.`);
    } catch {
      setFeedback(`${title} sauvegarde localement (sync serveur indisponible).`);
    }
  };

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SETTINGS_SECTIONS;
    return SETTINGS_SECTIONS
      .map((section) => ({
        ...section,
        rows: section.rows.filter((row) =>
          `${row.title} ${row.description ?? ""}`.toLowerCase().includes(q)
        )
      }))
      .filter((section) => section.rows.length > 0);
  }, [query]);

  const updateToggle = (key: string, value: boolean, title: string) => {
    const lockedKeys: Record<string, string> = {
      secureMessaging: "e2e",
      cloudBackup: "cloud",
      twoFactor: "2fa"
    };
    const privilege = lockedKeys[key];
    if (privilege && !hasPrivilege(plan, privilege)) {
      setFeedback(`${title} necessite un plan Standard ou Pro.`);
      return;
    }

    setToggles((prev) => {
      const next = { ...prev, [key]: value };
      void persistSettings(next, title);
      return next;
    });
    setFeedback(`${title} ${value ? "active" : "desactive"}.`);
  };

  const openRow = (row: Row) => {
    if (row.id === "plan") {
      router.push("/settings/plan");
      return;
    }
    if (row.id === "logout") {
      logoutSession();
      router.push("/auth");
      return;
    }
    if (row.id === "profil") {
      router.push("/profile");
      return;
    }
    setFeedback(`Navigation : ${row.title}`);
  };

  return (
    <AuthGuard>
      <section className="mx-auto max-w-5xl pb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white">Parametres</h1>
            <p className="mt-1 text-sm text-slate-400">
              Style Telegram : confidentialite, notifications, securite, donnees.
            </p>
            {accountEmail ? <p className="mt-1 text-xs text-slate-500">{accountEmail}</p> : null}
          </div>
          <SololaPlanBadge />
        </div>

        <div className="glass mb-4 rounded-2xl p-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher un réglage..."
            className="input-neon w-full rounded-xl px-3 py-2 text-sm"
          />
        </div>

        <AnimatePresence mode="popLayout">
          {filteredSections.map((section, sectionIndex) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ delay: sectionIndex * 0.02 }}
              className="mb-4"
            >
              <p className="mb-2 px-1 text-xs uppercase tracking-[0.18em] text-slate-400">{section.title}</p>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-lg">
                {section.rows.map((row, rowIndex) => (
                  <div key={row.id} className={`flex items-center gap-3 px-3 py-3 ${rowIndex !== section.rows.length - 1 ? "border-b border-white/10" : ""}`}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm">{row.icon}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{row.title}</p>
                      {row.description ? <p className="truncate text-xs text-slate-400">{row.description}</p> : null}
                    </div>
                    {row.type === "toggle" && row.keyName ? (
                      <IOSSwitch checked={Boolean(toggles[row.keyName])} onChange={(value) => updateToggle(row.keyName!, value, row.title)} />
                    ) : null}
                    {row.type === "value" ? <span className="text-xs text-slate-300">{row.value}</span> : null}
                    {row.type === "link" ? (
                      row.id === "plan" ? (
                        <Link href="/settings/plan" className="rounded-lg px-2 py-1 text-slate-400 hover:bg-white/10 hover:text-white">
                          ›
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openRow(row)}
                          className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                          aria-label={`Ouvrir ${row.title}`}
                        >
                          ›
                        </button>
                      )
                    ) : null}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.div
          key={feedback}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-3 text-sm text-slate-200"
        >
          {feedback}
        </motion.div>
      </section>
    </AuthGuard>
  );
}

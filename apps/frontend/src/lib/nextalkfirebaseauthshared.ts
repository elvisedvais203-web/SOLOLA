/** Utilitaires partagés pour l’écran d’auth Firebase (e-mail, Google, Apple, téléphone). */

export function formatPhoneInput(value: string) {
  if (!value.startsWith("+")) {
    return `+${value.replace(/[^\d]/g, "")}`;
  }
  return `+${value.slice(1).replace(/[^\d]/g, "")}`;
}

export const FIREBASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID
);

/** Évite les redirections ouvertes via ?next=https://... */
export function sanitizeNextPath(raw: string | null): string {
  const fallback = "/dashboard";
  if (raw == null || typeof raw !== "string") return fallback;
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return fallback;
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(t)) return fallback;
  return t;
}

/** Messages utilisateur pour les erreurs Firebase Auth (téléphone / reCAPTCHA / pop-up). */
export function firebaseAuthUserMessage(error: unknown): string {
  const e = error as { code?: string; message?: string };
  const code = typeof e?.code === "string" ? e.code : "";
  const raw = typeof e?.message === "string" ? e.message : "";

  const byCode: Record<string, string> = {
    "auth/invalid-phone-number":
      "Numéro de téléphone invalide pour Firebase. Utilisez le format international, par ex. +243895966288 (sans espaces).",
    "auth/missing-phone-number": "Numéro manquant. Vérifiez le champ téléphone.",
    "auth/invalid-verification-code":
      "Code SMS incorrect. Vérifiez les 6 chiffres et réessayez.",
    "auth/code-expired":
      "Ce code a expiré. Demandez un nouveau code avec « Envoyer le code ».",
    "auth/session-expired":
      "La session a expiré. Demandez un nouveau code SMS.",
    "auth/too-many-requests":
      "Trop de tentatives. Attendez quelques minutes ou changez de réseau, puis réessayez.",
    "auth/quota-exceeded":
      "Quota SMS Firebase dépassé pour ce projet. Réessayez plus tard ou contactez l’administrateur (facturation Firebase).",
    "auth/billing-not-enabled":
      "Firebase exige un compte de facturation actif pour envoyer de vrais SMS (Phone Auth hors numéros de test). Dans la console Firebase : ouvrez votre projet, menu Facturation / Upgrade (plan Blaze ou association à Google Cloud Billing), ajoutez un moyen de paiement, puis attendez quelques minutes et réessayez. Alternative en développement : Authentication > Sign-in method > Phone > Numéros de test (sans SMS réel).",
    "auth/operation-not-allowed":
      "Cette méthode de connexion n’est pas activée. Dans Firebase Console : Authentication > Sign-in method, active Phone / Google / Apple selon ce que tu utilises.",
    "auth/unauthorized-domain":
      "Ce site (domaine) n’est pas autorisé pour Firebase. Dans la console Firebase : Authentication > Settings > Authorized domains, ajoutez localhost (dev) ou votre domaine de production.",
    "auth/captcha-check-failed":
      "Vérification reCAPTCHA échouée. Rechargez la page, désactivez les bloqueurs de pub, puis réessayez.",
    "auth/invalid-app-credential":
      "Identifiants Firebase invalides (clé API, App ID ou domaine). Vérifiez les variables NEXT_PUBLIC_FIREBASE_* dans le fichier .env et la configuration du projet Firebase.",
    "auth/app-not-authorized":
      "Cette application n’est pas autorisée à utiliser Firebase Authentication avec ce projet.",
    "auth/network-request-failed":
      "Connexion réseau vers Firebase impossible. Vérifiez Internet ou un pare-feu / VPN.",
    "auth/missing-client-identifier":
      "Configuration Firebase incomplète côté client (clés ou App ID manquants).",
    "auth/popup-closed-by-user":
      "Connexion annulée (fenêtre fermée). Réessaie ou désactive le bloqueur de pop-up.",
    "auth/cancelled-popup-request":
      "Connexion annulée. Réessaie.",
    "auth/account-exists-with-different-credential":
      "Un compte existe déjà avec cet identifiant via une autre méthode. Utilise la même méthode que lors de la première connexion.",
    "auth/web-storage-unsupported":
      "Stockage navigateur indisponible (mode privé ?). Utilise une fenêtre normale.",
    "auth/operation-not-supported-in-this-environment":
      "Connexion non prise en charge dans cet environnement (navigateur ou intégration).",
    "auth/email-already-in-use":
      "Cette adresse e-mail est déjà utilisée. Passe en « Connexion » ou connecte-toi avec Google / Apple si tu l’as déjà faite.",
    "auth/invalid-email": "Adresse e-mail invalide.",
    "auth/weak-password":
      "Mot de passe trop faible. Utilise au moins 6 caractères (recommandation Firebase).",
    "auth/wrong-password": "Mot de passe incorrect.",
    "auth/user-not-found": "Aucun compte avec cette adresse. Crée un compte ou vérifie l’e-mail.",
    "auth/invalid-credential": "E-mail ou mot de passe incorrect."
  };

  if (code && byCode[code]) {
    return byCode[code];
  }

  const text = `${raw} ${code}`.toLowerCase();
  if (text.includes("invalid-phone-number")) {
    return "Numéro invalide. Format attendu : +243…";
  }
  if (text.includes("too-many-requests")) {
    return "Trop de tentatives. Veuillez réessayer plus tard.";
  }
  if (text.includes("invalid-verification-code")) {
    return "Code invalide. Veuillez vérifier le SMS.";
  }
  if (text.includes("session-expired") || text.includes("code-expired")) {
    return "Code expiré. Demandez un nouveau code.";
  }
  if (text.includes("network-request-failed") || text.includes("network")) {
    return "Connexion réseau échouée. Vérifiez votre connexion Internet.";
  }
  if (text.includes("billing-not-enabled")) {
    return byCode["auth/billing-not-enabled"];
  }

  const devHint =
    process.env.NODE_ENV === "development" && (code || raw)
      ? ` (technique : ${code || "sans code"}${raw ? ` — ${raw.slice(0, 120)}` : ""})`
      : "";
  return `Une erreur est survenue lors de l’envoi ou de la vérification.${devHint}`;
}

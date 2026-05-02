"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { User } from "firebase/auth";
import {
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  OAuthProvider,
  ApplicationVerifier,
  RecaptchaVerifier
} from "firebase/auth";
import { auth } from "../../nextalkfirebase";
import api from "../../lib/nextalkapi";
import { isLoggedIn, storeSession } from "../../lib/nextalksession";
import { SololaThemedLogo } from "../../components/sololathemedlogo";

function formatPhoneInput(value: string) {
  if (!value.startsWith("+")) {
    return `+${value.replace(/[^\d]/g, "")}`;
  }
  return `+${value.slice(1).replace(/[^\d]/g, "")}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Évite les redirections ouvertes via ?next=https://... */
function sanitizeNextPath(raw: string | null): string {
  const fallback = "/dashboard";
  if (raw == null || typeof raw !== "string") return fallback;
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return fallback;
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(t)) return fallback;
  return t;
}

const FIREBASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID
);

type PhoneConfirmationResult = { confirm: (code: string) => Promise<any> };

/** Messages utilisateur pour les erreurs Firebase Auth (telephone / reCAPTCHA). */
function firebaseAuthUserMessage(error: unknown): string {
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
      "Un compte existe déjà avec cet e-mail via une autre méthode (mot de passe ou téléphone). Connecte-toi avec cette méthode, puis tu pourras lier le compte dans les paramètres si besoin.",
    "auth/web-storage-unsupported":
      "Stockage navigateur indisponible (mode privé ?). Utilise une fenêtre normale.",
    "auth/operation-not-supported-in-this-environment":
      "Connexion non prise en charge dans cet environnement (navigateur ou intégration)."
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

export default function AuthClientSimple() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams.get("next"));
  const apiConfigured = Boolean(process.env.NEXT_PUBLIC_API_URL) || process.env.NODE_ENV !== "production";
  const [tab, setTab] = useState<"phone" | "email">("email");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [oauthBusy, setOauthBusy] = useState<null | "google" | "apple">(null);
  const [phoneNumber, setPhoneNumber] = useState("+243");
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] =
    useState<PhoneConfirmationResult | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"error" | "success">("success");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [submittingEmail, setSubmittingEmail] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace(nextPath);
    }
  }, [router, nextPath]);

  useEffect(() => {
    const root = document.documentElement;
    const prevTheme = root.getAttribute("data-theme");
    root.setAttribute("data-theme", "light");
    return () => {
      if (prevTheme == null) root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", prevTheme);
    };
  }, []);

  useEffect(() => {
    const paramError = searchParams.get("error");
    if (paramError?.trim()) {
      setStatus(paramError.trim());
      setStatusType("error");
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("register") === "1") {
      setAuthMode("register");
    }
  }, [searchParams]);

  const getOrCreateRecaptchaVerifier = (): ApplicationVerifier | undefined => {
    try {
      // Essayer d'utiliser le verifier global si disponible
      if ((window as any).recaptchaVerifier) {
        return (window as any).recaptchaVerifier;
      }

      // Créer un nouveau verifier de manière plus simple
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {
          console.log("reCAPTCHA verified");
        },
        "error-callback": () => {
          console.warn("reCAPTCHA error");
        }
      });

      (window as any).recaptchaVerifier = verifier;
      return verifier;
    } catch (error) {
      console.warn("Cannot create reCAPTCHA verifier:", error);
      return undefined;
    }
  };

  const oauthDisabled =
    !FIREBASE_CONFIGURED ||
    !apiConfigured ||
    oauthBusy !== null ||
    sending ||
    verifying ||
    submittingEmail;

  const emailFormDisabled = submittingEmail || oauthBusy !== null;

  const finishFirebaseUserSession = async (firebaseUser: User): Promise<boolean> => {
    try {
      const idToken = await firebaseUser.getIdToken(true);
      const backend = await api.post("/auth/firebase/verify", {
        idToken,
        displayName: firebaseUser.displayName ?? undefined
      });
      storeSession({
        accessToken: backend.data.tokens.accessToken,
        refreshToken: backend.data.tokens.refreshToken,
        user: backend.data.user
      });
      setStatus("Connexion réussie.");
      setStatusType("success");
      setTimeout(() => {
        router.push(nextPath);
      }, 400);
      return true;
    } catch (error: unknown) {
      await signOut(auth).catch(() => {});
      console.error("[auth] firebase/verify (OAuth)", error);
      const e = error as {
        code?: string;
        message?: string;
        response?: { data?: { message?: string } };
      };
      if (typeof e?.code === "string" && e.code.startsWith("auth/")) {
        setStatus(firebaseAuthUserMessage(error));
      } else {
        setStatus(
          e?.response?.data?.message ??
            e?.message ??
            "Le serveur n’a pas pu valider la session. Réessaie ou utilise e-mail / téléphone."
        );
      }
      setStatusType("error");
      return false;
    }
  };

  const signInWithGooglePopup = async () => {
    if (!FIREBASE_CONFIGURED || !apiConfigured) {
      return;
    }
    setOauthBusy("google");
    setStatus("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const cred = await signInWithPopup(auth, provider);
      await finishFirebaseUserSession(cred.user);
    } catch (error: unknown) {
      console.error("[auth] Google popup", error);
      setStatus(firebaseAuthUserMessage(error));
      setStatusType("error");
    } finally {
      setOauthBusy(null);
    }
  };

  const signInWithApplePopup = async () => {
    if (!FIREBASE_CONFIGURED || !apiConfigured) {
      return;
    }
    setOauthBusy("apple");
    setStatus("");
    try {
      const provider = new OAuthProvider("apple.com");
      provider.addScope("email");
      provider.addScope("name");
      const cred = await signInWithPopup(auth, provider);
      await finishFirebaseUserSession(cred.user);
    } catch (error: unknown) {
      console.error("[auth] Apple popup", error);
      setStatus(firebaseAuthUserMessage(error));
      setStatusType("error");
    } finally {
      setOauthBusy(null);
    }
  };

  const sendCode = async () => {
    try {
      setSending(true);
      setStatus("");

      const normalizedPhone = formatPhoneInput(phoneNumber.trim());

      const verifier = getOrCreateRecaptchaVerifier();

      if (!verifier) {
        setStatus("reCAPTCHA indisponible. Rechargez la page puis réessayez.");
        setStatusType("error");
        return;
      }

      const confirmation = await signInWithPhoneNumber(
        auth,
        normalizedPhone,
        verifier
      );

      setConfirmationResult(confirmation);
      setStatus(`Code SMS envoyé au numéro ${normalizedPhone}.`);
      setStatusType("success");
    } catch (error: unknown) {
      console.error("[auth] signInWithPhoneNumber", error);
      setStatus(firebaseAuthUserMessage(error));
      setStatusType("error");

      // Nettoyer le verifier
      try {
        const verifier = (window as any).recaptchaVerifier;
        if (verifier?.clear) {
          await verifier.clear();
        }
      } catch {
        // Ignorer
      }
      (window as any).recaptchaVerifier = null;
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    if (!confirmationResult) {
      setStatus("Veuillez d’abord demander le code SMS.");
      setStatusType("error");
      return;
    }

    if (otpCode.trim().length < 6) {
      setStatus("Entrez le code OTP à 6 chiffres.");
      setStatusType("error");
      return;
    }

    try {
      setVerifying(true);
      setStatus("");
      const credential = await confirmationResult.confirm(otpCode.trim());
      const idToken = await credential.user.getIdToken(true);

      const backend = await api.post("/auth/firebase/verify", {
        idToken,
        displayName: credential.user.displayName ?? undefined
      });

      storeSession({
        accessToken: backend.data.tokens.accessToken,
        refreshToken: backend.data.tokens.refreshToken,
        user: backend.data.user
      });

      setStatus("Connexion réussie.");
      setStatusType("success");
      setTimeout(() => {
        router.push(nextPath);
      }, 500);
    } catch (error: unknown) {
      console.error("[auth] verifyCode / backend", error);
      const e = error as {
        code?: string;
        message?: string;
        response?: { data?: { message?: string } };
      };
      if (typeof e?.code === "string" && e.code.startsWith("auth/")) {
        setStatus(firebaseAuthUserMessage(error));
      } else {
        setStatus(
          e?.response?.data?.message ??
            e?.message ??
            firebaseAuthUserMessage(error)
        );
      }
      setStatusType("error");
    } finally {
      setVerifying(false);
    }
  };

  const submitEmailAuth = async () => {
    try {
      setSubmittingEmail(true);
      setStatus("");

      if (!email.trim()) {
        setStatus("Entrez votre adresse e-mail.");
        setStatusType("error");
        return;
      }

      if (!isValidEmail(email.trim())) {
        setStatus(
          "Utilise une adresse e-mail valide pour ce champ (ex. prenom@gmail.com). L’inscription par numéro se fait dans l’onglet Téléphone avec le code SMS."
        );
        setStatusType("error");
        return;
      }

      if (authMode === "register") {
        if (password.length < 8) {
          setStatus("Mot de passe trop court (minimum 8 caractères).");
          setStatusType("error");
          return;
        }
        if (password !== confirmPassword) {
          setStatus("Les mots de passe ne correspondent pas.");
          setStatusType("error");
          return;
        }
        const resp = await api.post("/auth/email/register", {
          email: email.trim(),
          password,
          displayName: displayName.trim() || undefined
        });
        storeSession({
          accessToken: resp.data.tokens.accessToken,
          refreshToken: resp.data.tokens.refreshToken,
          user: resp.data.user
        });
        setStatus("Compte créé. Connexion réussie.");
        setStatusType("success");
        setTimeout(() => router.push(nextPath), 500);
        return;
      }

      if (authMode === "login") {
        const resp = await api.post("/auth/email/login", {
          email: email.trim(),
          password
        });
        storeSession({
          accessToken: resp.data.tokens.accessToken,
          refreshToken: resp.data.tokens.refreshToken,
          user: resp.data.user
        });
        setStatus("Connexion réussie.");
        setStatusType("success");
        setTimeout(() => router.push(nextPath), 500);
        return;
      }
    } catch (error: unknown) {
      const e = error as { code?: string; message?: string; response?: { data?: { message?: string } } };
      const raw = String(e?.message ?? "");
      const net = e?.code === "ERR_NETWORK" || raw.toLowerCase().includes("network error");
      setStatus(
        net
          ? "Connexion au serveur impossible. Vérifie ta connexion Internet, désactive le VPN ou le pare-feu qui bloquent, ou réessaie dans quelques minutes. Sur l’hébergeur du frontend, vérifie que NEXT_PUBLIC_API_URL pointe vers ton API (ex. https://ton-backend.onrender.com/api)."
          : (e?.response?.data?.message ?? raw) || "Erreur."
      );
      setStatusType("error");
    } finally {
      setSubmittingEmail(false);
    }
  };

  const emailTrimmed = email.trim();
  const passwordOk = password.length >= 8;
  const confirmOk = authMode !== "register" || password === confirmPassword;
  const canSubmitEmail =
    authMode === "login"
      ? Boolean(emailTrimmed) && Boolean(password)
      : Boolean(emailTrimmed) && passwordOk && confirmOk;

  return (
    <div className="mx-auto flex min-h-[100svh] max-w-6xl items-stretch justify-center px-4 py-8 pb-14 md:py-12">
      <div className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.95fr] lg:items-stretch lg:gap-10">
        <section className="relative order-2 hidden min-h-[420px] overflow-hidden rounded-[28px] border border-white/10 shadow-[0_26px_100px_rgba(0,0,0,0.55)] lg:order-1 lg:block lg:min-h-[560px]">
          {/* Hero local (voir public/branding/auth-hero.jpg) */}
          <img
            src="/branding/auth-hero.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#ff5f9bcc]/45 via-[#06070e]/20 to-[#06070ef2]" />
          <div className="relative flex h-full min-h-[560px] flex-col justify-between p-8 lg:min-h-0 lg:p-10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <SololaThemedLogo width={52} height={52} className="rounded-2xl ring-2 ring-white/35" priority sizes="52px" />
                <div>
                  <p className="font-heading text-3xl font-extrabold text-white drop-shadow-[0_6px_30px_rgba(0,0,0,0.45)]">Solola</p>
                  <p className="mt-1 text-sm text-white/80">Stories • Reels • Messages</p>
                </div>
              </div>
            </div>

            <div className="mt-10 max-w-xl">
              <p className="font-heading text-4xl font-extrabold leading-[1.05] text-white drop-shadow-[0_10px_40px_rgba(0,0,0,0.55)]">
                Tout ce qu’il te faut, dans une seule application.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/80">
                Publie, discute et partage comme sur Instagram avec ton identité Solola.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/85">
              <span className="rounded-2xl border border-white/15 bg-black/35 px-3 py-2 backdrop-blur">Stories</span>
              <span className="rounded-2xl border border-white/15 bg-black/35 px-3 py-2 backdrop-blur">Reels</span>
              <span className="rounded-2xl border border-white/15 bg-black/35 px-3 py-2 backdrop-blur">Canaux</span>
            </div>
          </div>
        </section>

        <div className="order-1 lg:order-2">
          {/* Mobile hero (meme image) */}
          <div className="relative mb-6 h-[220px] overflow-hidden rounded-[22px] border border-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.45)] lg:hidden">
            <img src="/branding/auth-hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" decoding="async" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="font-heading text-2xl font-extrabold leading-tight text-white">Solola</p>
              <p className="mt-1 text-xs text-white/80">Stories • Reels • Messages</p>
            </div>
          </div>

          <section className="w-full animate-slide-up lg:flex lg:flex-col lg:justify-center">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-4 text-center lg:hidden">
              <div className="mx-auto mb-3 flex w-full justify-center">
                <SololaThemedLogo width={64} height={64} className="rounded-2xl" priority sizes="64px" />
              </div>
              <h1 className="font-heading text-4xl font-bold text-white">Solola</h1>
              <p className="mt-2 text-sm text-[var(--muted)]">Connecte-toi pour continuer.</p>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#10172b]">
                    {authMode === "login" ? "Connexion" : "Inscription"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {authMode === "login"
                      ? "Entre tes identifiants pour te connecter."
                      : "Crée ton compte en quelques secondes."}
                  </p>
                </div>
                <div className="hidden sm:block">
                  <SololaThemedLogo width={34} height={34} className="rounded-xl" priority sizes="34px" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setStatus("");
                  }}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                    authMode === "login" ? "bg-[#10172b] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Se connecter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setStatus("");
                  }}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                    authMode === "register" ? "bg-[#10172b] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  S’inscrire
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTab("email");
                    setStatus("");
                  }}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                    tab === "email" ? "border border-slate-200 bg-white text-[#10172b]" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab("phone");
                    setStatus("");
                  }}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                    tab === "phone" ? "border border-slate-200 bg-white text-[#10172b]" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Téléphone
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={oauthDisabled}
                    onClick={() => void signInWithGooglePopup()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#10172b] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    title={!FIREBASE_CONFIGURED ? "Configure Firebase dans .env" : undefined}
                  >
                    {oauthBusy === "google" ? "Connexion…" : "Continuer avec Google"}
                  </button>
                  <button
                    type="button"
                    disabled={oauthDisabled}
                    onClick={() => void signInWithApplePopup()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-[#10172b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                    title={!FIREBASE_CONFIGURED ? "Configure Firebase dans .env" : undefined}
                  >
                    {oauthBusy === "apple" ? "Connexion…" : "Continuer avec Apple"}
                  </button>
                </div>

                <div className="my-1 flex items-center gap-3">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">ou</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

          {tab === "phone" ? (
            <>
              {!apiConfigured ? (
                <div className="rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  Configuration API manquante : définissez NEXT_PUBLIC_API_URL (ex.{" "}
                  https://ton-backend.onrender.com/api), puis redéployez le frontend.
                </div>
              ) : null}
              {!FIREBASE_CONFIGURED ? (
                <div className="rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  Configuration Firebase manquante : définissez NEXT_PUBLIC_FIREBASE_API_KEY,
                  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID et
                  NEXT_PUBLIC_FIREBASE_APP_ID dans le fichier .env à la racine du projet, puis
                  redémarrez le serveur de développement.
                </div>
              ) : null}

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Numéro de téléphone
                </label>
                <input
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(formatPhoneInput(e.target.value))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#10172b] placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[rgba(76,111,255,0.25)] disabled:opacity-60"
                  placeholder="+243..."
                  autoComplete="tel"
                  disabled={sending || verifying || oauthBusy !== null}
                  type="tel"
                />
              </div>

              <button
                onClick={() => void sendCode()}
                disabled={sending || verifying || oauthBusy !== null}
                className="w-full rounded-xl bg-[#4c6fff] py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(76,111,255,0.25)] transition hover:brightness-110 disabled:opacity-60"
              >
                {sending ? "Envoi du code..." : "Envoyer le code"}
              </button>

              {confirmationResult && (
                <>
                  <div className="h-px bg-slate-200" />

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Code OTP
                    </label>
                    <input
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center font-mono text-lg tracking-widest text-[#10172b] placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[rgba(76,111,255,0.25)] disabled:opacity-60"
                      placeholder="000000"
                      inputMode="numeric"
                      disabled={verifying || oauthBusy !== null}
                    />
                  </div>

                  <button
                    onClick={() => void verifyCode()}
                    disabled={sending || verifying || oauthBusy !== null}
                    className="w-full rounded-xl border border-[#4c6fff] bg-white py-3 text-sm font-semibold text-[#4c6fff] transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    {verifying ? "Vérification…" : "Vérifier puis se connecter"}
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              {!apiConfigured ? (
                <div className="rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  Configuration API manquante : définissez NEXT_PUBLIC_API_URL (ex.{" "}
                  https://ton-backend.onrender.com/api), puis redéployez le frontend.
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  setTab("phone");
                  setStatus("");
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#10172b] hover:bg-slate-50"
              >
                Continuer avec téléphone (code SMS)
              </button>

              {authMode === "register" ? (
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#10172b] placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[rgba(76,111,255,0.25)] disabled:opacity-60"
                  placeholder="Nom (optionnel)"
                  disabled={emailFormDisabled}
                />
              ) : null}

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#10172b] placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[rgba(76,111,255,0.25)] disabled:opacity-60"
                placeholder="Adresse e-mail"
                inputMode="email"
                autoComplete="email"
                disabled={emailFormDisabled}
              />

              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#10172b] placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[rgba(76,111,255,0.25)] disabled:opacity-60"
                placeholder="Mot de passe"
                type="password"
                autoComplete={authMode === "login" ? "current-password" : "new-password"}
                disabled={emailFormDisabled}
              />

              {authMode === "register" ? (
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#10172b] placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[rgba(76,111,255,0.25)] disabled:opacity-60"
                  placeholder="Confirmer le mot de passe (8 caractères min)"
                  type="password"
                  autoComplete="new-password"
                  disabled={emailFormDisabled}
                />
              ) : null}

              <button
                type="button"
                onClick={() => void submitEmailAuth()}
                disabled={emailFormDisabled || !canSubmitEmail}
                className="w-full rounded-xl bg-[#4c6fff] py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(76,111,255,0.25)] transition hover:brightness-110 disabled:opacity-50"
              >
                {submittingEmail
                  ? "Veuillez patienter..."
                  : authMode === "login"
                    ? "Se connecter"
                    : "S’inscrire"}
              </button>

              {authMode === "register" ? (
                <p className="pt-1 text-[11px] leading-relaxed text-slate-600">
                  En t’inscrivant, tu acceptes nos{" "}
                  <Link className="text-slate-900 underline underline-offset-2" href="/legal/terms">
                    conditions
                  </Link>{" "}
                  et notre{" "}
                  <Link className="text-slate-900 underline underline-offset-2" href="/legal/privacy">
                    politique de confidentialité
                  </Link>
                  .
                </p>
              ) : authMode === "login" ? (
                <p className="pt-1 text-[11px] leading-relaxed text-slate-500">
                  En continuant, tu acceptes nos{" "}
                  <Link className="text-slate-800 underline underline-offset-2" href="/legal/terms">
                    conditions
                  </Link>{" "}
                  et notre{" "}
                  <Link className="text-slate-800 underline underline-offset-2" href="/legal/privacy">
                    politique de confidentialité
                  </Link>
                  .
                </p>
              ) : null}
            </>
          )}

          {status && (
            <div
              className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                statusType === "success" ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {status}
            </div>
          )}

          <div id="recaptcha-container" style={{ display: "none" }} />
              </div>

              <div
                className={`mt-3 flex items-center text-xs ${
                  tab === "email" && authMode === "login" ? "justify-between" : "justify-end"
                }`}
              >
                {tab === "email" && authMode === "login" ? (
                  <Link
                    href="/auth/forgot-password"
                    className="text-slate-600 hover:text-slate-900 underline underline-offset-2"
                  >
                    Mot de passe oublié ?
                  </Link>
                ) : null}
                <Link href="/legal/privacy" className="text-slate-500 hover:text-slate-800 underline underline-offset-2">
                  Confidentialité
                </Link>
              </div>
            </div>

            <div className="mt-3 rounded-3xl border border-white/10 bg-black/20 p-4 text-center text-sm text-slate-200">
              {authMode === "login" ? (
                <>
                  Pas de compte ?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setStatus("");
                    }}
                    className="font-semibold text-white underline underline-offset-2"
                  >
                    Inscris-toi
                  </button>
                </>
              ) : (
                <>
                  Tu as déjà un compte ?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setStatus("");
                    }}
                    className="font-semibold text-white underline underline-offset-2"
                  >
                    Connecte-toi
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { User } from "firebase/auth";
import {
  GoogleAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  type ApplicationVerifier,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile
} from "firebase/auth";
import { getFirebaseAuth } from "../../nextalkfirebase";
import { apiPostAuthWithResilience, prewarmClientApiBase } from "../../lib/nextalkapi";
import { isLoggedIn, storeSession } from "../../lib/nextalksession";
import {
  FIREBASE_CONFIGURED,
  firebaseAuthUserMessage,
  formatPhoneInput,
  sanitizeNextPath
} from "../../lib/nextalkfirebaseauthshared";
import { AnimatedBackground } from "./AnimatedBackground";
import { AuthCard } from "./AuthCard";
import { GlassInput } from "./GlassInput";

type GatewayStep = "intro" | "gateway";

type AuthIntent = "login" | "register";

type PhoneConfirmation = { confirm: (code: string) => Promise<{ user: User }> };

const titleLetters = "SOL0LA".split("");

function getOrCreateRecaptchaVerifier(authInstance: NonNullable<ReturnType<typeof getFirebaseAuth>>): ApplicationVerifier | undefined {
  try {
    if ((window as unknown as { recaptchaVerifier?: ApplicationVerifier }).recaptchaVerifier) {
      return (window as unknown as { recaptchaVerifier: ApplicationVerifier }).recaptchaVerifier;
    }
    const verifier = new RecaptchaVerifier(authInstance, "recaptcha-container", {
      size: "invisible",
      callback: () => {},
      "error-callback": () => {}
    });
    (window as unknown as { recaptchaVerifier: ApplicationVerifier }).recaptchaVerifier = verifier;
    return verifier;
  } catch {
    return undefined;
  }
}

export function MainPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams.get("next"));
  const registerFromUrl = searchParams.get("register") === "1";

  const firebaseAuth = useMemo(() => {
    if (typeof window === "undefined" || !FIREBASE_CONFIGURED) return null;
    try {
      return getFirebaseAuth();
    } catch {
      return null;
    }
  }, []);

  const [step, setStep] = useState<GatewayStep>("intro");
  const [intent, setIntent] = useState<AuthIntent>("login");
  const [oauthBusy, setOauthBusy] = useState<null | "google" | "apple">(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [showEmailPw, setShowEmailPw] = useState(false);
  const [showEmailPw2, setShowEmailPw2] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+243");
  const [otpCode, setOtpCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<PhoneConfirmation | null>(null);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"error" | "success">("success");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace(nextPath);
    }
  }, [router, nextPath]);

  useEffect(() => {
    const paramError = searchParams.get("error");
    if (paramError?.trim()) {
      setStatus(paramError.trim());
      setStatusType("error");
      setStep("gateway");
    }
  }, [searchParams]);

  useEffect(() => {
    if (registerFromUrl) {
      setIntent("register");
      setStep("gateway");
    }
  }, [registerFromUrl]);

  useEffect(() => {
    void prewarmClientApiBase();
  }, []);

  const oauthDisabled =
    !FIREBASE_CONFIGURED ||
    oauthBusy !== null ||
    sending ||
    verifying ||
    emailBusy;
  const phoneBusy = oauthBusy !== null || emailBusy;

  function resolveDisplayNameForBackend(firebaseUser: User): string | undefined {
    const extra = profileDisplayName.trim();
    if (intent === "register" && extra) return extra;
    return firebaseUser.displayName ?? undefined;
  }

  const finishFirebaseUserSession = async (firebaseUser: User): Promise<boolean> => {
    try {
      const idToken = await firebaseUser.getIdToken(true);
      const backend = await apiPostAuthWithResilience("/auth/firebase/verify", {
        idToken,
        displayName: resolveDisplayNameForBackend(firebaseUser)
      });
      storeSession({
        accessToken: backend.data.tokens.accessToken,
        refreshToken: backend.data.tokens.refreshToken,
        user: backend.data.user
      });
      setStatusType("success");
      setStatus(intent === "register" ? "Inscription réussie." : "Connexion réussie.");
      router.replace(nextPath);
      return true;
    } catch (error: unknown) {
      try {
        const a = firebaseAuth ?? getFirebaseAuth();
        await signOut(a);
      } catch {
        /* ignore */
      }
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
            "Le serveur n’a pas pu valider la session Firebase. Réessaie."
        );
      }
      setStatusType("error");
      return false;
    }
  };

  const signInWithGooglePopup = async () => {
    if (!FIREBASE_CONFIGURED || !firebaseAuth) return;
    setOauthBusy("google");
    setStatus("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const cred = await signInWithPopup(firebaseAuth, provider);
      await finishFirebaseUserSession(cred.user);
    } catch (error: unknown) {
      setStatus(firebaseAuthUserMessage(error));
      setStatusType("error");
    } finally {
      setOauthBusy(null);
    }
  };

  const signInWithApplePopup = async () => {
    if (!FIREBASE_CONFIGURED || !firebaseAuth) return;
    setOauthBusy("apple");
    setStatus("");
    try {
      const provider = new OAuthProvider("apple.com");
      provider.addScope("email");
      provider.addScope("name");
      const cred = await signInWithPopup(firebaseAuth, provider);
      await finishFirebaseUserSession(cred.user);
    } catch (error: unknown) {
      setStatus(firebaseAuthUserMessage(error));
      setStatusType("error");
    } finally {
      setOauthBusy(null);
    }
  };

  const sendCode = async () => {
    if (!firebaseAuth) {
      setStatus("Configuration Firebase incomplète.");
      setStatusType("error");
      return;
    }
    try {
      setSending(true);
      setStatus("");
      const normalizedPhone = formatPhoneInput(phoneNumber.trim());
      const verifier = getOrCreateRecaptchaVerifier(firebaseAuth);
      if (!verifier) {
        setStatus("reCAPTCHA indisponible. Rechargez la page puis réessayez.");
        setStatusType("error");
        return;
      }
      const confirmation = await signInWithPhoneNumber(firebaseAuth, normalizedPhone, verifier);
      setConfirmationResult(confirmation as PhoneConfirmation);
      setStatusType("success");
      setStatus(`Code SMS envoyé au numéro ${normalizedPhone}.`);
    } catch (error: unknown) {
      setStatus(firebaseAuthUserMessage(error));
      setStatusType("error");
      try {
        const verifier = (window as unknown as { recaptchaVerifier?: { clear?: () => void } })
          .recaptchaVerifier;
        if (verifier?.clear) await verifier.clear();
      } catch {
        /* ignore */
      }
      (window as unknown as { recaptchaVerifier?: null }).recaptchaVerifier = null;
    } finally {
      setSending(false);
    }
  };

  const verifyCode = async () => {
    if (!confirmationResult) {
      setStatus("Demande d’abord le code SMS.");
      setStatusType("error");
      return;
    }
    if (otpCode.trim().length < 6) {
      setStatus("Entre le code à 6 chiffres.");
      setStatusType("error");
      return;
    }
    try {
      setVerifying(true);
      setStatus("");
      const credential = await confirmationResult.confirm(otpCode.trim());
      await finishFirebaseUserSession(credential.user);
    } catch (error: unknown) {
      const e = error as {
        code?: string;
        message?: string;
        response?: { data?: { message?: string } };
      };
      if (typeof e?.code === "string" && e.code.startsWith("auth/")) {
        setStatus(firebaseAuthUserMessage(error));
      } else {
        setStatus(
          e?.response?.data?.message ?? e?.message ?? firebaseAuthUserMessage(error)
        );
      }
      setStatusType("error");
    } finally {
      setVerifying(false);
    }
  };

  const submitEmailPassword = async () => {
    if (!FIREBASE_CONFIGURED || !firebaseAuth) return;
    const email = emailValue.trim().toLowerCase();
    if (!email || !passwordValue) {
      setStatus("Renseigne l’e-mail et le mot de passe.");
      setStatusType("error");
      return;
    }
    if (intent === "register") {
      if (passwordValue.length < 6) {
        setStatus("Le mot de passe doit contenir au moins 6 caractères.");
        setStatusType("error");
        return;
      }
      if (passwordValue !== passwordConfirm) {
        setStatus("Les deux mots de passe ne correspondent pas.");
        setStatusType("error");
        return;
      }
    }
    setEmailBusy(true);
    setStatus("");
    try {
      if (intent === "register") {
        const cred = await createUserWithEmailAndPassword(firebaseAuth, email, passwordValue);
        const name = profileDisplayName.trim();
        if (name) {
          await updateProfile(cred.user, { displayName: name });
          await cred.user.reload();
        }
        await finishFirebaseUserSession(cred.user);
      } else {
        const cred = await signInWithEmailAndPassword(firebaseAuth, email, passwordValue);
        await finishFirebaseUserSession(cred.user);
      }
    } catch (error: unknown) {
      setStatus(firebaseAuthUserMessage(error));
      setStatusType("error");
    } finally {
      setEmailBusy(false);
    }
  };

  return (
    <main className="relative min-h-[100svh] overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 flex min-h-[100svh] items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {step === "intro" ? (
            <motion.section
              key="intro"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.03 }}
              transition={{ duration: 0.45 }}
              className="text-center"
            >
              <div className="mb-6 flex justify-center gap-1">
                {titleLetters.map((char, index) => (
                  <motion.span
                    key={`${char}-${index}`}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.09, duration: 0.35 }}
                    className="font-heading text-5xl font-extrabold text-white sm:text-7xl"
                    style={{ textShadow: "0 0 24px rgba(0, 209, 255, 0.65)" }}
                  >
                    {char}
                  </motion.span>
                ))}
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-lg text-slate-200"
              >
                Connecter. Ressentir. Exister.
              </motion.p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setStep("gateway");
                    setIntent("login");
                    setStatus("");
                  }}
                  className="btn-neon rounded-2xl px-6 py-3 text-sm font-semibold text-white"
                >
                  Entrer dans Solola
                </motion.button>
                <Link
                  href="/auth?register=1"
                  className="text-sm font-medium text-cyan-300/90 underline decoration-cyan-500/50 underline-offset-4 transition hover:text-cyan-200"
                >
                  Créer un compte
                </Link>
              </div>
            </motion.section>
          ) : null}

          {step === "gateway" ? (
            <motion.div
              key="gateway"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="w-full max-w-lg"
            >
              <AuthCard
                title="Solola Gateway"
                subtitle={
                  intent === "register"
                    ? "Inscription Firebase : e-mail, Google, Apple ou SMS — ton compte Solola est créé au premier succès."
                    : "Connexion Firebase : e-mail, Google, Apple ou SMS."
                }
              >
                {!FIREBASE_CONFIGURED ? (
                  <p className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    Définis NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
                    NEXT_PUBLIC_FIREBASE_PROJECT_ID et NEXT_PUBLIC_FIREBASE_APP_ID, puis redémarre le serveur.
                  </p>
                ) : null}

                <div className="flex rounded-2xl border border-white/15 bg-black/25 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIntent("login");
                      setStatus("");
                    }}
                    className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      intent === "login"
                        ? "bg-white/15 text-white shadow-inner"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Connexion
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIntent("register");
                      setStatus("");
                    }}
                    className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      intent === "register"
                        ? "bg-white/15 text-white shadow-inner"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Inscription
                  </button>
                </div>

                {intent === "register" ? (
                  <GlassInput
                    label="Prénom ou pseudo (optionnel)"
                    type="text"
                    value={profileDisplayName}
                    onChange={(v) => setProfileDisplayName(v)}
                    placeholder="Ex. Alex"
                  />
                ) : null}

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={oauthDisabled}
                    onClick={() => void signInWithGooglePopup()}
                    className="w-full rounded-2xl border border-white/20 bg-white/[0.08] px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/[0.12] disabled:opacity-50"
                  >
                    {oauthBusy === "google"
                      ? "Patience…"
                      : intent === "register"
                        ? "S’inscrire avec Google"
                        : "Continuer avec Google"}
                  </button>
                  <button
                    type="button"
                    disabled={oauthDisabled}
                    onClick={() => void signInWithApplePopup()}
                    className="w-full rounded-2xl border border-white/25 bg-[#0a0a0f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-black/60 disabled:opacity-50"
                  >
                    {oauthBusy === "apple"
                      ? "Patience…"
                      : intent === "register"
                        ? "S’inscrire avec Apple"
                        : "Continuer avec Apple"}
                  </button>
                </div>

                <div className="my-2 flex items-center gap-3">
                  <span className="h-px flex-1 bg-white/15" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    ou e-mail
                  </span>
                  <span className="h-px flex-1 bg-white/15" />
                </div>

                <GlassInput
                  label="E-mail"
                  type="email"
                  value={emailValue}
                  onChange={(v) => setEmailValue(v)}
                  placeholder="toi@exemple.com"
                />
                <GlassInput
                  label="Mot de passe"
                  type="password"
                  value={passwordValue}
                  onChange={(v) => setPasswordValue(v)}
                  placeholder="••••••••"
                  showToggle
                  isVisible={showEmailPw}
                  onToggleVisibility={() => setShowEmailPw((x) => !x)}
                />
                {intent === "register" ? (
                  <GlassInput
                    label="Confirmer le mot de passe"
                    type="password"
                    value={passwordConfirm}
                    onChange={(v) => setPasswordConfirm(v)}
                    placeholder="••••••••"
                    showToggle
                    isVisible={showEmailPw2}
                    onToggleVisibility={() => setShowEmailPw2((x) => !x)}
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => void submitEmailPassword()}
                  disabled={!FIREBASE_CONFIGURED || emailBusy || oauthBusy !== null || sending || verifying}
                  className="w-full rounded-2xl border border-violet-400/40 bg-violet-500/15 px-4 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/25 disabled:opacity-50"
                >
                  {emailBusy
                    ? "Patience…"
                    : intent === "register"
                      ? "Créer mon compte avec l’e-mail"
                      : "Se connecter avec l’e-mail"}
                </button>

                <div className="my-2 flex items-center gap-3">
                  <span className="h-px flex-1 bg-white/15" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    ou SMS
                  </span>
                  <span className="h-px flex-1 bg-white/15" />
                </div>

                <GlassInput
                  label="Téléphone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(v) => setPhoneNumber(formatPhoneInput(v))}
                  placeholder="+243…"
                />
                <button
                  type="button"
                  onClick={() => void sendCode()}
                  disabled={sending || verifying || phoneBusy}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#00D1FF] to-[#6C5CE7] px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  {sending ? "Envoi du code…" : "Envoyer le code SMS"}
                </button>

                {confirmationResult ? (
                  <>
                    <GlassInput
                      label="Code à 6 chiffres"
                      type="text"
                      value={otpCode}
                      onChange={(v) => setOtpCode(v.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                    />
                    <button
                      type="button"
                      onClick={() => void verifyCode()}
                      disabled={sending || verifying || phoneBusy}
                      className="w-full rounded-2xl border border-cyan-400/50 bg-white/5 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-white/10 disabled:opacity-50"
                    >
                      {verifying
                        ? "Vérification…"
                        : intent === "register"
                          ? "Vérifier et terminer l’inscription"
                          : "Vérifier et se connecter"}
                    </button>
                  </>
                ) : null}

                {status ? (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl px-3 py-2 text-xs ${
                      statusType === "success"
                        ? "border border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                        : "border border-rose-400/50 bg-rose-500/10 text-rose-200"
                    }`}
                  >
                    {status}
                  </motion.p>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("intro");
                      setStatus("");
                      setConfirmationResult(null);
                      setOtpCode("");
                    }}
                    className="text-slate-300 hover:text-white"
                  >
                    Retour
                  </button>
                  <Link href="/legal/privacy" className="text-cyan-300/80 hover:text-cyan-200">
                    Confidentialité
                  </Link>
                </div>

                <p className="text-[11px] leading-relaxed text-slate-500">
                  En continuant, tu acceptes nos{" "}
                  <Link className="text-cyan-300 underline underline-offset-2" href="/legal/terms">
                    conditions
                  </Link>{" "}
                  et notre{" "}
                  <Link className="text-cyan-300 underline underline-offset-2" href="/legal/privacy">
                    politique de confidentialité
                  </Link>
                  .
                </p>

                <div id="recaptcha-container" className="hidden" />
              </AuthCard>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}

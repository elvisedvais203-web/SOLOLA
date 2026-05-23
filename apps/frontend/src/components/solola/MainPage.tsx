"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile,
  onAuthStateChanged
} from "firebase/auth";
import { getFirebaseAuth } from "../../nextalkfirebase";
import { apiPostAuthWithResilience, isAxiosNetworkError, prewarmClientApiBase } from "../../lib/nextalkapi";
import { isLoggedIn, storeSession } from "../../lib/nextalksession";
import {
  FIREBASE_CONFIGURED,
  firebaseAuthUserMessage,
  formatPhoneInput,
  sanitizeNextPath
} from "../../lib/nextalkfirebaseauthshared";
import { AnimatedBackground } from "./AnimatedBackground";
import { AuthCard, AuthChannelTabs, AuthOAuthButton, AuthPrimaryButton, AuthSegment, AuthStatusBanner } from "./AuthCard";
import { BackendEmailPanel } from "../auth/BackendEmailPanel";
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
  const [resetBusy, setResetBusy] = useState(false);
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
  const [authChannel, setAuthChannel] = useState<"social" | "email" | "phone">(FIREBASE_CONFIGURED ? "social" : "email");

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
    emailBusy ||
    resetBusy;
  const phoneBusy = oauthBusy !== null || emailBusy || resetBusy;

  const finishFirebaseUserSession = useCallback(
    async (firebaseUser: User, options?: { silent?: boolean }): Promise<boolean> => {
      try {
        const extra = profileDisplayName.trim();
        const displayName =
          intent === "register" && extra ? extra : firebaseUser.displayName ?? undefined;

        const idToken = await firebaseUser.getIdToken(true);
        const backend = await apiPostAuthWithResilience("/auth/firebase/verify", {
          idToken,
          displayName
        });
        storeSession({
          accessToken: backend.data.tokens.accessToken,
          refreshToken: backend.data.tokens.refreshToken,
          user: backend.data.user
        });
        if (!options?.silent) {
          setStatusType("success");
          setStatus(intent === "register" ? "Inscription réussie." : "Connexion réussie.");
        }
        router.replace(nextPath);
        return true;
      } catch (error: unknown) {
        const ax = error as {
          code?: string;
          message?: string;
          response?: { status?: number; data?: { message?: string } };
        };
        const status = ax?.response?.status;
        const dataMsg = ax?.response?.data?.message;
        const networkFail = isAxiosNetworkError(error) || (status !== undefined && status >= 500);
        /** Ne déconnecte Firebase que si le jeton est refusé — pas en cas de panne réseau / API. */
        const shouldSignOutFirebase = status === 401 || status === 400;

        if (shouldSignOutFirebase) {
          try {
            const a = firebaseAuth ?? getFirebaseAuth();
            await signOut(a);
          } catch {
            /* ignore */
          }
        }

        let msg =
          (typeof dataMsg === "string" && dataMsg) ||
          ax?.message ||
          "Le serveur n’a pas pu valider la session Firebase.";

        if (typeof ax?.code === "string" && ax.code.startsWith("auth/")) {
          msg = firebaseAuthUserMessage(error);
        } else if (networkFail) {
          msg =
            "L’API Solola est injoignable ou en veille. Firebase t’a bien reconnu, mais il faut que le backend valide la connexion pour ouvrir l’accueil. Vérifie que le service API (ex. Render) est démarré et que le frontend a API_PROXY_TARGET ou BACKEND_URL vers la même URL que ton API. Réessaie dans un instant — une nouvelle tentative peut se faire automatiquement.";
        } else if (
          status === 500 &&
          typeof dataMsg === "string" &&
          /firebase|admin|configuration/i.test(dataMsg)
        ) {
          msg =
            "Le backend ne peut pas vérifier les jetons Firebase : renseigne FIREBASE_SERVICE_ACCOUNT_JSON (ou FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY) sur le serveur API avec le même projet Firebase que l’app web.";
        }

        setStatus(msg);
        setStatusType("error");
        return false;
      }
    },
    [intent, profileDisplayName, nextPath, router, firebaseAuth]
  );

  /** Si Firebase garde une session mais les JWT applicatifs ont été perdus, on récupère la session. */
  useEffect(() => {
    if (!firebaseAuth || !FIREBASE_CONFIGURED) return;
    const unsub = onAuthStateChanged(firebaseAuth, (user) => {
      if (!user || isLoggedIn()) return;
      void finishFirebaseUserSession(user, { silent: true });
    });
    return () => unsub();
  }, [firebaseAuth, finishFirebaseUserSession]);

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

  const sendPasswordReset = async () => {
    if (!FIREBASE_CONFIGURED || !firebaseAuth) return;
    const email = emailValue.trim().toLowerCase();
    if (!email) {
      setStatus("Indique d’abord ton adresse e-mail dans le champ ci-dessus.");
      setStatusType("error");
      return;
    }
    setResetBusy(true);
    setStatus("");
    try {
      await sendPasswordResetEmail(firebaseAuth, email, {
        url: `${window.location.origin}/auth`,
        handleCodeInApp: false
      });
      setStatusType("success");
      setStatus(
        "Si cette adresse correspond à un compte, tu recevras un e-mail avec un lien pour définir un nouveau mot de passe. Pense à vérifier les courriers indésirables."
      );
    } catch (error: unknown) {
      setStatus(firebaseAuthUserMessage(error));
      setStatusType("error");
    } finally {
      setResetBusy(false);
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
              className="flex max-w-md flex-col items-center text-center"
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/5 shadow-[0_0_48px_rgba(0,209,255,0.25)]">
                <span className="font-heading text-3xl font-bold text-white">S</span>
              </div>
              <div className="mb-4 flex justify-center gap-0.5">
                {titleLetters.map((char, index) => (
                  <motion.span
                    key={`${char}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.07, duration: 0.35 }}
                    className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-6xl"
                  >
                    {char}
                  </motion.span>
                ))}
              </div>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="text-base text-slate-400">
                Parler. Partager. Rester connecte.
              </motion.p>
              <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setStep("gateway");
                    setIntent("login");
                    setStatus("");
                  }}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
                >
                  Commencer
                </motion.button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("gateway");
                    setIntent("register");
                    setStatus("");
                  }}
                  className="w-full rounded-2xl border border-white/15 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                >
                  Creer un compte
                </button>
              </div>
            </motion.section>
          ) : null}

          {step === "gateway" ? (
            <motion.div
              key="gateway"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="w-full max-w-[420px]"
            >
              <AuthCard
                title={intent === "register" ? "Creer ton compte" : "Bon retour"}
                subtitle={
                  intent === "register"
                    ? "Rejoins Solola en quelques secondes. Tes contenus, messages et stories au meme endroit."
                    : "Connecte-toi pour retrouver ton fil, tes messages et tes proches."
                }
              >
                <AuthSegment
                  value={intent}
                  onChange={(id) => {
                    setIntent(id as AuthIntent);
                    setStatus("");
                  }}
                  options={[
                    { id: "login", label: "Connexion" },
                    { id: "register", label: "Inscription" }
                  ]}
                />

                <AuthChannelTabs
                  value={authChannel}
                  onChange={setAuthChannel}
                  showSocial={FIREBASE_CONFIGURED}
                  showPhone={FIREBASE_CONFIGURED}
                />

                {authChannel === "social" && FIREBASE_CONFIGURED ? (
                  <div className="space-y-3">
                    <AuthOAuthButton
                      provider="google"
                      label={intent === "register" ? "S'inscrire avec Google" : "Continuer avec Google"}
                      disabled={oauthDisabled}
                      busy={oauthBusy === "google"}
                      onClick={() => void signInWithGooglePopup()}
                    />
                    <AuthOAuthButton
                      provider="apple"
                      label={intent === "register" ? "S'inscrire avec Apple" : "Continuer avec Apple"}
                      disabled={oauthDisabled}
                      busy={oauthBusy === "apple"}
                      onClick={() => void signInWithApplePopup()}
                    />
                  </div>
                ) : null}

                {authChannel === "email" ? (
                  FIREBASE_CONFIGURED ? (
                    <div className="space-y-3">
                      {intent === "register" ? (
                        <GlassInput
                          label="Nom affiche"
                          type="text"
                          value={profileDisplayName}
                          onChange={(v) => setProfileDisplayName(v)}
                          placeholder="Optionnel"
                        />
                      ) : null}
                      <GlassInput label="Adresse e-mail" type="email" value={emailValue} onChange={(v) => setEmailValue(v)} placeholder="toi@exemple.com" />
                      <GlassInput
                        label="Mot de passe"
                        type="password"
                        value={passwordValue}
                        onChange={(v) => setPasswordValue(v)}
                        placeholder="8 caracteres minimum"
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
                          placeholder="Repete le mot de passe"
                          showToggle
                          isVisible={showEmailPw2}
                          onToggleVisibility={() => setShowEmailPw2((x) => !x)}
                        />
                      ) : null}
                      {intent === "login" ? (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => void sendPasswordReset()}
                            disabled={resetBusy || oauthBusy !== null || sending || verifying}
                            className="text-sm font-medium text-cyan-400/90 hover:text-cyan-300 disabled:opacity-40"
                          >
                            {resetBusy ? "Envoi…" : "Mot de passe oublie ?"}
                          </button>
                        </div>
                      ) : null}
                      <AuthPrimaryButton disabled={emailBusy || oauthBusy !== null || sending || verifying} onClick={() => void submitEmailPassword()}>
                        {emailBusy ? "Patience…" : intent === "register" ? "Creer mon compte" : "Se connecter"}
                      </AuthPrimaryButton>
                    </div>
                  ) : (
                    <BackendEmailPanel nextPath={nextPath} intent={intent} onStatus={(message, type) => { setStatus(message); setStatusType(type); }} />
                  )
                ) : null}

                {authChannel === "phone" && FIREBASE_CONFIGURED ? (
                  <div className="space-y-3">
                    <GlassInput label="Numero de telephone" type="tel" value={phoneNumber} onChange={(v) => setPhoneNumber(formatPhoneInput(v))} placeholder="+243 8XX XXX XXX" />
                    <AuthPrimaryButton disabled={sending || verifying || phoneBusy} onClick={() => void sendCode()}>
                      {sending ? "Envoi du code…" : "Recevoir un code SMS"}
                    </AuthPrimaryButton>
                    {confirmationResult ? (
                      <>
                        <GlassInput label="Code recu" type="text" value={otpCode} onChange={(v) => setOtpCode(v.replace(/\D/g, "").slice(0, 6))} placeholder="6 chiffres" />
                        <AuthPrimaryButton variant="outline" disabled={sending || verifying || phoneBusy} onClick={() => void verifyCode()}>
                          {verifying ? "Verification…" : intent === "register" ? "Terminer l inscription" : "Se connecter"}
                        </AuthPrimaryButton>
                      </>
                    ) : null}
                  </div>
                ) : null}

                {status ? <AuthStatusBanner type={statusType} message={status} /> : null}

                <div className="flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("intro");
                      setStatus("");
                      setConfirmationResult(null);
                      setOtpCode("");
                    }}
                    className="font-medium text-slate-400 transition hover:text-white"
                  >
                    Retour
                  </button>
                  <Link href="/legal/privacy" className="font-medium text-slate-400 transition hover:text-cyan-300">
                    Confidentialite
                  </Link>
                </div>

                <p className="text-center text-[11px] leading-relaxed text-slate-600">
                  En continuant, tu acceptes nos{" "}
                  <Link className="text-slate-400 underline underline-offset-2 hover:text-white" href="/legal/terms">
                    conditions
                  </Link>{" "}
                  et notre{" "}
                  <Link className="text-slate-400 underline underline-offset-2 hover:text-white" href="/legal/privacy">
                    politique de confidentialite
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

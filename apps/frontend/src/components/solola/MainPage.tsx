"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatedBackground } from "./AnimatedBackground";
import { AuthCard } from "./AuthCard";
import { GlassInput } from "./GlassInput";
import { apiPostAuthWithResilience } from "../../lib/nextalkapi";
import { storeSession } from "../../lib/nextalksession";
import type { AppUser } from "../../lib/nextalksession";

type GatewayStep = "intro" | "choice" | "login" | "signup";

const titleLetters = "SOL0LA".split("");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeNextPath(raw: string | null): string {
  const fallback = "/dashboard";
  if (raw == null || typeof raw !== "string") return fallback;
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return fallback;
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(t)) return fallback;
  return t;
}

export function MainPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams.get("next"));

  const [step, setStep] = useState<GatewayStep>("intro");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState<"error" | "success">("success");
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(
    () => ({
      email: email.length > 0 && !emailRegex.test(email) ? "Email invalide" : "",
      password: password.length > 0 && password.length < 8 ? "8 caractères minimum" : "",
      firstName: step === "signup" && firstName.length > 0 && firstName.trim().length < 2 ? "Prénom trop court" : "",
      lastName: step === "signup" && lastName.length > 0 && lastName.trim().length < 2 ? "Nom trop court" : ""
    }),
    [email, password, firstName, lastName, step]
  );

  const canLogin = emailRegex.test(email) && password.length >= 8;
  const canSignup =
    emailRegex.test(email) &&
    password.length >= 8 &&
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2;

  const submit = async () => {
    setStatus("");
    if (step === "login") {
      if (!canLogin) return;
      try {
        setSubmitting(true);
        const resp = await apiPostAuthWithResilience("/auth/email/login", {
          email: email.trim(),
          password
        });
        storeSession({
          accessToken: resp.data.tokens.accessToken,
          refreshToken: resp.data.tokens.refreshToken,
          user: resp.data.user as AppUser
        });
        setStatusType("success");
        setStatus("Connexion réussie.");
        router.replace(nextPath);
      } catch (error: unknown) {
        const e = error as { response?: { data?: { message?: string } }; message?: string };
        setStatusType("error");
        setStatus(e?.response?.data?.message ?? e?.message ?? "Connexion impossible.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (step === "signup") {
      if (!canSignup) return;
      try {
        setSubmitting(true);
        const resp = await apiPostAuthWithResilience("/auth/email/register", {
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim()
        });
        storeSession({
          accessToken: resp.data.tokens.accessToken,
          refreshToken: resp.data.tokens.refreshToken,
          user: resp.data.user as AppUser
        });
        setStatusType("success");
        setStatus("Compte créé. Bienvenue sur Solola !");
        router.replace(nextPath);
      } catch (error: unknown) {
        const e = error as { response?: { data?: { message?: string } }; message?: string };
        setStatusType("error");
        setStatus(e?.response?.data?.message ?? e?.message ?? "Inscription impossible.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const welcomeHint =
    step === "login"
      ? "Connecte-toi avec ton e-mail et ton mot de passe."
      : "Inscription : prénom et nom obligatoires pour personnaliser ton accueil.";

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
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep("choice")}
                className="btn-neon mt-8 rounded-2xl px-6 py-3 text-sm font-semibold text-white"
              >
                Entrer dans Solola
              </motion.button>
            </motion.section>
          ) : null}

          {step === "choice" ? (
            <motion.section
              key="choice"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="grid w-full max-w-4xl gap-4 md:grid-cols-2"
            >
              {[
                { id: "login", title: "Se connecter", subtitle: "Retrouve ton univers Solola." },
                { id: "signup", title: "Créer un compte", subtitle: "Commence ton histoire Solola." }
              ].map((card) => (
                <motion.button
                  key={card.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setStep(card.id as GatewayStep);
                    setStatus("");
                  }}
                  className="rounded-3xl border border-white/15 bg-white/[0.04] p-7 text-left shadow-[0_0_48px_rgba(108,92,231,0.15)] backdrop-blur-xl transition hover:border-cyan-300/40"
                >
                  <h3 className="font-heading text-2xl font-bold text-white">{card.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{card.subtitle}</p>
                </motion.button>
              ))}
            </motion.section>
          ) : null}

          {step === "login" || step === "signup" ? (
            <div key={step} className="w-full max-w-lg">
              <AuthCard
                title={step === "login" ? "Bon retour 👋" : "Rejoins Solola"}
                subtitle={welcomeHint}
              >
                {step === "signup" ? (
                  <>
                    <GlassInput
                      label="Prénom"
                      type="text"
                      value={firstName}
                      onChange={setFirstName}
                      placeholder="Ex. Edvais"
                      error={errors.firstName}
                    />
                    <GlassInput
                      label="Nom"
                      type="text"
                      value={lastName}
                      onChange={setLastName}
                      placeholder="Ex. Makina"
                      error={errors.lastName}
                    />
                  </>
                ) : null}
                <GlassInput
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="elvisedvais203@gmail.com"
                  error={errors.email}
                />
                <GlassInput
                  label="Mot de passe"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  error={errors.password}
                  showToggle
                  isVisible={showPassword}
                  onToggleVisibility={() => setShowPassword((prev) => !prev)}
                />
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={submitting || (step === "login" ? !canLogin : !canSignup)}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#00D1FF] to-[#6C5CE7] px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? "Patientez…" : step === "login" ? "Se connecter" : "Créer un compte"}
                </button>
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
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <button type="button" onClick={() => setStep("choice")} className="text-slate-300 hover:text-white">
                    Retour
                  </button>
                  <Link href="/auth/forgot-password" className="text-cyan-300 hover:text-cyan-200">
                    Mot de passe oublié ?
                  </Link>
                </div>
              </AuthCard>
            </div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}

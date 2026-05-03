"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AnimatedBackground } from "./AnimatedBackground";
import { AuthCard } from "./AuthCard";
import { GlassInput } from "./GlassInput";

type GatewayStep = "intro" | "choice" | "login" | "signup";

const titleLetters = "SOL0LA".split("");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function MainPage() {
  const [step, setStep] = useState<GatewayStep>("intro");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(
    () => ({
      email: email.length > 0 && !emailRegex.test(email) ? "Email invalide" : "",
      password: password.length > 0 && password.length < 8 ? "8 caractères minimum" : ""
    }),
    [email, password]
  );

  const canSubmit = emailRegex.test(email) && password.length >= 8;

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
                  onClick={() => setStep(card.id as GatewayStep)}
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
                subtitle={step === "login" ? "Bienvenue Elvis 👋" : "Bienvenue Elvis 👋, ton portail t'attend."}
              >
                <GlassInput
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="elvis@solola.app"
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
                  onClick={() => setSubmitted(true)}
                  disabled={!canSubmit}
                  className="w-full rounded-2xl bg-gradient-to-r from-[#00D1FF] to-[#6C5CE7] px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  {step === "login" ? "Se connecter" : "Créer un compte"}
                </button>
                {submitted && canSubmit ? (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200"
                  >
                    Connexion prête. Branche ton backend pour finaliser l'auth réelle.
                  </motion.p>
                ) : null}
                <div className="flex items-center justify-between text-xs">
                  <button onClick={() => setStep("choice")} className="text-slate-300 hover:text-white">
                    Retour
                  </button>
                  <a href="/auth/forgot-password" className="text-cyan-300 hover:text-cyan-200">
                    Mot de passe oublié ?
                  </a>
                </div>
              </AuthCard>
            </div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}

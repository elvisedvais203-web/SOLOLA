"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { AnimatedBackground } from "./AnimatedBackground";
import { AuthCard } from "./AuthCard";
import { GlassInput } from "./GlassInput";
import { GatewayHeader } from "./GatewayHeader";

export type AuthStep = "intro" | "choice" | "login" | "signup";

const DISPLAY_NAME = "Elvis";
const SOUND_KEY = "solola-gateway-sound";
const AUTH_KEY = "solola-gateway-auth";
const EMAIL_KEY = "solola-gateway-email";

function playClickSound() {
  if (typeof window === "undefined") return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.055, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
    void ctx.resume?.();
  } catch {
    /* ignore */
  }
}

function validateEmail(v: string) {
  if (!v.trim()) return "Email requis";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Email invalide";
  return "";
}

function validatePasswordLogin(v: string) {
  if (!v) return "Mot de passe requis";
  if (v.length < 6) return "Au moins 6 caractères";
  return "";
}

function validatePasswordSignup(v: string) {
  if (!v) return "Mot de passe requis";
  if (v.length < 8) return "Au moins 8 caractères pour l’inscription";
  if (!/[A-Za-z]/.test(v) || !/[0-9]/.test(v))
    return "Combine lettres et chiffres";
  return "";
}

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d="M4 6h16v12H4z" strokeLinejoin="round" />
    <path d="m4 7 8 6 8-6" strokeLinecap="round" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4 4" />
    <path d="M9.9 5.1A10.4 10.4 0 0 1 12 5c6 0 10 7 10 7a18.7 18.7 0 0 1-5 5.3M6.2 6.2A18.7 18.7 0 0 0 2 12s4 7 10 7a9.8 9.8 0 0 0 4.2-.9" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden className="text-emerald-400">
    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LoginCardIcon = () => (
  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#00D1FF]/25 bg-[#00D1FF]/10 text-[#00D1FF] shadow-[0_0_28px_rgba(0,209,255,0.2)]" aria-hidden>
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

const SignupCardIcon = () => (
  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#6C5CE7]/30 bg-[#6C5CE7]/12 text-[#B8AEFF] shadow-[0_0_28px_rgba(108,92,231,0.25)]" aria-hidden>
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M20 8v6M23 11h-6" strokeLinecap="round" />
    </svg>
  </span>
);

const introTitle = "SOL0LA";
const introTag = "Connecter. Ressentir. Exister.";

const choiceSection = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.11, delayChildren: 0.04 },
  },
};

const choiceBlock = (reduce: boolean | null) => ({
  hidden: { opacity: 0, y: reduce ? 8 : 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 34 },
  },
});

const choiceGrid = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.02 },
  },
};

export function MainPage() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [step, setStep] = useState<AuthStep>("intro");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SOUND_KEY) === "0") setSoundOn(false);
    } catch {
      /* ignore */
    }
  }, []);

  const mode = step === "signup" ? "signup" : "login";

  const emailError = useMemo(() => {
    if (!email) return touched.email ? validateEmail(email) : "";
    return validateEmail(email);
  }, [email, touched.email]);

  const passwordError = useMemo(() => {
    if (!password)
      return touched.password
        ? mode === "signup"
          ? validatePasswordSignup(password)
          : validatePasswordLogin(password)
        : "";
    return mode === "signup"
      ? validatePasswordSignup(password)
      : validatePasswordLogin(password);
  }, [password, touched.password, mode]);

  const emailOk = Boolean(email && validateEmail(email) === "");
  const pwOk = Boolean(
    password &&
      (mode === "signup"
        ? validatePasswordSignup(password)
        : validatePasswordLogin(password)) === "",
  );

  const withSound = useCallback(
    (fn: () => void) => {
      if (soundOn) playClickSound();
      fn();
    },
    [soundOn],
  );

  const toggleSound = useCallback(() => {
    setSoundOn((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem(SOUND_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    const eErr = validateEmail(email);
    const pErr =
      mode === "signup" ? validatePasswordSignup(password) : validatePasswordLogin(password);
    if (eErr || pErr) return;
    setSubmitting(true);
    setDone(false);
    window.setTimeout(() => {
      setSubmitting(false);
      setDone(true);
      window.setTimeout(() => {
        try {
          sessionStorage.setItem(AUTH_KEY, "1");
          sessionStorage.setItem(EMAIL_KEY, email.trim());
        } catch {
          /* ignore */
        }
        router.push("/dashboard");
      }, reduce ? 350 : 700);
    }, 850);
  };

  const goChoice = () => withSound(() => setStep("choice"));
  const goLogin = () => withSound(() => setStep("login"));
  const goSignup = () => withSound(() => setStep("signup"));

  const letters = introTitle.split("");
  const tagWords = introTag.split(" ");

  const exitIntro = reduce
    ? { opacity: 0 }
    : { opacity: 0, scale: 1.02, filter: "blur(8px)" };

  return (
    <div className="relative min-h-dvh overflow-x-hidden text-white">
      <AnimatedBackground />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black/45 via-black/55 to-black/70" aria-hidden />
      <div
        className="gateway-noise pointer-events-none absolute inset-0 z-[2] mix-blend-overlay"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_100%)]"
        aria-hidden
      />

      <GatewayHeader
        soundOn={soundOn}
        onToggleSound={() => {
          if (soundOn) playClickSound();
          toggleSound();
        }}
        reducedMotion={reduce}
      />

      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-4 pb-16 pt-20 sm:px-6">
        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.section
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={exitIntro}
              transition={{ duration: reduce ? 0.2 : 0.55 }}
              className="flex max-w-2xl flex-col items-center text-center"
              aria-labelledby="solola-title"
            >
              <div className="relative mb-2 flex flex-col items-center">
                {!reduce && (
                  <>
                    <div
                      className="animate-halo absolute -inset-16 rounded-full bg-[radial-gradient(circle,rgba(108,92,231,0.35),transparent_68%)] blur-2xl"
                      aria-hidden
                    />
                    <div
                      className="absolute -inset-24 rounded-full bg-[radial-gradient(circle,rgba(0,209,255,0.12),transparent_62%)] blur-3xl"
                      aria-hidden
                    />
                  </>
                )}
                <motion.h1
                  id="solola-title"
                  className="relative font-sans text-5xl font-semibold tracking-[0.32em] text-white sm:text-6xl md:text-7xl"
                  initial={{ opacity: 0, scale: reduce ? 1 : 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: reduce ? 0.25 : 1.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <span className="inline-flex flex-wrap justify-center gap-y-2">
                    {letters.map((ch, i) => (
                      <motion.span
                        key={`${ch}-${i}`}
                        initial={{ opacity: 0, y: reduce ? 0 : 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: reduce ? 0 : 0.045 * i,
                          duration: reduce ? 0 : 0.48,
                        }}
                        className="inline-block bg-gradient-to-b from-white via-white to-white/72 bg-clip-text text-transparent drop-shadow-[0_0_32px_rgba(108,92,231,0.55)]"
                      >
                        {ch}
                      </motion.span>
                    ))}
                  </span>
                </motion.h1>
              </div>

              <motion.p
                className="mt-7 max-w-lg text-base text-white/78 sm:text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: reduce ? 0 : 0.75, duration: 0.65 }}
              >
                <span className="inline-flex flex-wrap justify-center gap-x-2.5 gap-y-1.5">
                  {tagWords.map((w, i) => (
                    <motion.span
                      key={w + i}
                      initial={{ opacity: 0, filter: reduce ? "blur(0px)" : "blur(6px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      transition={{
                        delay: reduce ? 0 : 0.8 + i * 0.11,
                        duration: 0.5,
                      }}
                      className="inline-block font-medium"
                    >
                      {w}
                    </motion.span>
                  ))}
                </span>
              </motion.p>

              <motion.button
                type="button"
                initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : 1.25, duration: 0.5 }}
                whileHover={reduce ? undefined : { scale: 1.04 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                onClick={goChoice}
                className="group relative mt-14 overflow-hidden rounded-full px-11 py-4 text-sm font-semibold tracking-wide text-white shadow-[0_0_48px_rgba(108,92,231,0.42)] ring-1 ring-white/15"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-[#6C5CE7] via-[#00D1FF] to-[#6C5CE7] bg-[length:220%_100%] transition-[background-position] duration-700 group-hover:bg-right" />
                {!reduce && (
                  <span className="animate-shimmer pointer-events-none absolute -inset-y-6 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                )}
                <span className="relative">Entrer dans Solola</span>
              </motion.button>

              <p className="mt-10 text-[10px] font-medium uppercase tracking-[0.42em] text-white/32">
                Solola Gateway · Afrofuturiste & néon
              </p>
            </motion.section>
          )}

          {step === "choice" && (
            <motion.div
              key="choice"
              variants={choiceSection}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: reduce ? 0 : -12 }}
              transition={{ duration: 0.35 }}
              className="flex w-full max-w-3xl flex-col items-center gap-10"
            >
              <motion.div variants={choiceBlock(reduce)} className="text-center">
                <p className="text-sm font-medium text-[#00D1FF]/95">
                  Bienvenue {DISPLAY_NAME} 👋
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                  Choisis ton entrée
                </h2>
                <p className="mt-2 max-w-md text-pretty text-sm text-white/48">
                  Interface immersive — chaque connexion est une traversée.
                </p>
              </motion.div>

              <motion.div
                variants={choiceGrid}
                className="grid w-full gap-4 sm:grid-cols-2 sm:gap-6"
              >
                <motion.button
                  type="button"
                  variants={choiceBlock(reduce)}
                  whileHover={reduce ? undefined : { scale: 1.045, y: -2 }}
                  whileTap={reduce ? undefined : { scale: 0.985 }}
                  onClick={goLogin}
                  className="group relative overflow-hidden rounded-2xl border border-white/12 bg-[var(--glass)] p-8 text-left shadow-[0_0_60px_rgba(0,209,255,0.07)] backdrop-blur-xl transition-shadow duration-300 hover:border-[#00D1FF]/45 hover:shadow-[0_0_52px_rgba(0,209,255,0.24)]"
                >
                  <LoginCardIcon />
                  <span className="text-lg font-semibold text-white">Se connecter</span>
                  <p className="mt-2 text-sm leading-relaxed text-white/52">
                    Retrouve ton espace, ton fil, tes messages.
                  </p>
                  <span className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#00D1FF]/18 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="pointer-events-none absolute bottom-4 right-5 text-white/25 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[#00D1FF]/80">
                    →
                  </span>
                </motion.button>

                <motion.button
                  type="button"
                  variants={choiceBlock(reduce)}
                  whileHover={reduce ? undefined : { scale: 1.045, y: -2 }}
                  whileTap={reduce ? undefined : { scale: 0.985 }}
                  onClick={goSignup}
                  className="group relative overflow-hidden rounded-2xl border border-white/12 bg-[var(--glass)] p-8 text-left shadow-[0_0_60px_rgba(108,92,231,0.1)] backdrop-blur-xl transition-shadow duration-300 hover:border-[#6C5CE7]/48 hover:shadow-[0_0_52px_rgba(108,92,231,0.28)]"
                >
                  <SignupCardIcon />
                  <span className="text-lg font-semibold text-white">Créer un compte</span>
                  <p className="mt-2 text-sm leading-relaxed text-white/52">
                    Rejoins la communauté et façonne ton identité.
                  </p>
                  <span className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#6C5CE7]/22 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="pointer-events-none absolute bottom-4 right-5 text-white/25 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-[#B8AEFF]">
                    →
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {(step === "login" || step === "signup") && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: reduce ? 6 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -10 }}
              transition={{ duration: reduce ? 0.2 : 0.42 }}
              className="flex w-full flex-col items-center"
            >
              <AuthCard reducedMotion={reduce}>
                <button
                  type="button"
                  onClick={() => withSound(() => setStep("choice"))}
                  className="mb-6 inline-flex items-center gap-2 rounded-lg text-xs font-medium text-white/45 transition-colors hover:bg-white/[0.04] hover:text-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6C5CE7]"
                >
                  <span aria-hidden>←</span> Retour
                </button>

                <p className="text-sm font-medium text-[#00D1FF]/95">
                  Bienvenue {DISPLAY_NAME} 👋
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[1.65rem]">
                  {step === "login" ? "Bon retour 👋" : "Rejoins Solola"}
                </h2>
                <p className="mt-1 text-sm text-white/48">
                  {step === "login"
                    ? "Connecte-toi pour poursuivre ton voyage."
                    : "Quelques secondes pour ouvrir ton horizon."}
                </p>

                <form className="mt-9 space-y-5" onSubmit={handleSubmit} noValidate>
                  <GlassInput
                    label="Email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                    error={emailError || undefined}
                    success={emailOk}
                    leftIcon={<MailIcon />}
                    placeholder="toi@solola.app"
                  />

                  <GlassInput
                    label="Mot de passe"
                    type={showPw ? "text" : "password"}
                    autoComplete={step === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    error={passwordError || undefined}
                    success={pwOk}
                    leftIcon={<LockIcon />}
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => withSound(() => setShowPw((s) => !s))}
                        className="flex shrink-0 rounded-lg p-1.5 text-white/45 transition-colors hover:bg-white/6 hover:text-white/88 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#6C5CE7]"
                        aria-label={showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      >
                        {showPw ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    }
                    placeholder="••••••••"
                  />

                  {step === "login" && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        className="text-xs font-medium text-[#00D1FF]/88 underline-offset-4 hover:text-[#00D1FF] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00D1FF]"
                        onClick={() => withSound(() => {})}
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>
                  )}

                  <motion.button
                    type="submit"
                    disabled={submitting}
                    whileHover={reduce || submitting ? undefined : { scale: 1.02 }}
                    whileTap={reduce || submitting ? undefined : { scale: 0.98 }}
                    className="relative mt-3 w-full overflow-hidden rounded-xl py-3.5 text-sm font-semibold text-white shadow-[0_0_36px_rgba(108,92,231,0.38)] ring-1 ring-white/12 transition-opacity disabled:opacity-65"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-[#2563eb] via-[#6C5CE7] to-[#a855f7] bg-[length:200%_100%] animate-gradient-x" />
                    {!reduce && (
                      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_35%,rgba(255,255,255,0.12)_50%,transparent_65%)] opacity-40" />
                    )}
                    <span className="relative z-10 flex min-h-[1.25rem] items-center justify-center gap-2">
                      {done ? (
                        <>
                          <CheckIcon />
                          <span>C’est bon !</span>
                        </>
                      ) : submitting ? (
                        <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : step === "login" ? (
                        "Se connecter"
                      ) : (
                        "Créer mon compte"
                      )}
                    </span>
                  </motion.button>
                </form>

                <p className="mt-7 text-center text-[11px] leading-relaxed text-white/38">
                  En continuant, tu acceptes la politique de confidentialité et les conditions
                  d’utilisation.
                </p>
              </AuthCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <CursorGlow reducedMotion={reduce} />
    </div>
  );
}

function CursorGlow({ reducedMotion }: { reducedMotion: boolean | null }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const move = (e: MouseEvent) => {
      el.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    };
    if (!mq.matches) return;
    window.addEventListener("mousemove", move, { passive: true });
    return () => window.removeEventListener("mousemove", move);
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <motion.div
      ref={ref}
      className="pointer-events-none fixed left-0 top-0 z-[5] hidden h-[22rem] w-[22rem] rounded-full bg-[radial-gradient(circle,rgba(0,209,255,0.11),transparent_68%)] mix-blend-screen md:block"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.45 }}
      style={{ willChange: "transform", transform: "translate(-9999px,-9999px)" }}
    />
  );
}

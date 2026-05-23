"use client";

import { motion } from "framer-motion";
import { SololaThemedLogo } from "../sololathemedlogo";

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-[420px] overflow-hidden rounded-[28px] border border-white/[0.12] bg-gradient-to-b from-white/[0.09] to-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-2xl sm:p-8"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-violet-500/25 blur-3xl" />

      <header className="relative mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-black/30 shadow-lg">
          <SololaThemedLogo width={44} height={44} className="rounded-xl" priority />
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-white sm:text-[1.65rem]">{title}</h1>
        <p className="mx-auto mt-2 max-w-[30ch] text-sm leading-relaxed text-slate-400">{subtitle}</p>
      </header>

      <div className="relative space-y-4">{children}</div>
    </motion.section>
  );
}

export function AuthSegment({
  options,
  value,
  onChange
}: {
  options: Array<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex rounded-2xl border border-white/10 bg-black/30 p-1">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
            value === opt.id ? "bg-white text-[#0a1020] shadow-md" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function AuthChannelTabs({
  value,
  onChange,
  showSocial,
  showPhone
}: {
  value: "social" | "email" | "phone";
  onChange: (v: "social" | "email" | "phone") => void;
  showSocial: boolean;
  showPhone: boolean;
}) {
  const tabs = [
    ...(showSocial ? [{ id: "social" as const, label: "Rapide" }] : []),
    { id: "email" as const, label: "E-mail" },
    ...(showPhone ? [{ id: "phone" as const, label: "SMS" }] : [])
  ];

  return (
    <div className="grid gap-1 rounded-2xl border border-white/10 bg-black/25 p-1" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-xl py-2 text-xs font-semibold transition ${
            value === tab.id ? "bg-gradient-to-r from-cyan-500/30 to-violet-500/30 text-white" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function AuthStatusBanner({ type, message }: { type: "error" | "success"; message: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl px-4 py-3 text-sm leading-snug ${
        type === "success"
          ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
          : "border border-rose-400/35 bg-rose-500/10 text-rose-100"
      }`}
      role="alert"
    >
      {message}
    </motion.p>
  );
}

export function AuthPrimaryButton({
  children,
  disabled,
  onClick,
  variant = "gradient"
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  variant?: "gradient" | "outline";
}) {
  const base =
    variant === "gradient"
      ? "bg-gradient-to-r from-[#00D1FF] via-[#4f8cff] to-[#6C5CE7] text-white shadow-[0_8px_32px_rgba(79,140,255,0.35)] hover:brightness-110"
      : "border border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.1]";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-2xl px-4 py-3.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${base}`}
    >
      {children}
    </button>
  );
}

export function AuthOAuthButton({
  provider,
  label,
  disabled,
  onClick,
  busy
}: {
  provider: "google" | "apple";
  label: string;
  disabled?: boolean;
  onClick: () => void;
  busy?: boolean;
}) {
  const isApple = provider === "apple";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-semibold transition disabled:opacity-45 ${
        isApple
          ? "border-white/20 bg-[#0c0c10] text-white hover:bg-black"
          : "border-white/15 bg-white text-[#1a1a1a] hover:bg-slate-100"
      }`}
    >
      {busy ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : provider === "google" ? (
        <span className="flex h-5 w-5 items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path fill="#4285F4" d="M22 12c0-.68-.06-1.35-.17-2H12v3.84h5.64c-.25 1.35-1.01 2.49-2.16 3.25v2.7h3.5c2.04-1.88 3.22-4.65 3.22-7.79z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.5-2.7c-.97.65-2.21 1.04-3.78 1.04-2.9 0-5.35-1.98-6.23-4.64H2.5v2.78C4.2 20.53 7.87 23 12 23z" />
            <path fill="#FBBC05" d="M5.77 13.74c-.22-.65-.35-1.35-.35-2.07s.13-1.42.35-2.07V6.82H2.5C1.81 8.23 1.36 9.88 1.36 11.67s.45 3.44 1.14 4.85l3.27-2.78z" />
            <path fill="#EA4335" d="M12 4.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.87 0 4.2 2.47 2.5 6.82l3.27 2.78C6.65 6.05 9.1 4.38 12 4.38z" />
          </svg>
        </span>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.36-1.31 2.73-2.54 3.84l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
      )}
      {busy ? "Connexion…" : label}
    </button>
  );
}

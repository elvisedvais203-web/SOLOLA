"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

type AuthCardProps = {
  children: ReactNode;
  className?: string;
  reducedMotion?: boolean | null;
};

export function AuthCard({
  children,
  className = "",
  reducedMotion,
}: AuthCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: reducedMotion ? 8 : 18, scale: reducedMotion ? 1 : 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.99 }}
      transition={
        reducedMotion
          ? { duration: 0.22 }
          : { type: "spring", stiffness: 340, damping: 30, mass: 0.85 }
      }
      className={[
        "relative w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.09] bg-[var(--glass)] p-8 sm:p-9",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_28px_90px_rgba(0,0,0,0.58),0_0_140px_rgba(108,92,231,0.14)] backdrop-blur-2xl",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-3xl before:bg-gradient-to-br before:from-white/[0.08] before:to-transparent before:opacity-55",
        "after:pointer-events-none after:absolute after:-right-24 after:-top-24 after:h-52 after:w-52 after:rounded-full after:bg-[#6C5CE7]/18 after:blur-3xl",
        className,
      ].join(" ")}
    >
      <span
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#00D1FF]/35 to-transparent"
        aria-hidden
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

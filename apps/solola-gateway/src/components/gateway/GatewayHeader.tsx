"use client";

import { motion } from "framer-motion";

type GatewayHeaderProps = {
  soundOn: boolean;
  onToggleSound: () => void;
  reducedMotion: boolean | null;
};

export function GatewayHeader({
  soundOn,
  onToggleSound,
  reducedMotion,
}: GatewayHeaderProps) {
  return (
    <header className="pointer-events-none fixed left-0 right-0 top-0 z-20 flex items-center justify-between px-4 py-4 sm:px-6">
      <div className="pointer-events-auto flex items-center gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xs font-bold tracking-tighter text-white shadow-[0_0_24px_rgba(108,92,231,0.35)] backdrop-blur-md"
          aria-hidden
        >
          S
        </span>
        <div className="leading-tight">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-white/40">
            Solola
          </p>
          <p className="text-sm font-medium text-white/90">Gateway</p>
        </div>
      </div>

      <motion.button
        type="button"
        whileHover={reducedMotion ? undefined : { scale: 1.03 }}
        whileTap={reducedMotion ? undefined : { scale: 0.97 }}
        onClick={onToggleSound}
        className="pointer-events-auto rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[11px] font-medium text-white/70 backdrop-blur-md transition-colors hover:border-[#00D1FF]/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6C5CE7]"
        aria-pressed={soundOn}
        aria-label={soundOn ? "Désactiver les sons au clic" : "Activer les sons au clic"}
      >
        {soundOn ? "Son · on" : "Son · off"}
      </motion.button>
    </header>
  );
}

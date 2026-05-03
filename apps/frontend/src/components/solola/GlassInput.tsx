"use client";

import { motion } from "framer-motion";

type GlassInputProps = {
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  error?: string;
  showToggle?: boolean;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
};

export function GlassInput({
  label,
  type = "text",
  value,
  placeholder,
  onChange,
  error,
  showToggle,
  isVisible,
  onToggleVisibility
}: GlassInputProps) {
  const computedType = type === "password" && isVisible ? "text" : type;
  const hasError = Boolean(error);

  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-[0.18em] text-slate-300">{label}</label>
      <motion.div
        animate={hasError ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.25 }}
        className={`flex items-center gap-2 rounded-2xl border bg-white/[0.04] px-3 py-3 backdrop-blur-lg transition ${
          hasError ? "border-rose-400/70" : "border-white/15 focus-within:border-cyan-300/70"
        }`}
      >
        <span className="text-slate-300">{type === "email" ? "@" : "•"}</span>
        <input
          type={computedType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
        />
        {showToggle ? (
          <button
            type="button"
            onClick={onToggleVisibility}
            className="rounded-lg px-2 py-1 text-xs text-cyan-300 transition hover:bg-white/10"
          >
            {isVisible ? "Masquer" : "Voir"}
          </button>
        ) : null}
      </motion.div>
      {error ? <p className="mt-1 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}

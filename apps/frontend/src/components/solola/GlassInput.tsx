"use client";

import { motion } from "framer-motion";
import { IconLock, IconMail, IconPhone, IconUser } from "./auth-icons";

type GlassInputProps = {
  label: string;
  type?: "text" | "email" | "password" | "tel";
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  error?: string;
  showToggle?: boolean;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
};

function FieldIcon({ type }: { type: GlassInputProps["type"] }) {
  const cls = "h-[18px] w-[18px] shrink-0 text-slate-500";
  if (type === "email") return <IconMail className={cls} />;
  if (type === "password") return <IconLock className={cls} />;
  if (type === "tel") return <IconPhone className={cls} />;
  return <IconUser className={cls} />;
}

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
      <label className="mb-1.5 block text-[13px] font-medium text-slate-300">{label}</label>
      <motion.div
        animate={hasError ? { x: [0, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.2 }}
        className={`flex items-center gap-3 rounded-2xl border bg-[#0a0f1a]/80 px-4 py-3.5 transition focus-within:border-cyan-400/50 focus-within:ring-2 focus-within:ring-cyan-400/15 ${
          hasError ? "border-rose-400/60" : "border-white/10"
        }`}
      >
        <FieldIcon type={type} />
        <input
          type={computedType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-[15px] text-white placeholder:text-slate-600 focus:outline-none"
          autoComplete={type === "email" ? "email" : type === "password" ? "current-password" : type === "tel" ? "tel" : "name"}
        />
        {showToggle ? (
          <button
            type="button"
            onClick={onToggleVisibility}
            className="shrink-0 text-xs font-medium text-slate-400 transition hover:text-white"
          >
            {isVisible ? "Masquer" : "Afficher"}
          </button>
        ) : null}
      </motion.div>
      {error ? <p className="mt-1.5 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}

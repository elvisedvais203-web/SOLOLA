"use client";

import { type InputHTMLAttributes, type ReactNode, useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

type GlassInputProps = {
  label: string;
  error?: string;
  success?: boolean;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  inputClassName?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function GlassInput({
  label,
  error,
  success,
  leftIcon,
  rightSlot,
  inputClassName = "",
  id,
  ...inputProps
}: GlassInputProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hasError = Boolean(error);
  const reduce = useReducedMotion();

  return (
    <div className="w-full">
      <label
        htmlFor={fieldId}
        className="mb-1.5 block text-xs font-medium tracking-wide text-white/55"
      >
        {label}
      </label>
      <motion.div
        className="relative"
        animate={
          hasError && !reduce
            ? { x: [0, -6, 6, -4, 4, 0] }
            : { x: 0 }
        }
        transition={{ duration: reduce ? 0 : 0.45 }}
      >
        <div
          className={[
            "group flex items-center gap-2 rounded-xl border bg-[var(--glass)] px-3 py-2.5 shadow-inner backdrop-blur-xl transition-[border-color,box-shadow] duration-300",
            "focus-within:ring-2 focus-within:ring-[#6C5CE7]/45 focus-within:ring-offset-0 focus-within:ring-offset-transparent",
            hasError
              ? "border-red-500/70 shadow-[0_0_22px_rgba(239,68,68,0.28)]"
              : success
                ? "border-emerald-400/55 shadow-[0_0_20px_rgba(52,211,153,0.22)]"
                : "border-white/10 focus-within:border-[#6C5CE7]/85 focus-within:shadow-[0_0_28px_rgba(108,92,231,0.38)]",
          ].join(" ")}
        >
          {leftIcon && (
            <span className="flex shrink-0 text-white/45 transition-colors duration-200 group-focus-within:text-white/70 [&_svg]:h-5 [&_svg]:w-5">
              {leftIcon}
            </span>
          )}
          <input
            id={fieldId}
            className={[
              "min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/28",
              inputClassName,
            ].join(" ")}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${fieldId}-err` : undefined}
            {...inputProps}
          />
          {rightSlot}
        </div>
        {hasError && (
          <p id={`${fieldId}-err`} className="mt-1.5 text-xs text-red-400/95">
            {error}
          </p>
        )}
      </motion.div>
    </div>
  );
}

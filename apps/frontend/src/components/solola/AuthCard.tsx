"use client";

import { motion } from "framer-motion";

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -18, scale: 0.98 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-lg rounded-3xl border border-white/15 bg-white/[0.05] p-6 shadow-[0_0_60px_rgba(108,92,231,0.18)] backdrop-blur-xl"
    >
      <h2 className="font-heading text-3xl font-bold text-white">{title}</h2>
      <p className="mt-2 text-sm text-slate-300">{subtitle}</p>
      <div className="mt-6 space-y-4">{children}</div>
    </motion.section>
  );
}

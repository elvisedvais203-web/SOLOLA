"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { runBackendEmailAuth, type BackendEmailAuthMode } from "../../lib/nextalkbackendemailauth";

type Props = {
  nextPath: string;
  onStatus: (message: string, type: "error" | "success") => void;
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50";

export function BackendEmailPanel({ nextPath, onStatus }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<BackendEmailAuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [twoFaChallengeId, setTwoFaChallengeId] = useState<string | null>(null);
  const [twoFaToken, setTwoFaToken] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const result = await runBackendEmailAuth({
        mode,
        email,
        password,
        confirmPassword,
        displayName,
        resetToken,
        twoFaChallengeId,
        twoFaToken
      });
      if (!result.ok) {
        onStatus(result.message, "error");
        return;
      }
      if (result.requires2FA && result.challengeId) {
        setTwoFaChallengeId(result.challengeId);
        onStatus(result.message, "success");
        return;
      }
      setTwoFaChallengeId(null);
      setTwoFaToken("");
      onStatus(result.message, "success");
      setTimeout(() => router.replace(nextPath), 400);
    } catch (error: unknown) {
      const e = error as { message?: string; response?: { data?: { message?: string } } };
      onStatus(e?.response?.data?.message ?? e?.message ?? "Erreur.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left">
      <summary className="cursor-pointer text-xs font-medium text-slate-300">
        Compte email API (sans Firebase) — 2FA, reset, inscription
      </summary>
      <div className="mt-3 space-y-2">
        <div className="flex flex-wrap gap-2">
          {(["login", "register", "reset"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setMode(item);
                setTwoFaChallengeId(null);
              }}
              className={`rounded-full px-3 py-1 text-[11px] ${mode === item ? "bg-white/15 text-white" : "text-slate-400"}`}
            >
              {item === "login" ? "Connexion" : item === "register" ? "Inscription" : "Reset"}
            </button>
          ))}
        </div>
        {mode === "register" ? (
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Nom affiche (optionnel)" className={inputClass} />
        ) : null}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.com" type="email" className={inputClass} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" type="password" className={inputClass} />
        {mode === "register" ? (
          <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmer le mot de passe" type="password" className={inputClass} />
        ) : null}
        {mode === "reset" ? (
          <input value={resetToken} onChange={(e) => setResetToken(e.target.value)} placeholder="Token reset (vide = demander)" className={inputClass} />
        ) : null}
        {mode === "login" && twoFaChallengeId ? (
          <input
            value={twoFaToken}
            onChange={(e) => setTwoFaToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Code 2FA (6 chiffres)"
            inputMode="numeric"
            className={inputClass}
          />
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="btn-outline-neon w-full rounded-xl py-2 text-xs font-semibold disabled:opacity-50"
        >
          {busy ? "Patientez..." : mode === "reset" && !resetToken.trim() ? "Demander reset" : "Valider"}
        </button>
      </div>
    </details>
  );
}

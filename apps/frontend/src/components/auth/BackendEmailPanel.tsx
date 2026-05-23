"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { runBackendEmailAuth, type BackendEmailAuthMode } from "../../lib/nextalkbackendemailauth";
import { AuthPrimaryButton } from "../solola/AuthCard";
import { GlassInput } from "../solola/GlassInput";

type Props = {
  nextPath: string;
  intent: "login" | "register";
  onStatus: (message: string, type: "error" | "success") => void;
};

export function BackendEmailPanel({ nextPath, intent, onStatus }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [twoFaChallengeId, setTwoFaChallengeId] = useState<string | null>(null);
  const [twoFaToken, setTwoFaToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const mode: BackendEmailAuthMode = resetMode ? "reset" : intent === "register" ? "register" : "login";
      const result = await runBackendEmailAuth({
        mode,
        email,
        password,
        confirmPassword,
        displayName,
        twoFaChallengeId,
        twoFaToken
      });
      if (!result.ok) {
        onStatus(result.message, "error");
        return;
      }
      if (result.requires2FA && result.challengeId) {
        setTwoFaChallengeId(result.challengeId);
        onStatus("Saisis le code de ton application d authentification.", "success");
        return;
      }
      setTwoFaChallengeId(null);
      setTwoFaToken("");
      onStatus(intent === "register" ? "Compte cree. Bienvenue sur Solola." : "Connexion reussie.", "success");
      setTimeout(() => router.replace(nextPath), 450);
    } catch (error: unknown) {
      const e = error as { response?: { data?: { message?: string } }; message?: string };
      onStatus(e?.response?.data?.message ?? e?.message ?? "Impossible de te connecter.", "error");
    } finally {
      setBusy(false);
    }
  };

  if (resetMode) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-400">Nous t enverrons les instructions par e-mail si le compte existe.</p>
        <GlassInput label="Adresse e-mail" type="email" value={email} onChange={setEmail} placeholder="toi@exemple.com" />
        <AuthPrimaryButton disabled={busy} onClick={() => void submit()}>
          {busy ? "Envoi…" : "Envoyer le lien"}
        </AuthPrimaryButton>
        <button type="button" onClick={() => setResetMode(false)} className="w-full text-center text-sm text-slate-400 hover:text-white">
          Retour a la connexion
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {intent === "register" ? (
        <GlassInput label="Nom affiche" type="text" value={displayName} onChange={setDisplayName} placeholder="Comment tes amis te voient" />
      ) : null}
      <GlassInput label="Adresse e-mail" type="email" value={email} onChange={setEmail} placeholder="toi@exemple.com" />
      <GlassInput
        label="Mot de passe"
        type="password"
        value={password}
        onChange={setPassword}
        placeholder="8 caracteres minimum"
        showToggle
        isVisible={showPassword}
        onToggleVisibility={() => setShowPassword((v) => !v)}
      />
      {intent === "register" ? (
        <GlassInput
          label="Confirmer le mot de passe"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Repete le mot de passe"
          showToggle
          isVisible={showPassword2}
          onToggleVisibility={() => setShowPassword2((v) => !v)}
        />
      ) : null}
      {twoFaChallengeId ? (
        <GlassInput
          label="Code de securite"
          type="text"
          value={twoFaToken}
          onChange={(v) => setTwoFaToken(v.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
        />
      ) : null}
      {intent === "login" && !twoFaChallengeId ? (
        <div className="flex justify-end">
          <button type="button" onClick={() => setResetMode(true)} className="text-sm font-medium text-cyan-400/90 hover:text-cyan-300">
            Mot de passe oublie ?
          </button>
        </div>
      ) : null}
      <AuthPrimaryButton disabled={busy} onClick={() => void submit()}>
        {busy ? "Patience…" : intent === "register" ? "Creer mon compte" : twoFaChallengeId ? "Valider le code" : "Se connecter"}
      </AuthPrimaryButton>
    </div>
  );
}

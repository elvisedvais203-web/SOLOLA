import api, { type AuthApiSessionResponse } from "./nextalkapi";
import { storeSession } from "./nextalksession";

export type BackendEmailAuthMode = "login" | "register" | "reset";

export type BackendEmailAuthInput = {
  mode: BackendEmailAuthMode;
  email: string;
  password: string;
  confirmPassword?: string;
  displayName?: string;
  resetToken?: string;
  twoFaChallengeId?: string | null;
  twoFaToken?: string;
};

export type BackendEmailAuthResult =
  | { ok: true; message: string; requires2FA?: false; challengeId?: never }
  | { ok: true; message: string; requires2FA: true; challengeId: string }
  | { ok: false; message: string };

export async function runBackendEmailAuth(input: BackendEmailAuthInput): Promise<BackendEmailAuthResult> {
  const email = input.email.trim();
  if (!email) {
    return { ok: false, message: "Entrez votre email." };
  }

  if (input.mode === "register") {
    if (input.password.length < 8) {
      return { ok: false, message: "Mot de passe trop court (minimum 8 caracteres)." };
    }
    if (input.password !== input.confirmPassword) {
      return { ok: false, message: "Les mots de passe ne correspondent pas." };
    }
    const resp = await api.post<AuthApiSessionResponse>("/auth/email/register", {
      email,
      password: input.password,
      displayName: input.displayName?.trim() || undefined
    });
    storeSession({
      accessToken: resp.data.tokens.accessToken,
      refreshToken: resp.data.tokens.refreshToken,
      user: resp.data.user
    });
    return { ok: true, message: "Compte cree. Connexion reussie." };
  }

  if (input.mode === "login") {
    if (input.twoFaChallengeId) {
      const resp = await api.post<AuthApiSessionResponse>("/auth/2fa/verify-login", {
        challengeId: input.twoFaChallengeId,
        token: String(input.twoFaToken ?? "").replace(/\D/g, "").slice(0, 6)
      });
      storeSession({
        accessToken: resp.data.tokens.accessToken,
        refreshToken: resp.data.tokens.refreshToken,
        user: resp.data.user
      });
      return { ok: true, message: "Connexion reussie (2FA validee)." };
    }

    const resp = await api.post<AuthApiSessionResponse & { requires2FA?: boolean; challengeId?: string }>(
      "/auth/email/login",
      { email, password: input.password }
    );
    if (resp.data?.requires2FA && resp.data.challengeId) {
      return {
        ok: true,
        requires2FA: true,
        challengeId: resp.data.challengeId,
        message: "Entrez le code a 6 chiffres de votre application 2FA."
      };
    }
    storeSession({
      accessToken: resp.data.tokens.accessToken,
      refreshToken: resp.data.tokens.refreshToken,
      user: resp.data.user
    });
    return { ok: true, message: "Connexion reussie." };
  }

  if (input.resetToken?.trim()) {
    const resp = await api.post<AuthApiSessionResponse>("/auth/password/reset", {
      token: input.resetToken.trim(),
      newPassword: input.password
    });
    storeSession({
      accessToken: resp.data.tokens.accessToken,
      refreshToken: resp.data.tokens.refreshToken,
      user: resp.data.user
    });
    return { ok: true, message: "Mot de passe reinitialise. Connexion reussie." };
  }

  const resp = await api.post<{ token?: string }>("/auth/password/request-reset", { email });
  const token = resp.data?.token;
  return {
    ok: true,
    message: token
      ? `Token de reset (dev): ${token}`
      : "Si un compte existe, un email de reinitialisation a ete envoye."
  };
}

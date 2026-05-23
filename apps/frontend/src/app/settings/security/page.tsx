"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "../../../components/nextalkauthguard";
import { fetchCsrfToken } from "../../../services/nextalksecurity";
import {
  disable2fa,
  downloadAccountExport,
  enable2fa,
  listSessions,
  revokeAllSessions,
  setup2fa
} from "../../../services/nextalkaccountsecurity";
import { logoutSession } from "../../../lib/nextalksession";

export default function SettingsSecurityPage() {
  const [secret, setSecret] = useState("");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [sessions, setSessions] = useState<
    Array<{ id: string; identifier: string; ipAddress?: string; userAgent?: string; createdAt: string }>
  >([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void listSessions()
      .then(setSessions)
      .catch(() => setSessions([]));
  }, []);

  return (
    <AuthGuard>
      <section className="mx-auto max-w-3xl pb-10">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-heading text-3xl font-bold text-white">Securite avancee</h1>
          <Link href="/settings" className="text-sm text-neoblue">
            Retour
          </Link>
        </div>

        <div className="glass mb-4 space-y-3 rounded-3xl p-4">
          <h2 className="text-sm font-semibold text-white">Double authentification (2FA)</h2>
          <button
            type="button"
            className="btn-outline-neon rounded-xl px-3 py-2 text-sm"
            onClick={async () => {
              const csrf = await fetchCsrfToken();
              const data = await setup2fa(csrf);
              setSecret(data.secret);
              setOtpauthUrl(data.otpauthUrl);
              setStatus("Secret 2FA genere. Saisissez le code de votre application.");
            }}
          >
            Generer secret 2FA
          </button>
          {secret ? (
            <p className="break-all text-xs text-slate-300">
              Secret: <span className="text-white">{secret}</span>
            </p>
          ) : null}
          {otpauthUrl ? (
            <a href={otpauthUrl} className="text-xs text-neoblue underline">
              Lien otpauth (Google Authenticator / Authy)
            </a>
          ) : null}
          <input
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Code 6 chiffres"
            className="input-neon w-full rounded-xl px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-neon rounded-xl px-3 py-2 text-sm"
              onClick={async () => {
                const csrf = await fetchCsrfToken();
                await enable2fa(token, csrf);
                setStatus("2FA activee.");
              }}
            >
              Activer 2FA
            </button>
            <button
              type="button"
              className="btn-outline-neon rounded-xl px-3 py-2 text-sm"
              onClick={async () => {
                const csrf = await fetchCsrfToken();
                await disable2fa(token, password, csrf);
                setStatus("2FA desactivee.");
              }}
            >
              Desactiver
            </button>
          </div>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe (pour desactiver)"
            type="password"
            className="input-neon w-full rounded-xl px-3 py-2 text-sm"
          />
        </div>

        <div className="glass mb-4 space-y-3 rounded-3xl p-4">
          <h2 className="text-sm font-semibold text-white">Sessions actives</h2>
          <div className="max-h-56 space-y-2 overflow-y-auto">
            {sessions.map((row) => (
              <div key={row.id} className="rounded-xl border border-white/10 bg-black/20 p-2 text-xs text-slate-300">
                <p className="text-white">{row.identifier}</p>
                <p>{row.userAgent ?? "Appareil inconnu"}</p>
                <p>{row.ipAddress ?? "IP inconnue"}</p>
                <p>{new Date(row.createdAt).toLocaleString("fr-FR")}</p>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn-outline-neon rounded-xl px-3 py-2 text-sm"
            onClick={async () => {
              const csrf = await fetchCsrfToken();
              await revokeAllSessions(csrf);
              logoutSession();
              setStatus("Toutes les sessions ont ete revoquees. Reconnectez-vous.");
            }}
          >
            Deconnecter tous les appareils
          </button>
        </div>

        <div className="glass space-y-3 rounded-3xl p-4">
          <h2 className="text-sm font-semibold text-white">Export de donnees (RGPD)</h2>
          <button
            type="button"
            className="btn-neon rounded-xl px-3 py-2 text-sm"
            onClick={async () => {
              const payload = await downloadAccountExport();
              const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `solola-export-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
              setStatus("Export telecharge.");
            }}
          >
            Telecharger mes donnees
          </button>
        </div>

        {status ? <p className="mt-4 text-sm text-slate-300">{status}</p> : null}
      </section>
    </AuthGuard>
  );
}

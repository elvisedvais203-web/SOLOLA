/**
 * Origine du backend Express (sans chemin /api), pour requêtes serveur → serveur
 * (route handler proxy, upload, etc.). Lis les variables au runtime sur Render.
 */
export function getBackendOrigin(): string {
  const raw =
    process.env.API_PROXY_TARGET?.trim() ||
    process.env.BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_SOCKET_URL?.trim() ||
    "https://solola-api.onrender.com";

  let base = String(raw).replace(/\/+$/, "");
  if (base.endsWith("/api")) {
    base = base.slice(0, -4);
  }
  if (!base.startsWith("http://") && !base.startsWith("https://")) {
    base = `https://${base}`;
  }
  return base;
}

/**
 * Valeurs de secours si NEXT_PUBLIC_API_URL / NEXT_PUBLIC_SOCKET_URL ne sont pas
 * définies au moment du build Next.js (cas à éviter en production).
 *
 * Quand tu changes de backend Render ou de domaine : soit tu configures toujours
 * ces variables sur l’hébergeur (recommandé), soit tu modifies ces deux constantes une fois.
 */
export const DEPLOY_FALLBACK_API_BASE = "https://solola-api.onrender.com/api";

/** Origine sans chemin /api (Socket.IO, etc.) */
export const DEPLOY_FALLBACK_SOCKET_BASE = "https://solola-api.onrender.com";

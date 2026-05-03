import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

/** True lorsque les clés publiques Firebase sont présentes (build CI / Vercel). */
export function isFirebaseAppConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

let cachedAuth: Auth | undefined;

/**
 * Auth Firebase — initialisation paresseuse **uniquement dans le navigateur**.
 * Évite `auth/invalid-api-key` pendant le prérendu Next.js lorsque les env ne sont pas chargées.
 */
export function getFirebaseAuth(): Auth {
  if (typeof window === "undefined") {
    throw new Error("getFirebaseAuth() ne peut être appelé que côté client.");
  }
  if (!isFirebaseAppConfigured()) {
    throw new Error("Firebase non configuré : renseignez NEXT_PUBLIC_FIREBASE_*.");
  }
  if (!cachedAuth) {
    const app: FirebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
    cachedAuth = getAuth(app);
  }
  return cachedAuth;
}

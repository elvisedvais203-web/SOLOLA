const E2E_PREFIX = "e2e:v1:";
const E2E_STORAGE_KEY = "solola_e2e_passphrase";

export function isE2EPayload(text?: string | null): boolean {
  return Boolean(text?.startsWith(E2E_PREFIX));
}

export function getStoredE2EPassphrase(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(E2E_STORAGE_KEY) ?? "";
}

export function storeE2EPassphrase(value: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(E2E_STORAGE_KEY, value.trim());
}

async function deriveKey(chatId: string, passphrase: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(`${chatId}:${passphrase}`), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("solola-e2e-v1"), iterations: 120_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function encryptChatText(chatId: string, plain: string, passphrase: string): Promise<string> {
  if (!passphrase.trim()) return plain;
  const key = await deriveKey(chatId, passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain));
  const payload = new Uint8Array(iv.length + cipher.byteLength);
  payload.set(iv, 0);
  payload.set(new Uint8Array(cipher), iv.length);
  return `${E2E_PREFIX}${toBase64(payload)}`;
}

export async function decryptChatText(chatId: string, payload: string, passphrase: string): Promise<string> {
  if (!isE2EPayload(payload) || !passphrase.trim()) return payload;
  try {
    const key = await deriveKey(chatId, passphrase);
    const raw = fromBase64(payload.slice(E2E_PREFIX.length));
    const iv = raw.slice(0, 12);
    const data = raw.slice(12);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return new TextDecoder().decode(plain);
  } catch {
    return "[Message chiffre — passphrase incorrecte]";
  }
}

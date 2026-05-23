import api from "../lib/nextalkapi";
import { fetchCsrfToken } from "./nextalksecurity";
import { broadcastToChannel, sendChatMessage, type ChatMessageType } from "./nextalkchat";
import { createFeedPost } from "./nextalksocial";
import { createStory } from "./nextalkstories";

type UploadResult = { url: string; fileName: string };

function isVideoFile(file: File): boolean {
  const t = String(file.type || "").toLowerCase();
  if (t.startsWith("video/")) return true;
  return /\.(mp4|webm|mov)$/i.test(file.name);
}

function formatUploadError(error: unknown): string {
  const e = error as { response?: { status?: number; data?: { message?: string } }; message?: string };
  const status = e?.response?.status;
  const msg = e?.response?.data?.message ?? e?.message ?? "";
  if (status === 401) return "Session expiree. Reconnecte-toi.";
  if (status === 503 && /media|cloudinary|stockage/i.test(String(msg))) {
    return "Stockage media indisponible sur le serveur. L admin doit configurer Cloudinary ou redeployer l API.";
  }
  if (status === 400) return String(msg) || "Fichier refuse par le serveur.";
  if (status === 413) return "Fichier trop volumineux (max 120 Mo).";
  return msg ? String(msg) : "Upload impossible. Verifie ta connexion.";
}

function guessMessageType(file: File): ChatMessageType {
  const t = String(file.type || "").toLowerCase();
  if (t.startsWith("image/")) return "IMAGE";
  if (t.startsWith("video/")) return "VIDEO";
  if (t.startsWith("audio/")) return "VOICE";
  return "TEXT";
}

async function retry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i === attempts - 1) break;
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }
  throw lastError;
}

export async function uploadMediaWithRetry(
  file: File,
  folder: string,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const csrf = await fetchCsrfToken();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const upload = await retry(async () => {
    const { data } = await api.post("/media/upload", formData, {
      headers: { "Content-Type": "multipart/form-data", "x-csrf-token": csrf },
      onUploadProgress: (evt) => {
        const total = evt.total ?? 0;
        if (total > 0 && onProgress) {
          onProgress(Math.round((evt.loaded / total) * 100));
        }
      }
    });
    return data;
  });

  const url = String(upload?.url ?? upload?.secure_url ?? upload?.mediaUrl ?? "");
  if (!url) {
    throw new Error("upload_missing_url");
  }

  return { url, fileName: file.name };
}

export function formatPublishError(error: unknown): string {
  if (error instanceof Error && error.message === "upload_missing_url") {
    return "Le serveur n a pas renvoye d URL media.";
  }
  return formatUploadError(error);
}

export async function publishFeedWithOptionalMedia(input: {
  content?: string;
  mediaFile?: File | null;
  onUploadProgress?: (percent: number) => void;
}) {
  const csrf = await fetchCsrfToken();
  let mediaUrl: string | undefined;
  if (input.mediaFile) {
    const folder = input.mediaFile.type.startsWith("video/") ? "reels" : "posts";
    const uploaded = await uploadMediaWithRetry(input.mediaFile, folder, input.onUploadProgress);
    mediaUrl = uploaded.url;
  }
  const content = String(input.content ?? "").trim() || "Nouvelle publication";
  return await retry(() => createFeedPost({ content, mediaUrl }, csrf));
}

export async function publishStoryWithMedia(input: {
  mediaFile: File;
  caption?: string;
  visibility?: "PUBLIC" | "FOLLOWERS";
  onUploadProgress?: (percent: number) => void;
}) {
  const csrf = await fetchCsrfToken();
  const uploaded = await uploadMediaWithRetry(input.mediaFile, "stories", input.onUploadProgress);
  return await retry(() =>
    createStory(
      {
        mediaUrl: uploaded.url,
        mediaType: isVideoFile(input.mediaFile) ? "VIDEO" : "IMAGE",
        caption: input.caption,
        visibility: input.visibility ?? "PUBLIC"
      },
      csrf
    )
  );
}

export async function publishToChannelWithMedia(input: {
  channelId: string;
  text?: string;
  files?: File[];
  onUploadProgress?: (percent: number) => void;
}) {
  const csrf = await fetchCsrfToken();
  const text = String(input.text ?? "").trim();
  if (text) {
    await retry(() => broadcastToChannel(input.channelId, { text, type: "TEXT" }, csrf));
  }
  for (const file of input.files ?? []) {
    const uploaded = await uploadMediaWithRetry(file, "channels", input.onUploadProgress);
    const t = guessMessageType(file);
    const payload =
      t === "TEXT"
        ? { type: "TEXT" as const, text: `📎 ${uploaded.fileName}`, mediaUrl: uploaded.url, fileName: uploaded.fileName }
        : { type: t, mediaUrl: uploaded.url, fileName: uploaded.fileName };
    await retry(() => broadcastToChannel(input.channelId, payload, csrf));
  }
}

export async function sendMessageWithOptionalMedia(input: {
  chatId: string;
  text?: string;
  mediaFile?: File | null;
  onUploadProgress?: (percent: number) => void;
}) {
  const csrf = await fetchCsrfToken();
  const text = String(input.text ?? "").trim();

  if (input.mediaFile) {
    const uploaded = await uploadMediaWithRetry(input.mediaFile, "messages", input.onUploadProgress);
    const type = guessMessageType(input.mediaFile);
    return await retry(() =>
      sendChatMessage(
        input.chatId,
        {
          text: text || undefined,
          mediaUrl: uploaded.url,
          fileName: uploaded.fileName,
          type
        },
        csrf
      )
    );
  }

  if (!text) {
    throw new Error("message_empty");
  }

  return await retry(() => sendChatMessage(input.chatId, { text }, csrf));
}

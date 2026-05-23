"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/nextalkapi";
import { fetchCsrfToken } from "../services/nextalksecurity";
import { createFeedPost } from "../services/nextalksocial";
import { createStory } from "../services/nextalkstories";
import { useSololaPlan } from "../hooks/useSololaPlan";
import Link from "next/link";

export type CreateKind = "story" | "reel" | "post";

type Props = {
  open: boolean;
  initialKind?: CreateKind;
  onClose: () => void;
};

export function SololaCreateModal({ open, initialKind = "post", onClose }: Props) {
  const router = useRouter();
  const { can } = useSololaPlan();
  const [kind, setKind] = useState<CreateKind>(initialKind);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (open) setKind(initialKind);
  }, [open, initialKind]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const accept = useMemo(() => {
    if (kind === "post") return "image/*,video/*";
    return "image/*,video/*";
  }, [kind]);

  const publish = async () => {
    if (kind === "reel" && !can("reels")) {
      setStatus("Reels HD disponibles avec le plan Standard ou Pro.");
      return;
    }
    if (kind === "story" && !can("stories")) {
      setStatus("Stories indisponibles sur ce plan.");
      return;
    }

    if (!file && kind !== "post") {
      setStatus("Choisis une photo ou une video.");
      return;
    }
    if (kind === "post" && !file && !caption.trim()) {
      setStatus("Ajoute un texte ou un media.");
      return;
    }

    try {
      setBusy(true);
      setStatus("");
      const csrf = await fetchCsrfToken();
      let mediaUrl: string | undefined;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", kind === "story" ? "stories" : kind === "reel" ? "reels" : "posts");
        const { data: upload } = await api.post("/media/upload", formData, {
          headers: { "Content-Type": "multipart/form-data", "x-csrf-token": csrf },
          onUploadProgress: (evt) => {
            const total = evt.total ?? 0;
            if (total > 0) setProgress(Math.round((evt.loaded / total) * 100));
          }
        });
        mediaUrl = String(upload?.url ?? upload?.secure_url ?? "");
        if (!mediaUrl) throw new Error("upload_failed");
      }

      if (kind === "story") {
        await createStory(
          {
            mediaUrl: mediaUrl!,
            mediaType: file!.type.startsWith("video/") ? "VIDEO" : "IMAGE",
            caption: caption.trim() || undefined,
            visibility: "PUBLIC"
          },
          csrf
        );
        setStatus("Story publiee.");
        onClose();
        router.push("/");
        return;
      }

      if (kind === "reel") {
        await createFeedPost(
          { content: caption.trim() || "Nouveau reel", mediaUrl },
          csrf
        );
        setStatus("Reel publie.");
        onClose();
        router.push("/reels");
        return;
      }

      await createFeedPost(
        { content: caption.trim() || "Nouvelle publication", mediaUrl },
        csrf
      );
      setStatus("Publication envoyee.");
      onClose();
      router.push("/");
    } catch {
      setStatus("Publication impossible pour le moment.");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-black/70 md:items-center md:justify-center" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-white/10 bg-[#08101f] p-4 md:max-w-lg md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Creer</h2>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-slate-400 hover:bg-white/10">
            Fermer
          </button>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          {(["story", "reel", "post"] as CreateKind[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-2xl px-3 py-2 text-sm font-semibold capitalize ${kind === k ? "btn-neon" : "btn-outline-neon"}`}
            >
              {k === "story" ? "Story" : k === "reel" ? "Reel" : "Post"}
            </button>
          ))}
        </div>

        <label className="mb-3 flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-black/20 p-4">
          {preview ? (
            file?.type.startsWith("video/") ? (
              <video src={preview} className="max-h-56 w-full rounded-xl object-cover" controls muted playsInline />
            ) : (
              <img src={preview} alt="Apercu" className="max-h-56 w-full rounded-xl object-cover" />
            )
          ) : (
            <p className="text-center text-sm text-slate-400">Appuyer pour choisir photo ou video</p>
          )}
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) setFile(f);
            }}
          />
        </label>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder={kind === "post" ? "Quoi de neuf ?" : "Legende (optionnel)"}
          className="input-neon mb-3 min-h-[88px] w-full rounded-2xl px-3 py-2 text-sm"
        />

        {progress > 0 ? (
          <div className="mb-3">
            <div className="h-2 w-full rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-neoblue transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-400">Upload {progress}%</p>
          </div>
        ) : null}

        {status ? <p className="mb-3 text-sm text-slate-300">{status}</p> : null}

        <button
          type="button"
          disabled={busy}
          onClick={() => void publish()}
          className="btn-neon w-full rounded-2xl py-3 text-sm font-bold disabled:opacity-60"
        >
          {busy ? "Publication..." : "Publier"}
        </button>

        {(kind === "reel" && !can("reels")) || (kind === "story" && !can("stories")) ? (
          <p className="mt-3 text-center text-xs text-slate-400">
            Fonction reservee.{" "}
            <Link href="/settings/plan" className="text-neoblue underline">
              Voir les plans
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AuthGuard } from "../../components/nextalkauthguard";

type FilterType = "recent" | "popular" | "friends";

const posts = [
  { id: "p1", user: "Elvis", text: "Exprime-toi en néon ✨", type: "recent", media: "https://picsum.photos/seed/pub1/700/480" },
  { id: "p2", user: "Amina", text: "Design afrofuturiste et storytelling.", type: "popular", media: "https://picsum.photos/seed/pub2/700/480" },
  { id: "p3", user: "Kengo", text: "Nouveau format vidéo en test.", type: "friends", media: "https://picsum.photos/seed/pub3/700/480" }
];

export default function PublicationsPage() {
  const [filter, setFilter] = useState<FilterType>("recent");
  const [draft, setDraft] = useState("");

  const filteredPosts = useMemo(() => posts.filter((post) => post.type === filter), [filter]);

  return (
    <AuthGuard>
      <section className="mx-auto max-w-5xl space-y-4 pb-8">
        <h1 className="font-heading text-2xl font-bold text-white">Publications</h1>

        <div className="glass rounded-3xl p-4">
          <p className="text-sm text-slate-200">Exprime-toi...</p>
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Partage un texte, une idée, une photo, une vidéo."
            className="input-neon mt-2 min-h-24 w-full rounded-2xl px-3 py-2 text-sm"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="wa-pill px-3 py-2 text-xs">Image</button>
            <button className="wa-pill px-3 py-2 text-xs">Vidéo</button>
            <button className="wa-pill px-3 py-2 text-xs">Texte</button>
            <button className="btn-neon ml-auto rounded-xl px-4 py-2 text-sm text-white">Publier</button>
          </div>
        </div>

        <div className="flex gap-2">
          {[
            { id: "recent", label: "Récent" },
            { id: "popular", label: "Populaire" },
            { id: "friends", label: "Amis" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id as FilterType)}
              className={`wa-pill px-3 py-2 text-xs ${filter === item.id ? "wa-pill-active" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {filteredPosts.map((post) => (
            <motion.article key={post.id} whileHover={{ y: -3 }} className="glass rounded-3xl p-4">
              <p className="text-sm font-semibold text-white">{post.user}</p>
              <p className="mt-2 text-sm text-slate-200">{post.text}</p>
              <img src={post.media} alt={post.text} className="mt-3 h-56 w-full rounded-2xl object-cover" />
              <div className="mt-3 flex gap-2">
                <button className="wa-pill px-3 py-2 text-xs">❤️ Like</button>
                <button className="wa-pill px-3 py-2 text-xs">💬 Commentaire</button>
                <button className="wa-pill px-3 py-2 text-xs">↗ Partage</button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </AuthGuard>
  );
}

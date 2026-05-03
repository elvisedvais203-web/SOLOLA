"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AuthGuard } from "../../components/nextalkauthguard";

const initialPosts = Array.from({ length: 8 }, (_, i) => ({
  id: `post-${i}`,
  user: ["Amina", "Malik", "Nora", "Temba"][i % 4],
  text: "Ambiance néon sur Solola ce soir. On partage nos idées, nos images et nos vibes.",
  media: `https://picsum.photos/seed/solola-${i}/900/650`,
  likes: 24 + i * 7,
  comments: 3 + i
}));

export default function DashboardPage() {
  const [posts, setPosts] = useState(initialPosts);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");

  const filteredPosts = useMemo(
    () => posts.filter((post) => post.user.toLowerCase().includes(query.toLowerCase()) || post.text.toLowerCase().includes(query.toLowerCase())),
    [posts, query]
  );

  const loadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setPosts((prev) => [
        ...prev,
        ...Array.from({ length: 4 }, (_, i) => ({
          id: `more-${prev.length + i}`,
          user: ["Elvis", "Maya", "Kioni"][i % 3],
          text: "Nouveau post chargé en lazy loading pour un feed fluide et immersif.",
          media: `https://picsum.photos/seed/solola-more-${prev.length + i}/900/650`,
          likes: 12 + i * 4,
          comments: 1 + i
        }))
      ]);
      setLoadingMore(false);
    }, 900);
  };

  return (
    <AuthGuard>
      <section className="mx-auto grid max-w-7xl gap-6 pb-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <header className="glass rounded-3xl p-4">
            <div className="flex items-center justify-between gap-3">
              <h1 className="font-heading text-2xl font-bold text-white">Bienvenue Elvis 👋</h1>
              <div className="relative">
                <button className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white">Notifications</button>
                <motion.span
                  className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-cyan-300"
                  animate={{ scale: [1, 1.35, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              </div>
            </div>
            <div className="mt-3">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher dans le feed..."
                className="input-neon w-full rounded-2xl px-4 py-3 text-sm"
              />
            </div>
          </header>

          <div className="glass rounded-3xl p-4">
            <div className="flex gap-3 overflow-x-auto pb-1">
              <button className="flex min-w-[90px] flex-col items-center gap-2 rounded-2xl border border-cyan-300/50 bg-white/5 p-2 text-xs text-white">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">+</span>
                Ajouter
              </button>
              {["Ayo", "Nina", "Kengo", "Liya", "Sami", "Yara"].map((name) => (
                <button key={name} className="flex min-w-[90px] flex-col items-center gap-2 rounded-2xl border border-white/15 bg-white/5 p-2 text-xs text-white transition hover:scale-105 hover:border-cyan-300/50">
                  <img src={`https://picsum.photos/seed/story-${name}/100/100`} alt={name} className="h-12 w-12 rounded-full object-cover" />
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="glass rounded-3xl p-4"
              >
                <div className="flex items-center gap-3">
                  <img src={`https://picsum.photos/seed/avatar-${post.user}/100/100`} alt={post.user} className="h-10 w-10 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-white">{post.user}</p>
                    <p className="text-xs text-slate-400">Il y a quelques instants</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-200">{post.text}</p>
                <img src={post.media} alt="Publication" className="mt-3 h-72 w-full rounded-2xl object-cover" />
                <div className="mt-3 flex gap-2">
                  <button className="wa-pill px-3 py-2 text-xs">❤️ {post.likes}</button>
                  <button className="wa-pill px-3 py-2 text-xs">💬 {post.comments}</button>
                  <button className="wa-pill px-3 py-2 text-xs">↗ Partager</button>
                </div>
              </motion.article>
            ))}

            {loadingMore ? (
              <div className="glass rounded-3xl p-4">
                <div className="h-4 w-36 animate-pulse rounded bg-white/10" />
                <div className="mt-3 h-64 animate-pulse rounded-2xl bg-white/10" />
              </div>
            ) : (
              <button onClick={loadMore} className="btn-neon w-full rounded-2xl px-4 py-3 text-sm text-white">
                Charger plus
              </button>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="glass rounded-3xl p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Suggestions</p>
            <div className="mt-3 space-y-2">
              {["Lina", "Baki", "Tino"].map((name) => (
                <div key={name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                  <p className="text-sm text-white">{name}</p>
                  <button className="wa-pill px-3 py-1 text-xs">Suivre</button>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-3xl p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Tendances</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-200">
              <li>#AfroFutureDesign</li>
              <li>#KinshasaStories</li>
              <li>#SololaCreators</li>
            </ul>
          </div>
        </aside>
      </section>
    </AuthGuard>
  );
}
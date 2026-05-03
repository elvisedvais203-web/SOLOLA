"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AuthGuard } from "../../components/nextalkauthguard";

export default function ChannelsPage() {
  const [q, setQ] = useState("");
  const [joined, setJoined] = useState<Record<string, boolean>>({});
  const channels = [
    { id: "solola-news", name: "Solola News", description: "Annonces officielles et nouveautés." },
    { id: "afrofuture-lab", name: "Afrofuture Lab", description: "Création design, néon et concepts." },
    { id: "creator-room", name: "Creator Room", description: "Tips growth, contenu et monétisation." }
  ];
  const filtered = useMemo(
    () => channels.filter((channel) => channel.name.toLowerCase().includes(q.toLowerCase()) || channel.description.toLowerCase().includes(q.toLowerCase())),
    [q]
  );

  return (
    <AuthGuard>
      <section className="mx-auto max-w-4xl space-y-4 pb-10">
        <h1 className="font-heading text-2xl font-bold text-white">Canaux Solola</h1>
        <div className="glass rounded-3xl p-4">
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            className="input-neon w-full rounded-2xl px-3 py-2 text-sm"
            placeholder="Trouver des canaux..."
          />
          <div className="mt-4 space-y-3">
            {filtered.map((channel) => (
              <motion.article key={channel.id} whileHover={{ scale: 1.01 }} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{channel.name}</h3>
                    <p className="text-xs text-slate-300">{channel.description}</p>
                  </div>
                  <button
                    onClick={() => setJoined((prev) => ({ ...prev, [channel.id]: !prev[channel.id] }))}
                    className="wa-pill px-3 py-2 text-xs"
                  >
                    {joined[channel.id] ? "Suivi" : "Rejoindre"}
                  </button>
                </div>
                <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-2 text-xs text-slate-300">
                  Flux du canal prêt (posts diffusion sans réponse obligatoire).
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </AuthGuard>
  );
}


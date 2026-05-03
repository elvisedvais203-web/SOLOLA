"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AuthGuard } from "../../components/nextalkauthguard";
 
const reelItems = Array.from({ length: 5 }, (_, i) => ({
  id: `reel-${i}`,
  user: ["Amina", "Elvis", "Kengo", "Maya"][i % 4],
  description: "Séquence immersive Solola avec ambiance futuriste et vibe afrofuturiste.",
  video: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
}));

export default function ReelsPage() {
  const [likes, setLikes] = useState<Record<string, number>>({});

  return (
    <AuthGuard>
      <section className="mx-auto max-w-md space-y-4 pb-16">
        <h1 className="font-heading text-2xl text-white">Reels / Stories</h1>
        <div className="h-[82vh] snap-y snap-mandatory overflow-y-auto rounded-3xl">
          {reelItems.map((item) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass relative mb-4 snap-start overflow-hidden rounded-3xl"
            >
              <video src={item.video} autoPlay loop muted playsInline className="h-[78vh] w-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <p className="text-sm font-semibold text-white">@{item.user}</p>
                <p className="mt-1 text-xs text-slate-200">{item.description}</p>
              </div>
              <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-2">
                <button
                  onClick={() => setLikes((prev) => ({ ...prev, [item.id]: (prev[item.id] ?? 0) + 1 }))}
                  className="wa-pill px-3 py-2 text-xs"
                >
                  ❤️ {(likes[item.id] ?? 0) + 40}
                </button>
                <button className="wa-pill px-3 py-2 text-xs">💬</button>
                <button className="wa-pill px-3 py-2 text-xs">↗</button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </AuthGuard>
  );
}

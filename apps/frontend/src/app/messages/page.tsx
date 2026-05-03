"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AuthGuard } from "../../components/nextalkauthguard";

const conversations = [
  { id: "1", name: "Amina", last: "On se parle ce soir ?", unread: 2, online: true },
  { id: "2", name: "Kengo", last: "Nouveau concept de reel prêt.", unread: 0, online: false },
  { id: "3", name: "Liya", last: "Envoie-moi la maquette ✨", unread: 5, online: true }
];

export default function MessagesPage() {
  const [active, setActive] = useState(conversations[0].id);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([
    { id: "m1", side: "left", text: "Bienvenue dans Solola Chat.", time: "21:02" },
    { id: "m2", side: "right", text: "Interface super fluide 👌", time: "21:03" }
  ]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <AuthGuard>
      <section className="grid min-h-[78vh] gap-4 md:grid-cols-[290px_1fr]">
        <aside className="glass rounded-3xl p-4">
          <input placeholder="Rechercher une conversation..." className="input-neon w-full rounded-2xl px-3 py-2 text-sm" />
          <div className="mt-3 space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActive(conv.id)}
                className={`w-full rounded-2xl border px-3 py-2 text-left ${active === conv.id ? "border-cyan-300/50 bg-white/10" : "border-white/10 bg-black/20"}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{conv.name}</p>
                  {conv.unread > 0 ? <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-xs text-cyan-200">{conv.unread}</span> : null}
                </div>
                <p className="mt-1 text-xs text-slate-400">{conv.last}</p>
                {conv.online ? <p className="mt-1 text-[11px] text-emerald-300">En ligne</p> : null}
              </button>
            ))}
          </div>
        </aside>

        <div className="glass flex flex-col rounded-3xl p-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h1 className="font-heading text-xl text-white">Messages Solola</h1>
            <p className="text-xs text-slate-400">{typing ? "En train d'écrire..." : "Temps réel prêt (backend à brancher)"}</p>
          </div>

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: message.side === "right" ? 16 : -16 }}
                animate={{ opacity: 1, x: 0 }}
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  message.side === "right" ? "ml-auto msg-bubble-out text-white" : "msg-bubble-in text-slate-100"
                }`}
              >
                <p>{message.text}</p>
                <p className="mt-1 text-[10px] text-slate-300">{message.time}</p>
              </motion.div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
            <button className="wa-pill px-2 py-1 text-xs">😊</button>
            <button className="wa-pill px-2 py-1 text-xs">📎</button>
            <button className="wa-pill px-2 py-1 text-xs">🎙️</button>
            <input
              value={draft}
              onFocus={() => setTyping(true)}
              onBlur={() => setTyping(false)}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Écrire un message..."
              className="input-neon flex-1 rounded-xl px-3 py-2 text-sm"
            />
            <button
              onClick={() => {
                if (!draft.trim()) return;
                setMessages((prev) => [...prev, { id: `m-${Date.now()}`, side: "right", text: draft.trim(), time: "Maintenant" }]);
                setDraft("");
              }}
              className="btn-neon rounded-xl px-4 py-2 text-sm text-white"
            >
              Envoyer
            </button>
          </div>
        </div>
      </section>
    </AuthGuard>
  );
}

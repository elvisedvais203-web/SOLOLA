"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGuard } from "../../components/nextalkauthguard";
import { SectionHeader } from "../../components/nextalksectionheader";
import { useSololaPlan } from "../../hooks/useSololaPlan";
import { getShopItems, placeShopOrder, type ShopItem } from "../../services/nextalkshop";
import { fetchCsrfToken } from "../../services/nextalksecurity";

export default function ShopPage() {
  const { can } = useSololaPlan();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShopItems()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const buy = async (itemId: string) => {
    if (!can("shop")) {
      setStatus("La boutique necessite un plan Pro.");
      return;
    }
    try {
      const csrf = await fetchCsrfToken();
      await placeShopOrder(itemId, csrf);
      setStatus("Commande enregistree (paiement a finaliser).");
    } catch {
      setStatus("Impossible de passer la commande.");
    }
  };

  return (
    <AuthGuard>
      <section className="mx-auto max-w-5xl space-y-4 pb-12">
        <SectionHeader title="Boutique Solola" accent="violet" />
        {!can("shop") ? (
          <div className="glass rounded-2xl p-4 text-sm text-slate-300">
            Passe au plan <Link href="/settings/plan" className="text-neoblue underline">Pro</Link> pour acheter des packs et boosts.
          </div>
        ) : null}
        {status ? <p className="text-sm text-slate-300">{status}</p> : null}
        {loading ? <p className="text-sm text-slate-400">Chargement...</p> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="glass overflow-hidden rounded-3xl border border-white/10">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="h-40 w-full object-cover" />
              ) : (
                <div className="h-40 bg-white/5" />
              )}
              <div className="p-4">
                <h2 className="font-semibold text-white">{item.title}</h2>
                <p className="mt-1 text-xs text-slate-400">{item.description}</p>
                <p className="mt-3 text-sm font-bold text-neoblue">
                  {(item.priceCents / 100).toFixed(2)} {item.currency}
                </p>
                <button
                  type="button"
                  onClick={() => void buy(item.id)}
                  className="btn-neon mt-3 w-full rounded-xl py-2 text-sm disabled:opacity-50"
                  disabled={!can("shop")}
                >
                  Commander
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AuthGuard>
  );
}

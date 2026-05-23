import api from "../lib/nextalkapi";

export type ShopItem = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  category: string;
};

export async function getShopItems() {
  const { data } = await api.get<ShopItem[]>("/shop/items");
  return data;
}

export async function placeShopOrder(itemId: string, csrfToken: string) {
  const { data } = await api.post("/shop/orders", { itemId }, { headers: { "x-csrf-token": csrfToken } });
  return data;
}

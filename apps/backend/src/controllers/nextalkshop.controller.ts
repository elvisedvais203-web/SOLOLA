import { Request, Response } from "express";
import { AuthRequest } from "../middleware/nextalkauth.middleware";
import { createShopOrder, listShopItems, listUserShopOrders } from "../services/nextalkshop.service";

export async function getShopItems(_req: Request, res: Response) {
  const items = await listShopItems();
  res.json(items);
}

export async function postShopOrder(req: AuthRequest, res: Response) {
  const { itemId } = req.body as { itemId?: string };
  const order = await createShopOrder(req.user!.userId, String(itemId ?? ""));
  res.status(201).json(order);
}

export async function getMyShopOrders(req: AuthRequest, res: Response) {
  const orders = await listUserShopOrders(req.user!.userId);
  res.json(orders);
}

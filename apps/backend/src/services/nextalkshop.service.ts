import { prisma } from "../config/nextalkdb";
import { ApiError } from "../utils/nextalkapierror";

export async function listShopItems() {
  return prisma.shopItem.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function createShopOrder(userId: string, itemId: string) {
  const item = await prisma.shopItem.findFirst({ where: { id: itemId, active: true } });
  if (!item) {
    throw new ApiError(404, "Article introuvable.");
  }

  return prisma.shopOrder.create({
    data: {
      userId,
      itemId: item.id,
      status: "PENDING"
    },
    include: { item: true }
  });
}

export async function listUserShopOrders(userId: string) {
  return prisma.shopOrder.findMany({
    where: { userId },
    include: { item: true },
    orderBy: { createdAt: "desc" },
    take: 50
  });
}

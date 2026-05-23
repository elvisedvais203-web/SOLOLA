import { Router } from "express";
import { authGuard } from "../middleware/nextalkauth.middleware";
import { csrfGuard } from "../middleware/nextalkcsrf.middleware";
import { getMyShopOrders, getShopItems, postShopOrder } from "../controllers/nextalkshop.controller";

const router = Router();

router.get("/items", getShopItems);
router.get("/orders/me", authGuard, getMyShopOrders);
router.post("/orders", authGuard, csrfGuard, postShopOrder);

export default router;

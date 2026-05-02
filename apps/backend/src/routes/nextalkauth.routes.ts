import { Router } from "express";
import {
  loginEmail,
  loginWithFirebase,
  refresh,
  registerEmail,
  requestReset,
  reset
} from "../controllers/nextalkauth.controller";
import { rejectEmailPasswordAuthWhenFirebaseOnly } from "../middleware/nextalkauthrestrict.middleware";
import { authLimiter } from "../middleware/nextalksecurity";

const router = Router();

router.post("/firebase/verify", authLimiter, loginWithFirebase);
router.post("/refresh", authLimiter, refresh);
router.post(
  "/email/register",
  authLimiter,
  rejectEmailPasswordAuthWhenFirebaseOnly,
  registerEmail
);
router.post("/email/login", authLimiter, rejectEmailPasswordAuthWhenFirebaseOnly, loginEmail);
router.post(
  "/password/request-reset",
  authLimiter,
  rejectEmailPasswordAuthWhenFirebaseOnly,
  requestReset
);
router.post("/password/reset", authLimiter, rejectEmailPasswordAuthWhenFirebaseOnly, reset);

export default router;

import { Router } from "express";
import {
  disable2fa,
  enable2fa,
  exportData,
  lockChat,
  removeLock,
  revokeAllSessions,
  sessions,
  setup2fa,
  unlockChat
} from "../controllers/nextalkaccount-security.controller";
import { addProfilePhoto, deleteMyAccount, myProfile, updateProfile, updateProfileSettings, verifyIdentity } from "../controllers/nextalkprofile.controller";
import { authGuard } from "../middleware/nextalkauth";
import { csrfGuard } from "../middleware/nextalkcsrf";

const router = Router();

router.get("/me", authGuard, myProfile);
router.patch("/me", authGuard, csrfGuard, updateProfile);
router.patch("/settings", authGuard, csrfGuard, updateProfileSettings);
router.post("/photo", authGuard, csrfGuard, addProfilePhoto);
router.delete("/me", authGuard, csrfGuard, deleteMyAccount);
router.post("/verify-identity", authGuard, csrfGuard, verifyIdentity);

router.post("/security/2fa/setup", authGuard, csrfGuard, setup2fa);
router.post("/security/2fa/enable", authGuard, csrfGuard, enable2fa);
router.post("/security/2fa/disable", authGuard, csrfGuard, disable2fa);
router.get("/security/sessions", authGuard, sessions);
router.post("/security/sessions/revoke-all", authGuard, csrfGuard, revokeAllSessions);
router.get("/security/export", authGuard, exportData);

export default router;

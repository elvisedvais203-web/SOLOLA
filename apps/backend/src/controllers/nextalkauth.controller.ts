import { Request, Response } from "express";
import { loginOrRegisterWithFirebaseIdentity, refreshTokens } from "../services/nextalkauth.service";
import { verifyFirebaseIdToken } from "../services/nextalkfirebase-admin.service";

export async function loginWithFirebase(req: Request, res: Response) {
  const { idToken, displayName } = req.body as { idToken?: string; displayName?: string };

  const decoded = await verifyFirebaseIdToken(String(idToken ?? ""));
  const data = await loginOrRegisterWithFirebaseIdentity({
    firebaseUid: decoded.uid,
    phoneNumber: decoded.phoneNumber ?? null,
    email: decoded.email ?? null,
    displayName,
    ipAddress: req.ip,
    userAgent: req.get("user-agent") ?? undefined
  });

  res.json(data);
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body;
  const data = await refreshTokens(refreshToken);
  res.json(data);
}

import { Response } from "express";
import { AuthRequest } from "../middleware/nextalkauth";
import {
  disableTwoFactor,
  enableTwoFactor,
  exportAccountData,
  invalidateAllSessions,
  listActiveSessions,
  removeChatLock,
  setChatLock,
  setupTwoFactor,
  unlockChatForSession
} from "../services/nextalkaccount-security.service";

export async function setup2fa(req: AuthRequest, res: Response) {
  const data = await setupTwoFactor(req.user!.userId);
  res.json(data);
}

export async function enable2fa(req: AuthRequest, res: Response) {
  const { token } = req.body as { token?: string };
  const data = await enableTwoFactor(req.user!.userId, String(token ?? ""));
  res.json(data);
}

export async function disable2fa(req: AuthRequest, res: Response) {
  const { token, password } = req.body as { token?: string; password?: string };
  const data = await disableTwoFactor(req.user!.userId, String(token ?? ""), String(password ?? ""));
  res.json(data);
}

export async function sessions(req: AuthRequest, res: Response) {
  const data = await listActiveSessions(req.user!.userId);
  res.json(data);
}

export async function revokeAllSessions(req: AuthRequest, res: Response) {
  const data = await invalidateAllSessions(req.user!.userId);
  res.json(data);
}

export async function exportData(req: AuthRequest, res: Response) {
  const data = await exportAccountData(req.user!.userId);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", 'attachment; filename="solola-export.json"');
  res.json(data);
}

export async function lockChat(req: AuthRequest, res: Response) {
  const chatId = String(req.params.chatId);
  const { pin } = req.body as { pin?: string };
  const data = await setChatLock(req.user!.userId, chatId, String(pin ?? ""));
  res.json(data);
}

export async function unlockChat(req: AuthRequest, res: Response) {
  const chatId = String(req.params.chatId);
  const { pin } = req.body as { pin?: string };
  const data = await unlockChatForSession(req.user!.userId, chatId, String(pin ?? ""));
  res.json(data);
}

export async function removeLock(req: AuthRequest, res: Response) {
  const chatId = String(req.params.chatId);
  const { pin } = req.body as { pin?: string };
  const data = await removeChatLock(req.user!.userId, chatId, String(pin ?? ""));
  res.json(data);
}

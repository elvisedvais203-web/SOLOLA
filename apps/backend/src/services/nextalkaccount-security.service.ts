import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../config/nextalkdb";
import { redis } from "../config/nextalkredis";
import { ApiError } from "../utils/nextalkapierror";
import { writeAuditLog } from "./nextalkaudit.service";

const CHAT_UNLOCK_PREFIX = "chat_unlock:";
const TWO_FACTOR_CHALLENGE_PREFIX = "2fa_challenge:";

function base32Encode(buffer: Buffer): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }
  return output;
}

function generateTotp(secret: string, step = 30, digits = 6): string {
  const counter = Math.floor(Date.now() / 1000 / step);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const key = Buffer.from(secret.replace(/[\s=]+/g, "").toUpperCase(), "utf8");
  const hmac = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 10 ** digits).padStart(digits, "0");
}

function verifyTotp(secret: string, token: string): boolean {
  const normalized = String(token ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) {
    return false;
  }
  for (const drift of [-1, 0, 1]) {
    const counter = Math.floor(Date.now() / 1000 / 30) + drift;
    const buf = Buffer.alloc(8);
    buf.writeBigUInt64BE(BigInt(counter));
    const key = Buffer.from(secret.replace(/[\s=]+/g, "").toUpperCase(), "utf8");
    const hmac = crypto.createHmac("sha1", key).update(buf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);
    const expected = String(code % 1_000_000).padStart(6, "0");
    if (expected === normalized) {
      return true;
    }
  }
  return false;
}

export async function setupTwoFactor(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "Utilisateur introuvable.");
  }
  const secret = base32Encode(crypto.randomBytes(20));
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret, twoFactorEnabled: false }
  });
  const label = encodeURIComponent(user.email ?? user.phone ?? user.id);
  const issuer = encodeURIComponent("Solola");
  const otpauthUrl = `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}&digits=6&period=30`;
  return { secret, otpauthUrl };
}

export async function enableTwoFactor(userId: string, token: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.twoFactorSecret) {
    throw new ApiError(400, "Configurez d'abord la 2FA.");
  }
  if (!verifyTotp(user.twoFactorSecret, token)) {
    throw new ApiError(400, "Code 2FA invalide.");
  }
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true }
  });
  await writeAuditLog({
    userId,
    action: "TWO_FACTOR_ENABLED",
    method: "POST",
    path: "/account/security/2fa/enable",
    statusCode: 200
  });
  return { ok: true };
}

export async function disableTwoFactor(userId: string, token: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.twoFactorSecret || !user.twoFactorEnabled) {
    return { ok: true };
  }
  const okPass = await bcrypt.compare(String(password ?? ""), user.passwordHash);
  if (!okPass) {
    throw new ApiError(401, "Mot de passe incorrect.");
  }
  if (!verifyTotp(user.twoFactorSecret, token)) {
    throw new ApiError(400, "Code 2FA invalide.");
  }
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: false, twoFactorSecret: null }
  });
  return { ok: true };
}

export async function createTwoFactorChallenge(userId: string) {
  const challengeId = crypto.randomUUID();
  await redis.set(`${TWO_FACTOR_CHALLENGE_PREFIX}${challengeId}`, userId, "EX", 300);
  return { challengeId, expiresInSec: 300 };
}

export async function resolveTwoFactorChallenge(challengeId: string, token: string) {
  const userId = await redis.get(`${TWO_FACTOR_CHALLENGE_PREFIX}${challengeId}`);
  if (!userId) {
    throw new ApiError(400, "Challenge 2FA expire.");
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.twoFactorSecret || !verifyTotp(user.twoFactorSecret, token)) {
    throw new ApiError(401, "Code 2FA invalide.");
  }
  await redis.del(`${TWO_FACTOR_CHALLENGE_PREFIX}${challengeId}`);
  return user;
}

export async function listActiveSessions(userId: string) {
  const rows = await prisma.loginEvent.findMany({
    where: { userId, success: true },
    orderBy: { createdAt: "desc" },
    take: 25
  });
  return rows.map((row) => ({
    id: row.id,
    identifier: row.identifier,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    reason: row.reason,
    createdAt: row.createdAt
  }));
}

export async function invalidateAllSessions(userId: string) {
  await writeAuditLog({
    userId,
    action: "ACCOUNT_SESSION_INVALIDATED",
    method: "POST",
    path: "/account/security/sessions/revoke-all",
    statusCode: 200
  });
  return { ok: true };
}

export async function exportAccountData(userId: string) {
  const [user, profile, settings, conversations, posts, loginEvents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        username: true,
        planTier: true,
        role: true,
        createdAt: true
      }
    }),
    prisma.profile.findUnique({ where: { userId } }),
    prisma.userSettings.findUnique({ where: { userId } }),
    prisma.chatMember.findMany({
      where: { userId },
      include: {
        chat: {
          include: {
            messages: { orderBy: { createdAt: "desc" }, take: 50 }
          }
        }
      }
    }),
    prisma.feedPost.findMany({ where: { authorId: userId }, take: 100, orderBy: { createdAt: "desc" } }),
    prisma.loginEvent.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 })
  ]);

  return {
    exportedAt: new Date().toISOString(),
    user,
    profile,
    settings,
    conversations: conversations.map((m) => ({
      chatId: m.chatId,
      role: m.role,
      archivedAt: m.archivedAt,
      messages: m.chat.messages
    })),
    posts,
    loginEvents
  };
}

export async function setChatLock(userId: string, chatId: string, pin: string) {
  const pinNorm = String(pin ?? "").trim();
  if (!/^\d{4,8}$/.test(pinNorm)) {
    throw new ApiError(400, "PIN invalide (4 a 8 chiffres).");
  }
  await ensureMember(userId, chatId);
  const hash = await bcrypt.hash(pinNorm, 10);
  await prisma.chatMember.update({
    where: { chatId_userId: { chatId, userId } },
    data: { lockPinHash: hash }
  });
  return { ok: true };
}

export async function removeChatLock(userId: string, chatId: string, pin: string) {
  const member = await ensureMember(userId, chatId);
  if (!member.lockPinHash) {
    return { ok: true };
  }
  const ok = await bcrypt.compare(String(pin ?? ""), member.lockPinHash);
  if (!ok) {
    throw new ApiError(401, "PIN incorrect.");
  }
  await prisma.chatMember.update({
    where: { chatId_userId: { chatId, userId } },
    data: { lockPinHash: null }
  });
  await redis.del(`${CHAT_UNLOCK_PREFIX}${userId}:${chatId}`);
  return { ok: true };
}

export async function unlockChatForSession(userId: string, chatId: string, pin: string) {
  const member = await ensureMember(userId, chatId);
  if (!member.lockPinHash) {
    return { ok: true, unlocked: true };
  }
  const ok = await bcrypt.compare(String(pin ?? ""), member.lockPinHash);
  if (!ok) {
    throw new ApiError(401, "PIN incorrect.");
  }
  await redis.set(`${CHAT_UNLOCK_PREFIX}${userId}:${chatId}`, "1", "EX", 60 * 30);
  return { ok: true, unlocked: true };
}

export async function assertChatUnlocked(userId: string, chatId: string) {
  const member = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } }
  });
  if (!member) {
    throw new ApiError(404, "Conversation introuvable");
  }
  if (!member.lockPinHash) {
    return;
  }
  const unlocked = await redis.get(`${CHAT_UNLOCK_PREFIX}${userId}:${chatId}`);
  if (!unlocked) {
    throw new ApiError(403, "Conversation verrouillee. Entrez le PIN.");
  }
}

async function ensureMember(userId: string, chatId: string) {
  const member = await prisma.chatMember.findUnique({
    where: { chatId_userId: { chatId, userId } }
  });
  if (!member) {
    throw new ApiError(404, "Conversation introuvable");
  }
  return member;
}

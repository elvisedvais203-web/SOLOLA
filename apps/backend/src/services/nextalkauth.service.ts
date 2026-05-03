import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../config/nextalkdb";
import { env } from "../config/nextalkenv";
import { ApiError } from "../utils/nextalkapierror";
import { normalizeInternationalPhone } from "../utils/nextalkphone";
import { getAccountRestriction } from "./nextalkaccount-restriction.service";

function issueTokens(userId: string, planTier: "FREE" | "PREMIUM", role: "USER" | "ADMIN" | "SUPERADMIN") {
  const accessExpiresIn = env.jwtAccessTtl as jwt.SignOptions["expiresIn"];
  const refreshExpiresIn = env.jwtRefreshTtl as jwt.SignOptions["expiresIn"];

  const accessToken = jwt.sign({ userId, planTier, role }, env.jwtAccessSecret, {
    expiresIn: accessExpiresIn
  });

  const refreshToken = jwt.sign({ userId }, env.jwtRefreshSecret, {
    expiresIn: refreshExpiresIn
  });

  return { accessToken, refreshToken };
}

/** Utilisateur renvoyé au client (jamais de mot de passe ni champs sensibles). */
export type PublicAuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  planTier: "FREE" | "PREMIUM";
  role: "USER" | "ADMIN" | "SUPERADMIN";
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
};

export async function loadPublicAuthUser(userId: string): Promise<PublicAuthUser> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { profile: true }
  });
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    planTier: user.planTier,
    role: user.role,
    displayName: user.profile?.displayName ?? null,
    firstName: user.profile?.firstName ?? null,
    lastName: user.profile?.lastName ?? null
  };
}

export async function refreshTokens(refreshToken: string) {
  try {
    const payload = jwt.verify(refreshToken, env.jwtRefreshSecret) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      throw new ApiError(401, "Refresh token invalide");
    }

    return {
      user: await loadPublicAuthUser(user.id),
      tokens: issueTokens(user.id, user.planTier, user.role)
    };
  } catch {
    throw new ApiError(401, "Refresh token invalide");
  }
}

function normalizeEmail(raw: string) {
  return String(raw ?? "").trim().toLowerCase();
}

export async function loginOrRegisterWithFirebaseIdentity(input: {
  firebaseUid: string;
  phoneNumber?: string | null;
  email?: string | null;
  displayName?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const firebaseUid = String(input.firebaseUid ?? "").trim();
  if (!firebaseUid) {
    throw new ApiError(400, "Informations Firebase invalides.");
  }

  const email = input.email ? normalizeEmail(String(input.email)) : null;
  let phone: string | null = null;
  if (input.phoneNumber) {
    phone = normalizeInternationalPhone(String(input.phoneNumber).trim());
  }

  let user =
    (await prisma.user.findFirst({ where: { firebaseUid } })) ??
    (email ? await prisma.user.findFirst({ where: { email } }) : null) ??
    (phone ? await prisma.user.findFirst({ where: { phone } }) : null);

  if (!user) {
    const passwordHash = await bcrypt.hash(crypto.randomUUID(), 12);
    const defaultName =
      String(input.displayName ?? "").trim() ||
      (email ? email.split("@")[0]! : `User-${firebaseUid.slice(0, 8)}`);
    const nameParts = defaultName.split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] ?? defaultName;
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : firstName;
    user = await prisma.user.create({
      data: {
        firebaseUid,
        phone: phone ?? undefined,
        email: email ?? undefined,
        passwordHash,
        otpVerified: true,
        profile: {
          create: {
            displayName: defaultName,
            firstName,
            lastName,
            interests: []
          }
        },
        settings: {
          create: {}
        }
      }
    });
  } else {
    const needsUpdate =
      !user.firebaseUid ||
      user.firebaseUid !== firebaseUid ||
      (phone != null && user.phone !== phone) ||
      (email != null && !user.email);
    if (needsUpdate) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firebaseUid,
          otpVerified: true,
          ...(phone != null ? { phone } : {}),
          ...(email != null && !user.email ? { email } : {})
        }
      });
    }
  }

  const restriction = await getAccountRestriction(user.id);
  if (restriction.active) {
    if (restriction.type === "BANNED") {
      throw new ApiError(403, "Ce compte est banni. Contactez le support.");
    }
    throw new ApiError(
      403,
      restriction.until
        ? `Compte suspendu jusqu'au ${new Date(restriction.until).toLocaleString("fr-FR")}.`
        : "Compte suspendu temporairement."
    );
  }

  const identifier = phone ?? email ?? firebaseUid;
  const reason = phone
    ? "FIREBASE_PHONE_LOGIN"
    : email
      ? "FIREBASE_EMAIL_LOGIN"
      : "FIREBASE_OAUTH_LOGIN";

  await prisma.loginEvent.create({
    data: {
      userId: user.id,
      identifier,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      success: true,
      reason
    }
  });

  return {
    user: await loadPublicAuthUser(user.id),
    tokens: issueTokens(user.id, user.planTier, user.role)
  };
}

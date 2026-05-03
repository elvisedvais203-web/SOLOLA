import bcrypt from "bcryptjs";
import { prisma } from "../config/nextalkdb";
import { env } from "../config/nextalkenv";
import { logger } from "../utils/nextalklogger";
import { normalizeRdcPhone } from "../utils/nextalkphone";

function splitSuperAdminProfile(full: string): { displayName: string; firstName: string; lastName: string } {
  const displayName = full.trim() || "Super Admin";
  const parts = displayName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { displayName: "Super Admin", firstName: "Super", lastName: "Admin" };
  }
  if (parts.length === 1) {
    return { displayName: parts[0]!, firstName: parts[0]!, lastName: "-" };
  }
  return { displayName, firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

async function ensureSuperAdmin(): Promise<void> {
  if (!env.superAdminEmail || !env.superAdminPhone || !env.superAdminPassword) {
    return;
  }

  const normalizedPhone = normalizeRdcPhone(env.superAdminPhone);
  const passwordHash = await bcrypt.hash(env.superAdminPassword, 12);
  const { displayName, firstName, lastName } = splitSuperAdminProfile(process.env.SUPERADMIN_NAME?.trim() || "Super Admin");
  const createdAt = process.env.SUPERADMIN_CREATED_AT ? new Date(process.env.SUPERADMIN_CREATED_AT) : undefined;

  const user = await prisma.user.upsert({
    where: { phone: normalizedPhone },
    update: {
      email: env.superAdminEmail,
      passwordHash,
      otpVerified: true,
      role: "SUPERADMIN",
      planTier: "PREMIUM"
    },
    create: {
      phone: normalizedPhone,
      email: env.superAdminEmail,
      passwordHash,
      otpVerified: true,
      role: "SUPERADMIN",
      planTier: "PREMIUM",
      ...(createdAt ? { createdAt } : {}),
      profile: {
        create: {
          displayName,
          firstName,
          lastName,
          bio: "Compte fondateur",
          city: "Kinshasa",
          interests: ["admin", "security", "growth"],
          verifiedBadge: true
        }
      },
      settings: {
        create: {}
      }
    }
  });

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      displayName,
      firstName,
      lastName,
      bio: "Compte fondateur",
      city: "Kinshasa",
      interests: ["admin", "security", "growth"],
      verifiedBadge: true
    },
    create: {
      userId: user.id,
      displayName,
      firstName,
      lastName,
      bio: "Compte fondateur",
      city: "Kinshasa",
      interests: ["admin", "security", "growth"],
      verifiedBadge: true
    }
  });

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id }
  });

  logger.info("Superadmin verifie au demarrage", {
    email: env.superAdminEmail,
    phone: normalizedPhone
  });
}

export async function ensureBootstrapData(): Promise<void> {
  try {
    await ensureSuperAdmin();
  } catch (error) {
    logger.warn("Bootstrap superadmin ignore", {
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
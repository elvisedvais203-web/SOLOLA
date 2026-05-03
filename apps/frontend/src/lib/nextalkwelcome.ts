import type { AppUser } from "./nextalksession";

/** Prénom pour les messages du type « Bienvenue X ». */
export function getWelcomeFirstName(user: AppUser | null): string {
  if (!user) return "toi";
  if (user.firstName?.trim()) return user.firstName.trim();
  if (user.displayName?.trim()) {
    const first = user.displayName.trim().split(/\s+/)[0];
    if (first) return first;
  }
  if (user.email?.trim()) return user.email.trim().split("@")[0] ?? "toi";
  if (user.phone?.trim()) return user.phone.trim();
  return "toi";
}

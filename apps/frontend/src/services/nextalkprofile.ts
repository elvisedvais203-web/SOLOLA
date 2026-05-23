import api from "../lib/nextalkapi";

export type UserSettingsPayload = {
  language?: "FR" | "SW" | "EN";
  theme?: "dark" | "light";
  chatTheme?: "classic" | "aqua" | "sunset";
  chatAnimations?: boolean;
  readReceipts?: boolean;
  autoSaveMedia?: boolean;
  voiceTranscriptMode?: "NEVER" | "MANUAL";
  profileVisibility?: "VISIBLE" | "HIDDEN";
  messagePolicy?: "ALL" | "MATCH_ONLY";
  hideOnlineStatus?: boolean;
  notifMessages?: boolean;
  notifLikes?: boolean;
  notifCalls?: boolean;
  storyVisibility?: "PUBLIC" | "FOLLOWERS";
};

export async function getMyProfile() {
  const { data } = await api.get("/profile/me");
  return data;
}

export async function updateProfileSettings(payload: UserSettingsPayload, csrfToken: string) {
  const { data } = await api.patch("/profile/settings", payload, {
    headers: { "x-csrf-token": csrfToken }
  });
  return data;
}

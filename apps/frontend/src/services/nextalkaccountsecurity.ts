import api from "../lib/nextalkapi";

export async function setup2fa(csrfToken: string) {
  const { data } = await api.post("/profile/security/2fa/setup", {}, {
    headers: { "x-csrf-token": csrfToken }
  });
  return data as { secret: string; otpauthUrl: string };
}

export async function enable2fa(token: string, csrfToken: string) {
  const { data } = await api.post(
    "/profile/security/2fa/enable",
    { token },
    { headers: { "x-csrf-token": csrfToken } }
  );
  return data;
}

export async function disable2fa(token: string, password: string, csrfToken: string) {
  const { data } = await api.post(
    "/profile/security/2fa/disable",
    { token, password },
    { headers: { "x-csrf-token": csrfToken } }
  );
  return data;
}

export async function listSessions() {
  const { data } = await api.get("/profile/security/sessions");
  return data as Array<{
    id: string;
    identifier: string;
    ipAddress?: string;
    userAgent?: string;
    reason?: string;
    createdAt: string;
  }>;
}

export async function revokeAllSessions(csrfToken: string) {
  const { data } = await api.post(
    "/profile/security/sessions/revoke-all",
    {},
    { headers: { "x-csrf-token": csrfToken } }
  );
  return data;
}

export async function downloadAccountExport() {
  const { data } = await api.get("/profile/security/export");
  return data;
}

export async function lockChat(chatId: string, pin: string, csrfToken: string) {
  const { data } = await api.post(`/chats/${chatId}/lock`, { pin }, { headers: { "x-csrf-token": csrfToken } });
  return data;
}

export async function unlockChat(chatId: string, pin: string, csrfToken: string) {
  const { data } = await api.post(`/chats/${chatId}/unlock`, { pin }, { headers: { "x-csrf-token": csrfToken } });
  return data;
}

export async function removeChatLock(chatId: string, pin: string, csrfToken: string) {
  const { data } = await api.delete(`/chats/${chatId}/lock`, {
    data: { pin },
    headers: { "x-csrf-token": csrfToken }
  });
  return data;
}

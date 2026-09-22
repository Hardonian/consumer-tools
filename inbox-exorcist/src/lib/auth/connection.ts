import { AppError } from "../errors.ts";
import { GmailHttpClient } from "../gmail/client.ts";
import { refreshGoogleAccessToken } from "../gmail/oauth.ts";
import { decryptSecret, encryptSecret } from "../security/crypto.ts";
import { getSessionUserId } from "../security/session.ts";
import type { AppStore } from "../storage/store.ts";
import { nowIso } from "../ids.ts";

export async function requireUserId() {
  const userId = await getSessionUserId();
  if (!userId) {
    throw new AppError({
      code: "UNAUTHENTICATED",
      message: "Connect Gmail before using InboxExorcist.",
      retryable: false,
      status: 401,
      degraded: true,
    });
  }
  return userId;
}

export async function requireGmailClient(store: AppStore) {
  const userId = await requireUserId();
  const connection = await store.getConnection(userId);
  if (!connection || connection.status === "disconnected") {
    throw new AppError({
      code: "GMAIL_DISCONNECTED",
      message: "Gmail is disconnected. Connect Gmail to scan.",
      retryable: false,
      status: 401,
      degraded: true,
    });
  }

  if (connection.status === "insufficient_scopes") {
    throw new AppError({
      code: "INSUFFICIENT_SCOPES",
      message: "Gmail did not grant enough access to quiet senders.",
      retryable: false,
      status: 403,
      degraded: true,
    });
  }

  let activeConnection = connection;
  const expiresSoon = new Date(connection.tokenExpiresAt).getTime() < Date.now() + 60_000;
  if (expiresSoon) {
    const refreshed = await refreshGoogleAccessToken(connection);
    activeConnection = {
      ...connection,
      encryptedAccessToken: encryptSecret(refreshed.access_token),
      tokenExpiresAt: new Date(
        Date.now() + (refreshed.expires_in || 3600) * 1000,
      ).toISOString(),
      updatedAt: nowIso(),
    };
    await store.saveConnection(activeConnection);
  }

  return {
    userId,
    connection: activeConnection,
    gmail: new GmailHttpClient(decryptSecret(activeConnection.encryptedAccessToken)),
  };
}

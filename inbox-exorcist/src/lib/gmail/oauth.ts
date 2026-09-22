import { getRuntimeConfig } from "../config.ts";
import type { GmailConnection } from "../domain.ts";
import { AppError } from "../errors.ts";
import { encryptSecret, decryptSecret } from "../security/crypto.ts";
import { hashPii } from "../security/hash.ts";
import { buildRequestedScopes, hasRequiredScopes } from "./scopes.ts";
import { newId, nowIso } from "../ids.ts";

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type: string;
};

type GoogleProfile = {
  email?: string;
};

export function assertGoogleConfigured() {
  const config = getRuntimeConfig();
  if (!config.googleClientId || !config.googleClientSecret) {
    throw new AppError({
      code: "GOOGLE_OAUTH_NOT_CONFIGURED",
      message: "Google OAuth is not configured yet.",
      retryable: false,
      status: 503,
      degraded: true,
    });
  }
  return config;
}

export function buildGoogleOAuthUrl(state: string) {
  const config = assertGoogleConfigured();
  const scopes = buildRequestedScopes({
    includeSend: process.env.GMAIL_ENABLE_MAILTO_UNSUBSCRIBE === "true",
  });
  const params = new URLSearchParams({
    client_id: config.googleClientId || "",
    redirect_uri: config.googleRedirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string) {
  const config = assertGoogleConfigured();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.googleClientId || "",
      client_secret: config.googleClientSecret || "",
      redirect_uri: config.googleRedirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    throw new AppError({
      code: "GOOGLE_TOKEN_EXCHANGE_FAILED",
      message: "Google OAuth callback could not be completed.",
      retryable: true,
      status: 502,
      degraded: true,
    });
  }

  return (await response.json()) as TokenResponse;
}

export async function refreshGoogleAccessToken(connection: GmailConnection) {
  const refreshToken = connection.encryptedRefreshToken
    ? decryptSecret(connection.encryptedRefreshToken)
    : undefined;

  if (!refreshToken) {
    throw new AppError({
      code: "GMAIL_RECONNECT_REQUIRED",
      message: "Gmail needs to be reconnected.",
      retryable: false,
      status: 401,
      degraded: true,
    });
  }

  const config = assertGoogleConfigured();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: config.googleClientId || "",
      client_secret: config.googleClientSecret || "",
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new AppError({
      code: "GMAIL_AUTH_EXPIRED",
      message: "Gmail disconnected. Please reconnect and retry.",
      retryable: true,
      status: 401,
      degraded: true,
    });
  }

  return (await response.json()) as TokenResponse;
}

export async function fetchGoogleProfile(accessToken: string) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new AppError({
      code: "GOOGLE_PROFILE_FAILED",
      message: "Could not read the connected Gmail account email.",
      retryable: true,
      status: 502,
      degraded: true,
    });
  }

  return (await response.json()) as GoogleProfile;
}

export async function buildConnectionFromTokens({
  userId,
  tokens,
}: {
  userId: string;
  tokens: TokenResponse;
}): Promise<GmailConnection> {
  const scopes = (tokens.scope || "").split(/\s+/).filter(Boolean);
  const profile = await fetchGoogleProfile(tokens.access_token);
  const email = profile.email || "unknown@gmail.local";
  const now = nowIso();

  return {
    id: newId("gmail"),
    userId,
    gmailEmailHash: hashPii(email),
    gmailEmailEncrypted: encryptSecret(email),
    encryptedAccessToken: encryptSecret(tokens.access_token),
    encryptedRefreshToken: tokens.refresh_token
      ? encryptSecret(tokens.refresh_token)
      : undefined,
    tokenExpiresAt: new Date(
      Date.now() + (tokens.expires_in || 3600) * 1000,
    ).toISOString(),
    scopes,
    status: hasRequiredScopes(scopes) ? "connected" : "insufficient_scopes",
    createdAt: now,
    updatedAt: now,
  };
}

export async function revokeGoogleToken(connection: GmailConnection) {
  const token = decryptSecret(connection.encryptedAccessToken);
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });
}

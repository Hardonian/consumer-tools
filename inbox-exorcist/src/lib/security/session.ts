import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { isProduction } from "../config.ts";

export const sessionCookieName = "ie_session";
export const oauthStateCookieName = "ie_oauth_state";

function getSessionSecret() {
  const secret =
    process.env.SESSION_SECRET ||
    (isProduction() ? undefined : "inboxexorcist-local-session-secret");

  if (!secret) {
    throw new Error("SESSION_SECRET is required in production");
  }

  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function signedValue(value: string) {
  return `${value}.${sign(value)}`;
}

export function verifySignedValue(payload?: string) {
  if (!payload) {
    return null;
  }

  const index = payload.lastIndexOf(".");
  if (index < 1) {
    return null;
  }

  const value = payload.slice(0, index);
  const signature = payload.slice(index + 1);
  const expected = sign(value);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  return value;
}

export async function getSessionUserId() {
  const cookieStore = await cookies();
  return verifySignedValue(cookieStore.get(sessionCookieName)?.value);
}

export async function setSessionUserId(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, signedValue(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function createOauthStateCookie() {
  const state = randomBytes(24).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set(oauthStateCookieName, signedValue(state), {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    maxAge: 60 * 10,
  });
  return state;
}

export async function verifyOauthState(state?: string | null) {
  const cookieStore = await cookies();
  const stored = verifySignedValue(cookieStore.get(oauthStateCookieName)?.value);
  cookieStore.delete(oauthStateCookieName);
  return Boolean(state && stored && state === stored);
}

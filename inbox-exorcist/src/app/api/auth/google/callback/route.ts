import { NextRequest, NextResponse } from "next/server";

import {
  buildConnectionFromTokens,
  exchangeGoogleCode,
} from "@/lib/gmail/oauth";
import { newId } from "@/lib/ids";
import { setSessionUserId, verifyOauthState } from "@/lib/security/session";
import { getStore } from "@/lib/storage";
import { recordDiagnosticEvent } from "@/lib/diagnostics/events.ts";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const appUrl = request.nextUrl.origin;
  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (error) {
    recordDiagnosticEvent("anonymous", "oauth_failed", {
      error,
      source: "google_callback_redirect",
    }, true);
    return NextResponse.redirect(
      new URL(`/auth/error?code=${encodeURIComponent(error)}`, appUrl),
    );
  }

  if (!code || !(await verifyOauthState(state))) {
    recordDiagnosticEvent("anonymous", "oauth_failed", {
      error: "OAUTH_STATE_INVALID",
    }, true);
    return NextResponse.redirect(new URL("/auth/error?code=OAUTH_STATE_INVALID", appUrl));
  }

  let userId = "anonymous";
  try {
    const tokens = await exchangeGoogleCode(code);
    userId = newId("user");
    const connection = await buildConnectionFromTokens({ userId, tokens });
    const store = getStore();
    await store.upsertUser(userId);
    await store.saveConnection(connection);
    await setSessionUserId(userId);

    recordDiagnosticEvent(userId, "oauth_completed", {
      scopes: connection.scopes,
      status: connection.status,
    });

    if (connection.status === "insufficient_scopes") {
      recordDiagnosticEvent(userId, "oauth_failed", {
        error: "INSUFFICIENT_SCOPES",
        grantedScopes: connection.scopes,
      }, true);
      return NextResponse.redirect(
        new URL("/auth/error?code=INSUFFICIENT_SCOPES", appUrl),
      );
    }

    return NextResponse.redirect(new URL("/scan?connected=1", appUrl));
  } catch (callbackError) {
    const errorCode =
      callbackError instanceof Error && "code" in callbackError
        ? String((callbackError as Error & { code?: string }).code)
        : "GOOGLE_CALLBACK_FAILED";
    recordDiagnosticEvent(userId ?? "anonymous", "oauth_failed", {
      error: errorCode,
    }, true, { code: errorCode, message: String(callbackError) });
    return NextResponse.redirect(
      new URL(`/auth/error?code=${encodeURIComponent(errorCode)}`, appUrl),
    );
  }
}

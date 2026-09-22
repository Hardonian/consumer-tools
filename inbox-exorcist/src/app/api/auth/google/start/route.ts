import { NextRequest, NextResponse } from "next/server";

import { buildGoogleOAuthUrl } from "@/lib/gmail/oauth";
import { createOauthStateCookie } from "@/lib/security/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const state = await createOauthStateCookie();
    return NextResponse.redirect(buildGoogleOAuthUrl(state));
  } catch (error) {
    const code =
      error instanceof Error && "code" in error
        ? String((error as Error & { code?: string }).code)
        : "GOOGLE_OAUTH_NOT_CONFIGURED";
    return NextResponse.redirect(
      new URL(`/auth/error?code=${encodeURIComponent(code)}`, request.url),
    );
  }
}

import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (
    process.env.INBOXEXORCIST_E2E === "1" &&
    pathname === "/preview/mock"
  ) {
    return NextResponse.next();
  }

  if (!request.cookies.get("ie_session")?.value) {
    return NextResponse.redirect(new URL("/scan", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/preview/:path*", "/success/:path*", "/settings"],
};

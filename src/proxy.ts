import { NextResponse, type NextRequest } from "next/server";

// Optimistic gate only: redirects signed-out visitors early. Real authorisation
// (session validity and roles) is enforced in every page and Route Handler.
const SESSION_COOKIE = "bnb_session";

export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*", "/admin/:path*"],
};

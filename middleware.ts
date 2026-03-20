import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  const publicPaths = ["/login", "/signup"];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));
  const isAuthApi = pathname.startsWith("/api/auth");

  if (isPublicPath || isAuthApi) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionToken =
    request.cookies.get("better-auth.session_token")?.value;

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};

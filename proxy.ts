import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { verifyAuthTokenEdge } from "@/lib/auth-jwt-edge";

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    const payload = token ? await verifyAuthTokenEdge(token) : null;

    if (!payload) {
      const signInUrl = new URL("/signin", req.url);
      signInUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(signInUrl);
    }

    if (payload.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

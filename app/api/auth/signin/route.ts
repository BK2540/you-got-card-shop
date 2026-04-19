import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { signAuthToken } from "@/lib/auth-jwt";
import { toPublicUser, validateCredentials } from "@/lib/auth-store";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email?.trim() || "";
    const password = body.password?.trim() || "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 },
      );
    }

    const result = await validateCredentials({ email, password });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    const user = toPublicUser(result.user);
    const token = signAuthToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({ user });
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Failed to sign in." }, { status: 500 });
  }
}

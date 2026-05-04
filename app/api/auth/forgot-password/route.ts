import { NextResponse } from "next/server";
import { createPasswordResetToken } from "@/lib/auth-store";
import { sendPasswordResetEmail } from "@/lib/email/templates";

const getAppOrigin = (req: Request) => {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "";

  if (configuredOrigin) {
    return configuredOrigin.replace(/\/$/, "");
  }

  return new URL(req.url).origin;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email is required." },
        { status: 400 },
      );
    }

    const result = await createPasswordResetToken(email);

    if (!result.user || !result.token) {
      return NextResponse.json(
        { error: "This email has not registered." },
        { status: 404 },
      );
    }

    const resetUrl = `${getAppOrigin(req)}/reset-password?token=${encodeURIComponent(
      result.token,
    )}`;

    const emailResult = await sendPasswordResetEmail({
      name: result.user.name,
      email: result.user.email,
      resetUrl,
    });

    if (!emailResult.ok) {
      console.error("Failed to send password reset email", {
        email,
        error: emailResult.error,
      });
      return NextResponse.json(
        { error: "Failed to send reset email. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Sent reset password link to your email.",
    });
  } catch (error) {
    console.error("Forgot password failed", error);
    return NextResponse.json(
      { error: "Failed to request reset link." },
      { status: 500 },
    );
  }
}

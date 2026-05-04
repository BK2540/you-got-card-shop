import { NextResponse } from "next/server";
import { createPasswordResetToken } from "@/lib/auth-store";
import { sendPasswordResetEmail } from "@/lib/email/templates";

const genericMessage =
  "If that email is registered, a reset link has been sent.";

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

    if (result.user && result.token) {
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
      }
    }

    return NextResponse.json({ message: genericMessage });
  } catch (error) {
    console.error("Forgot password failed", error);
    return NextResponse.json({ message: genericMessage });
  }
}

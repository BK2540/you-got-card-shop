import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/auth-store";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      token?: string;
      password?: string;
    };

    const result = await resetPasswordWithToken({
      token: body.token ?? "",
      password: body.password ?? "",
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: "Your password has been reset. You can sign in now.",
    });
  } catch (error) {
    console.error("Reset password failed", error);
    return NextResponse.json(
      { error: "Failed to reset password." },
      { status: 500 },
    );
  }
}

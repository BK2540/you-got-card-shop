// app/api/cards/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // later connect DB here
  return NextResponse.json([
    { id: 1, name: "Zion Williamson" },
  ]);
}

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET all cards
export async function GET() {
  const cards = await prisma.card.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(cards);
}

// CREATE card
export async function POST(req: Request) {
  const body = await req.json();

  const card = await prisma.card.create({
    data: body,
  });

  return NextResponse.json(card);
}
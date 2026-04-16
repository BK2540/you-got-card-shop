import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET home content
export async function GET() {
  const content = await prisma.homeContent.findFirst({
    include: { featured: true },
  });

  return NextResponse.json(content);
}

// UPDATE home content
export async function PUT(req: Request) {
  const body = await req.json();

  const updated = await prisma.homeContent.upsert({
    where: { id: body.id || "" },
    update: body,
    create: body,
  });

  return NextResponse.json(updated);
}
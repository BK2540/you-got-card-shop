
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// DELETE
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  await prisma.card.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
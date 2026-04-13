import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const customers = await prisma.customer.findMany();

  return NextResponse.json(customers);
}
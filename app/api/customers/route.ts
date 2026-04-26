import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth-server";

export async function GET(req: Request) {
  const auth = getAuthFromRequest(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customersWithOrders = await prisma.customer.findMany({
    include: {
      orders: {
        where: {
          status: {
            in: ["PAID", "IN_DELIVERY", "COMPLETED"],
          },
        },
        include: {
          items: {
            include: {
              card: {
                select: {
                  id: true,
                  name: true,
                  playerName: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json(customersWithOrders);
}

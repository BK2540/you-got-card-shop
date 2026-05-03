import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth-server";

const formatOrder = <
  T extends {
    totalAmount: number;
    shippingAmount: number;
    items: Array<{ unitPriceAmount: number }>;
  },
>(
  order: T,
) => ({
  ...order,
  total: order.totalAmount / 100,
  shippingAmount: order.shippingAmount / 100,
  items: order.items.map((item) => ({
    ...item,
    unitPrice: item.unitPriceAmount / 100,
  })),
});

export async function GET(req: Request) {
  const auth = getAuthFromRequest(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    include: {
      customer: true,
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
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders.map(formatOrder));
}

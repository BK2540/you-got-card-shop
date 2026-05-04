import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { verifyAuthToken } from "@/lib/auth-jwt";
import { prisma } from "@/lib/prisma";

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

export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const auth = verifyAuthToken(token);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { customer: { email: auth.email } },
        { shippingEmail: auth.email },
      ],
    },
    include: {
      items: {
        include: {
          card: {
            select: {
              id: true,
              name: true,
              playerName: true,
              team: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders.map(formatOrder));
}

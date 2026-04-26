import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth-server";

const ORDER_STATUSES = [
  "PENDING",
  "PAID",
  "IN_DELIVERY",
  "COMPLETED",
  "FAILED",
  "CANCELED",
] as const;

type AllowedOrderStatus = (typeof ORDER_STATUSES)[number];

type UpdateOrderBody = {
  status?: AllowedOrderStatus;
  trackingNumber?: string | null;
};

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = getAuthFromRequest(req);
  if (!auth || auth.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = (await req.json()) as UpdateOrderBody;

    const nextStatus = body.status;
    const trackingNumber =
      body.trackingNumber === null || body.trackingNumber === undefined
        ? null
        : body.trackingNumber.trim();

    if (nextStatus && !ORDER_STATUSES.includes(nextStatus)) {
      return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(nextStatus ? { status: nextStatus } : {}),
        trackingNumber:
          trackingNumber && trackingNumber.length > 0 ? trackingNumber : null,
      },
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
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

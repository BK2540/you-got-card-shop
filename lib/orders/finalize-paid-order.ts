import { CardStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const PURCHASED_STATUSES = new Set(["PAID", "IN_DELIVERY", "COMPLETED"]);

type PaidOrderSummary = {
  id: string;
  total: number;
  customer: {
    name: string | null;
    email: string;
  } | null;
  items: Array<{
    quantity: number;
    unitPrice: number;
    card: {
      name: string;
      playerName: string;
    };
  }>;
};

type FinalizePaidOrderResult = {
  processed: boolean;
  order: PaidOrderSummary | null;
};

export async function finalizePaidOrder(
  orderId: string,
): Promise<FinalizePaidOrderResult> {
  let processed = false;
  let orderSnapshot: PaidOrderSummary | null = null;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM \`order\` WHERE id = ${orderId} FOR UPDATE`;

      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          items: {
            include: {
              card: {
                select: {
                  name: true,
                  playerName: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        return;
      }

      orderSnapshot = order;

      if (PURCHASED_STATUSES.has(order.status)) {
        return;
      }

      if (order.status === "FAILED" || order.status === "CANCELED") {
        return;
      }

      for (const item of order.items) {
        const decrementResult = await tx.card.updateMany({
          where: {
            id: item.cardId,
            status: CardStatus.ACTIVE,
            quantity: {
              gte: item.quantity,
            },
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        if (decrementResult.count < 1) {
          throw new Error("Insufficient stock");
        }

        const cardAfterUpdate = await tx.card.findUnique({
          where: { id: item.cardId },
          select: { id: true, quantity: true },
        });

        if (cardAfterUpdate && cardAfterUpdate.quantity <= 0) {
          await tx.card.update({
            where: { id: cardAfterUpdate.id },
            data: {
              status: CardStatus.OUT_OF_STOCK,
              quantity: 0,
            },
          });
        }
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: "PAID" },
      });

      processed = true;
    });
  } catch {
    await prisma.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "FAILED" },
    });
  }

  return {
    processed,
    order: orderSnapshot,
  };
}


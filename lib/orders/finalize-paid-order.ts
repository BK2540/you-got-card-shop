import { CardStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const PURCHASED_STATUSES = new Set(["PAID", "IN_DELIVERY", "COMPLETED"]);

type PaidOrderSummary = {
  id: string;
  total: number;
  stripeSessionId: string | null;
  status: string;
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

type DbPaidOrderSummary = Omit<PaidOrderSummary, "total" | "items"> & {
  totalAmount: number;
  items: Array<{
    quantity: number;
    unitPriceAmount: number;
    cardId: string;
    card: {
      name: string;
      playerName: string;
    };
  }>;
};

type FinalizeOutcome =
  | "processed"
  | "already_processed"
  | "blocked"
  | "order_not_found"
  | "failed";

type FailureReason = "insufficient_stock" | "unexpected";

type FinalizePaidOrderResult = {
  outcome: FinalizeOutcome;
  order: PaidOrderSummary | null;
  failureReason?: FailureReason;
};

const formatOrderSummary = (order: DbPaidOrderSummary): PaidOrderSummary => ({
  id: order.id,
  total: order.totalAmount / 100,
  stripeSessionId: order.stripeSessionId,
  status: order.status,
  customer: order.customer,
  items: order.items.map((item) => ({
    quantity: item.quantity,
    unitPrice: item.unitPriceAmount / 100,
    card: item.card,
  })),
});

export async function finalizePaidOrder(
  orderId: string,
): Promise<FinalizePaidOrderResult> {
  let outcome: FinalizeOutcome = "order_not_found";
  let orderSnapshot: PaidOrderSummary | null = null;
  let failureReason: FailureReason | undefined;

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
        outcome = "order_not_found";
        return;
      }

      orderSnapshot = formatOrderSummary(order);

      if (PURCHASED_STATUSES.has(order.status)) {
        outcome = "already_processed";
        return;
      }

      if (order.status === "FAILED" || order.status === "CANCELED") {
        outcome = "blocked";
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
          throw new Error("INSUFFICIENT_STOCK");
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

      outcome = "processed";
      if (orderSnapshot) {
        orderSnapshot = {
          ...orderSnapshot,
          status: "PAID",
        };
      }
    });
  } catch (error) {
    failureReason =
      error instanceof Error && error.message === "INSUFFICIENT_STOCK"
        ? "insufficient_stock"
        : "unexpected";
    outcome = "failed";

    await prisma.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "FAILED" },
    });
  }

  return {
    outcome,
    order: orderSnapshot,
    ...(failureReason ? { failureReason } : {}),
  };
}

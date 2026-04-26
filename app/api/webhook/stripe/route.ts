import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { CardStatus } from "@prisma/client";
import { sendOrderReceiptEmail } from "@/lib/email/templates";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata?.orderId;

    if (orderId) {
      const order = await prisma.order.findUnique({
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

      if (
        order &&
        !["PAID", "IN_DELIVERY", "COMPLETED"].includes(order.status)
      ) {
        let paymentRecorded = false;

        try {
          await prisma.$transaction(async (tx) => {
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
          });
          paymentRecorded = true;
        } catch {
          await prisma.order.updateMany({
            where: { id: orderId },
            data: { status: "FAILED" },
          });
        }

        if (paymentRecorded) {
          const receiptEmail = intent.receipt_email || order.customer?.email || "";
          if (receiptEmail) {
            await sendOrderReceiptEmail({
              email: receiptEmail,
              customerName: order.customer?.name,
              orderId: order.id,
              paidAt: new Date(),
              total: order.total,
              items: order.items.map((item) => ({
                name:
                  item.card.playerName && item.card.playerName !== item.card.name
                    ? `${item.card.name} (${item.card.playerName})`
                    : item.card.name,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              })),
            });
          }
        }
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata?.orderId;

    if (orderId) {
      await prisma.order.updateMany({
        where: { id: orderId },
        data: { status: "FAILED" },
      });
    }
  }

  if (event.type === "payment_intent.canceled") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata?.orderId;

    if (orderId) {
      await prisma.order.updateMany({
        where: { id: orderId },
        data: { status: "CANCELED" },
      });
    }
  }

  return NextResponse.json({ received: true });
}

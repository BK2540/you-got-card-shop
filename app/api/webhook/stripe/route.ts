import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { CardStatus } from "@prisma/client";

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
        include: { items: true },
      });

      if (order && order.status !== "PAID") {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: "PAID" },
        });

        for (const item of order.items) {
          const updatedCard = await prisma.card.update({
            where: { id: item.cardId },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
            select: {
              id: true,
              quantity: true,
            },
          });

          if (updatedCard.quantity <= 0) {
            await prisma.card.update({
              where: { id: updatedCard.id },
              data: {
                status: CardStatus.OUT_OF_STOCK,
                quantity: 0,
              },
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

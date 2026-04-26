import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendOrderReceiptEmail } from "@/lib/email/templates";
import { finalizePaidOrder } from "@/lib/orders/finalize-paid-order";

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
      const result = await finalizePaidOrder(orderId);
      if (result.processed && result.order) {
        const receiptEmail = intent.receipt_email || result.order.customer?.email || "";
        if (receiptEmail) {
          await sendOrderReceiptEmail({
            email: receiptEmail,
            customerName: result.order.customer?.name,
            orderId: result.order.id,
            paidAt: new Date(),
            total: result.order.total,
            items: result.order.items.map((item) => ({
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

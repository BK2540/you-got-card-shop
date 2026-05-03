import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { finalizePaidOrder } from "@/lib/orders/finalize-paid-order";
import { getStripe } from "@/lib/stripe";
import { sendOrderReceiptEmail } from "@/lib/email/templates";

type ConfirmCheckoutBody = {
  orderId?: string;
  paymentIntentId?: string;
};

const refundIfNeeded = async (
  paymentIntentId: string,
  orderId: string,
  reason: string,
) => {
  const stripe = getStripe();
  const existingRefunds = await stripe.refunds.list({
    payment_intent: paymentIntentId,
    limit: 1,
  });

  if (existingRefunds.data.length > 0) {
    return;
  }

  await stripe.refunds.create({
    payment_intent: paymentIntentId,
    reason: "requested_by_customer",
    metadata: {
      orderId,
      refundReason: reason,
    },
  }, {
    idempotencyKey: `refund:${orderId}`,
  });
};

const sendReceiptIfPossible = async (
  paymentIntent: Stripe.PaymentIntent,
  order: NonNullable<Awaited<ReturnType<typeof finalizePaidOrder>>["order"]>,
) => {
  const receiptEmail = paymentIntent.receipt_email || order.customer?.email || "";

  if (!receiptEmail) {
    console.warn("Order receipt email skipped: missing recipient", {
      orderId: order.id,
      paymentIntentId: paymentIntent.id,
    });
    return;
  }

  const result = await sendOrderReceiptEmail({
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

  if (!result.ok) {
    console.error("Failed to send order receipt email", {
      orderId: order.id,
      paymentIntentId: paymentIntent.id,
      error: result.error,
    });
  }
};

export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    const body = (await req.json()) as ConfirmCheckoutBody;
    const orderId = body.orderId?.trim() ?? "";
    const paymentIntentId = body.paymentIntentId?.trim() ?? "";

    if (!orderId || !paymentIntentId) {
      return NextResponse.json(
        { error: "orderId and paymentIntentId are required" },
        { status: 400 },
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        stripeSessionId: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (
      order.status === "PAID" ||
      order.status === "IN_DELIVERY" ||
      order.status === "COMPLETED"
    ) {
      return NextResponse.json({ success: true, status: order.status });
    }

    if (order.stripeSessionId !== paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent mismatch" },
        { status: 400 },
      );
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (
      intent.status !== "succeeded" ||
      intent.metadata?.orderId !== orderId
    ) {
      return NextResponse.json(
        { error: "Payment is not confirmed" },
        { status: 409 },
      );
    }

    const result = await finalizePaidOrder(orderId);

    if (result.outcome === "failed") {
      await refundIfNeeded(
        paymentIntentId,
        orderId,
        result.failureReason ?? "unknown_finalize_failure",
      );
      return NextResponse.json(
        { error: "Payment captured but stock was unavailable. The payment was refunded." },
        { status: 409 },
      );
    }

    if (result.outcome !== "processed") {
      const refreshed = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true },
      });

      if (refreshed?.status === "FAILED") {
        return NextResponse.json(
          { error: "Unable to finalize payment due to stock or order state" },
          { status: 409 },
        );
      }

      return NextResponse.json({
        success: true,
        status: refreshed?.status ?? order.status,
      });
    }

    if (result.order) {
      await sendReceiptIfPossible(intent, result.order);
    }

    return NextResponse.json({ success: true, status: "PAID" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to confirm checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

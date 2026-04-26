import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { finalizePaidOrder } from "@/lib/orders/finalize-paid-order";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type ConfirmCheckoutBody = {
  orderId?: string;
  paymentIntentId?: string;
};

export async function POST(req: Request) {
  try {
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

    if (!result.processed) {
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

    return NextResponse.json({ success: true, status: "PAID" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to confirm checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


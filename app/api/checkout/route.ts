import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { CardStatus } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type CheckoutRequestItem = {
  cardId: string;
  quantity: number;
};

type CheckoutRequestBody = {
  items: CheckoutRequestItem[];
  customer?: {
    name?: string;
    email?: string;
  };
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutRequestBody;
    const items = body.items ?? [];

    if (!items.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const cards = await prisma.card.findMany({
      where: { id: { in: items.map((item) => item.cardId) } },
    });

    if (cards.length !== items.length) {
      return NextResponse.json(
        { error: "Some cards are no longer available" },
        { status: 400 },
      );
    }

    for (const item of items) {
      const card = cards.find((entry) => entry.id === item.cardId);

      if (!card) {
        return NextResponse.json({ error: "Card not found" }, { status: 400 });
      }

      if (card.status !== CardStatus.ACTIVE) {
        return NextResponse.json(
          { error: `${card.name} is not available for purchase` },
          { status: 400 },
        );
      }

      if (item.quantity < 1 || item.quantity > card.quantity) {
        return NextResponse.json(
          { error: `Invalid quantity for ${card.name}` },
          { status: 400 },
        );
      }
    }

    const subtotal = items.reduce((sum, item) => {
      const card = cards.find((entry) => entry.id === item.cardId)!;
      return sum + card.price * item.quantity;
    }, 0);

    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 },
      );
    }

    let customerId: string | null = null;
    const customerEmail = body.customer?.email?.trim() ?? "";
    const customerName = body.customer?.name?.trim() ?? "";

    if (customerEmail) {
      const customer = await prisma.customer.upsert({
        where: { email: customerEmail },
        update: {
          name: customerName || customerEmail.split("@")[0] || "Customer",
        },
        create: {
          email: customerEmail,
          name: customerName || customerEmail.split("@")[0] || "Customer",
        },
      });
      customerId = customer.id;
    }

    const order = await prisma.order.create({
      data: {
        total: subtotal,
        status: "PENDING",
        customerId,
        items: {
          create: items.map((item) => {
            const card = cards.find((entry) => entry.id === item.cardId)!;
            return {
              cardId: item.cardId,
              quantity: item.quantity,
              unitPrice: card.price,
            };
          }),
        },
      },
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(subtotal * 100),
      currency: "thb",
      payment_method_types: ["card"],
      receipt_email: customerEmail || undefined,
      metadata: {
        orderId: order.id,
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: paymentIntent.id },
    });

    if (!paymentIntent.client_secret) {
      return NextResponse.json(
        { error: "Failed to initialize payment" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      amount: subtotal,
      currency: "THB",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import crypto from "crypto";
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
  checkoutKey?: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    deliveryMethod?: string;
  };
};

const DELIVERY_METHODS: Record<string, { label: string; amount: number }> = {
  standard: { label: "Standard delivery", amount: 0 },
  express: { label: "Express delivery", amount: 5000 },
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CheckoutRequestBody;
    const items = body.items ?? [];
    const checkoutKey = (body.checkoutKey?.trim() ?? crypto.randomUUID()).slice(0, 120);

    if (!items.length) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const groupedItems = new Map<string, number>();
    for (const item of items) {
      const normalizedQty = Number.isFinite(item.quantity)
        ? Math.floor(item.quantity)
        : 0;
      if (!item.cardId || normalizedQty < 1) {
        return NextResponse.json(
          { error: "Invalid cart item quantity" },
          { status: 400 },
        );
      }

      groupedItems.set(
        item.cardId,
        (groupedItems.get(item.cardId) ?? 0) + normalizedQty,
      );
    }

    const normalizedItems = Array.from(groupedItems.entries()).map(
      ([cardId, quantity]) => ({
        cardId,
        quantity,
      }),
    );

    const cards = await prisma.card.findMany({
      where: { id: { in: normalizedItems.map((item) => item.cardId) } },
    });

    if (cards.length !== normalizedItems.length) {
      return NextResponse.json(
        { error: "Some cards are no longer available" },
        { status: 400 },
      );
    }

    for (const item of normalizedItems) {
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

      if (card.quantity < 1 || item.quantity < 1 || item.quantity > card.quantity) {
        return NextResponse.json(
          { error: `Invalid quantity for ${card.name}` },
          { status: 400 },
        );
      }
    }

    const subtotalAmount = normalizedItems.reduce((sum, item) => {
      const card = cards.find((entry) => entry.id === item.cardId)!;
      return sum + card.priceAmount * item.quantity;
    }, 0);

    if (!Number.isFinite(subtotalAmount) || subtotalAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 },
      );
    }

    let customerId: string | null = null;
    const customerEmail = body.customer?.email?.trim() ?? "";
    const customerName = body.customer?.name?.trim() ?? "";
    const shippingPhone = body.customer?.phone?.trim() ?? "";
    const shippingAddressLine1 = body.customer?.addressLine1?.trim() ?? "";
    const shippingAddressLine2 = body.customer?.addressLine2?.trim() ?? "";
    const shippingCity = body.customer?.city?.trim() ?? "";
    const shippingProvince = body.customer?.province?.trim() ?? "";
    const shippingPostalCode = body.customer?.postalCode?.trim() ?? "";
    const shippingCountry = body.customer?.country?.trim() || "Thailand";
    const deliveryMethodInput = body.customer?.deliveryMethod?.trim() || "standard";
    const deliveryMethod = DELIVERY_METHODS[deliveryMethodInput]
      ? deliveryMethodInput
      : "standard";
    const shippingAmount = DELIVERY_METHODS[deliveryMethod].amount;
    const totalAmount = subtotalAmount + shippingAmount;

    if (
      !customerEmail ||
      !customerName ||
      !shippingPhone ||
      !shippingAddressLine1 ||
      !shippingCity ||
      !shippingProvince ||
      !shippingPostalCode
    ) {
      return NextResponse.json(
        { error: "Shipping contact and address are required" },
        { status: 400 },
      );
    }

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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: "thb",
      payment_method_types: ["card"],
      receipt_email: customerEmail || undefined,
      metadata: {
        checkoutKey,
        deliveryMethod,
      },
    }, {
      idempotencyKey: `checkout:${checkoutKey}`,
    });

    if (!paymentIntent.client_secret) {
      return NextResponse.json(
        { error: "Failed to initialize payment" },
        { status: 500 },
      );
    }

    let order = await prisma.order.findUnique({
      where: { stripeSessionId: paymentIntent.id },
      select: { id: true },
    });

    if (!order) {
      try {
        order = await prisma.order.create({
          data: {
            totalAmount,
            shippingAmount,
            status: "PENDING",
            customerId,
            shippingName: customerName,
            shippingEmail: customerEmail,
            shippingPhone,
            shippingAddressLine1,
            shippingAddressLine2: shippingAddressLine2 || null,
            shippingCity,
            shippingProvince,
            shippingPostalCode,
            shippingCountry,
            deliveryMethod,
            stripeSessionId: paymentIntent.id,
            items: {
              create: normalizedItems.map((item) => {
                const card = cards.find((entry) => entry.id === item.cardId)!;
                return {
                  cardId: item.cardId,
                  quantity: item.quantity,
                  unitPriceAmount: card.priceAmount,
                };
              }),
            },
          },
          select: { id: true },
        });
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          (error as { code?: string }).code === "P2002"
        ) {
          order = await prisma.order.findUnique({
            where: { stripeSessionId: paymentIntent.id },
            select: { id: true },
          });
        } else {
          throw error;
        }
      }
    }

    if (!order) {
      return NextResponse.json(
        { error: "Failed to create or locate checkout order" },
        { status: 500 },
      );
    }

    if (paymentIntent.metadata?.orderId !== order.id) {
      await stripe.paymentIntents.update(paymentIntent.id, {
        metadata: {
          ...paymentIntent.metadata,
          orderId: order.id,
          checkoutKey,
        },
      });
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      subtotal: subtotalAmount / 100,
      shippingAmount: shippingAmount / 100,
      amount: totalAmount / 100,
      currency: "THB",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

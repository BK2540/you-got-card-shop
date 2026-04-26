"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useRouter } from "next/navigation";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

type CheckoutInitResponse = {
  orderId: string;
  amount: number;
  currency: string;
  clientSecret: string;
};

type PaymentFormProps = {
  orderId: string;
  onPaid: () => void;
};

function PaymentForm({ orderId, onPaid }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError("");

    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        payment_method_data: {
          metadata: {
            orderId,
          },
        },
      },
    });

    if (result.error) {
      setError(result.error.message ?? "Payment failed");
      setLoading(false);
      return;
    }

    if (result.paymentIntent?.status === "succeeded") {
      const confirmRes = await fetch("/api/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paymentIntentId: result.paymentIntent.id,
        }),
      });

      const confirmPayload = (await confirmRes.json()) as { error?: string };
      if (!confirmRes.ok) {
        setError(confirmPayload.error ?? "Failed to finalize order");
        setLoading(false);
        return;
      }

      onPaid();
      return;
    }

    setError("Payment requires additional action. Please try again.");
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl">
        <PaymentElement />
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || loading}
        className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay now"}
      </button>
    </form>
  );
}

export default function PaymentPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [checkoutInit, setCheckoutInit] = useState<CheckoutInitResponse | null>(
    null,
  );
  const [paid, setPaid] = useState(false);
  const formatTHB = (value: number) => `THB ${value.toFixed(2)}`;

  const canStartPayment =
    items.length > 0 &&
    !loading &&
    customerEmail.trim().length > 3 &&
    customerEmail.includes("@");

  const elementOptions = useMemo(
    () => ({
      clientSecret: checkoutInit?.clientSecret ?? "",
      appearance: {
        theme: "night" as const,
      },
    }),
    [checkoutInit?.clientSecret],
  );

  const startCheckout = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            cardId: item.cardId,
            quantity: item.quantity,
          })),
          customer: {
            name: customerName,
            email: customerEmail,
          },
        }),
      });

      const data = (await res.json()) as
        | CheckoutInitResponse
        | { error?: string };

      if (!res.ok) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "Failed to start payment",
        );
      }

      if (!("clientSecret" in data)) {
        throw new Error("Payment initialization failed");
      }

      setCheckoutInit(data);
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Failed to start payment",
      );
    } finally {
      setLoading(false);
    }
  };

  if (paid) {
    return (
      <main className="px-6 py-10 text-white lg:px-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-orange70 bg-surface/5 backdrop-blur-3xl p-8 text-center">
          <h1 className="text-3xl font-bold text-primary">
            Payment Successful
          </h1>
          <p className="mt-3 text-gray-200">
            Your order has been paid. Thank you for shopping with us.
          </p>
          <button
            type="button"
            className="mt-6 rounded-xl bg-orange-500 px-6 py-3 font-semibold"
            onClick={() => router.push("/cards")}
          >
            Continue shopping
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-10 text-white lg:px-16">
      <h1 className="mb-8 text-3xl font-bold">Payment</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4 rounded-2xl border border-white/10 bg-surface p-6 min-h-52.5">
          {!checkoutInit && (
            <>
              <p className="text-sm text-gray-300">
                Fill in your details, then continue to card payment.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full name (optional)"
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 outline-none"
                />
                <input
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  type="email"
                  placeholder="Email (required)"
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 outline-none"
                />
              </div>
              {error && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={startCheckout}
                disabled={!canStartPayment}
                className="rounded-xl bg-orange-500 px-6 py-3 font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Preparing payment..." : "Continue to card payment"}
              </button>
            </>
          )}

          {checkoutInit && (
            <Elements stripe={stripePromise} options={elementOptions}>
              <PaymentForm
                orderId={checkoutInit.orderId}
                onPaid={() => {
                  clearCart();
                  setPaid(true);
                }}
              />
            </Elements>
          )}
        </section>

        <aside className="rounded-2xl border border-white/10 bg-surface p-6 min-h-52.5">
          <h2 className="mb-4 text-xl font-bold">Order Summary</h2>
          <div className="space-y-3 text-sm text-gray-300">
            <p>Items: {items.length}</p>
            <p>
              Total quantity:{" "}
              {items.reduce((sum, item) => sum + item.quantity, 0)}
            </p>
            {items.length > 0 && (
              <div className="max-h-64 space-y-2 overflow-auto rounded-xl border border-white/10 bg-black/20 p-3">
                {items.map((item) => {
                  const lineTotal = item.quantity * item.card.price;
                  return (
                    <div
                      key={item.cardId}
                      className="rounded-lg border border-white/10 bg-white/5 p-2"
                    >
                      <p className="text-sm font-semibold text-white">
                        {item.card.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        Qty: {item.quantity} x {formatTHB(item.card.price)}
                      </p>
                      <p className="text-xs font-semibold text-orange-300">
                        Item total: {formatTHB(lineTotal)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="pt-1 text-base font-semibold text-white">
              Subtotal: {formatTHB(subtotal)}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

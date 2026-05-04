"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

type CheckoutInitResponse = {
  orderId: string;
  subtotal: number;
  shippingAmount: number;
  amount: number;
  currency: string;
  clientSecret: string;
};

const deliveryMethods = [
  { value: "standard", label: "Standard delivery", amount: 0 },
  { value: "express", label: "Express delivery", amount: 50 },
];

function ResultIcon({ status }: { status: "success" | "failed" }) {
  if (status === "success") {
    return (
      <CheckCircleOutlinedIcon
        className="text-white text-center mt-6"
        sx={{ fontSize: 80 }}
      />
    );
  }

  return (
    <CancelOutlinedIcon
      className="text-white text-center mt-6"
      sx={{ fontSize: 80 }}
    />
  );
}

function PaymentResult({ status }: { status: "success" | "failed" }) {
  const isSuccess = status === "success";

  return (
    <main className="flex min-h-[calc(100vh-96px)] items-center justify-center px-6 py-10">
      <section className="flex w-full md:max-w-[380px] flex-col items-center rounded-xl bg-surface p-6 text-center shadow-2xl">
        <h1 className="text-3xl xl:text-4xl font-bold text-white">
          {isSuccess ? "Payment Successful" : "Payment Failed"}
        </h1>
        <ResultIcon status={status} />
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {isSuccess && (
            <Link
              href="/profile"
              className="rounded-full bg-orange-400 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-500 xl:text-base"
            >
              View Orders
            </Link>
          )}
          <Link
            href={isSuccess ? "/" : "/cart"}
            className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 xl:text-base"
          >
            {isSuccess ? "Back to Home" : "Back to Cart"}
          </Link>
        </div>
      </section>
    </main>
  );
}

type PaymentFormProps = {
  orderId: string;
  onPaid: () => void;
  onFailed: (message: string) => void;
};

function PaymentForm({ orderId, onPaid, onFailed }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const failPayment = (message: string) => {
    setError(message);
    setLoading(false);
    onFailed(message);
  };

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
      failPayment(result.error.message ?? "Payment failed");
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
        failPayment(confirmPayload.error ?? "Failed to finalize order");
        return;
      }

      onPaid();
      return;
    }

    failPayment("Payment requires additional action. Please try again.");
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
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const checkoutKeyRef = useRef(
    globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customerName, setCustomerName] = useState(user?.name ?? "");
  const [customerEmail, setCustomerEmail] = useState(user?.email ?? "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("Thailand");
  const [deliveryMethod, setDeliveryMethod] = useState("standard");
  const [checkoutInit, setCheckoutInit] = useState<CheckoutInitResponse | null>(
    null,
  );
  const [paymentResult, setPaymentResult] = useState<
    "success" | "failed" | null
  >(null);
  const formatTHB = (value: number) => `THB ${value.toFixed(2)}`;

  useEffect(() => {
    if (user?.name && !customerName) {
      setCustomerName(user.name);
    }

    if (user?.email && !customerEmail) {
      setCustomerEmail(user.email);
    }
  }, [customerEmail, customerName, user?.email, user?.name]);

  const canStartPayment =
    items.length > 0 &&
    !loading &&
    customerName.trim().length > 1 &&
    customerEmail.trim().length > 3 &&
    customerEmail.includes("@") &&
    customerPhone.trim().length > 5 &&
    addressLine1.trim().length > 4 &&
    city.trim().length > 1 &&
    province.trim().length > 1 &&
    postalCode.trim().length > 2;

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
          checkoutKey: checkoutKeyRef.current,
          items: items.map((item) => ({
            cardId: item.cardId,
            quantity: item.quantity,
          })),
          customer: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            addressLine1,
            addressLine2,
            city,
            province,
            postalCode,
            country,
            deliveryMethod,
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

  if (paymentResult) {
    return <PaymentResult status={paymentResult} />;
  }

  return (
    <main className="px-6 py-10 text-white lg:px-16">
      <h1 className="mb-8 text-3xl font-bold">Payment</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4 rounded-2xl border border-white/10 bg-surface p-6 min-h-52.5">
          {!checkoutInit && (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full name"
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 outline-none"
                />
                <input
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  type="email"
                  placeholder="Email (required)"
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 outline-none"
                />
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  type="tel"
                  placeholder="Phone number"
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 outline-none"
                />
                <select
                  value={deliveryMethod}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 outline-none"
                >
                  {deliveryMethods.map((method) => (
                    <option
                      key={method.value}
                      value={method.value}
                      className="bg-surface"
                    >
                      {method.label} - {formatTHB(method.amount)}
                    </option>
                  ))}
                </select>
                <input
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Address line 1"
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 outline-none md:col-span-2"
                />
                <input
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Address line 2 (optional)"
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 outline-none md:col-span-2"
                />
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City / district"
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 outline-none"
                />
                <input
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Province"
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 outline-none"
                />
                <input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Postal code"
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 outline-none"
                />
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country"
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
                  setPaymentResult("success");
                }}
                onFailed={() => setPaymentResult("failed")}
              />
            </Elements>
          )}
        </section>

        <aside className="rounded-2xl border border-white/10 bg-surface p-6 min-h-52.5">
          <h2 className="mb-4 text-xl font-bold">Order Summary</h2>
          <div className="space-y-3 text-sm text-gray-300">
            {items.length > 0 && (
              <div className="max-h-64 space-y-2 overflow-auto rounded-xl border border-white/10 bg-black/20 p-3">
                {items.map((item) => (
                  <div key={item.cardId} className="flex flex-col gap-2">
                    <p className="text-sm font-semibold text-orange70">
                      card name:{" "}
                      <span className="pl-2 text-sm font-semibold text-white">
                        {item.card.name}
                      </span>
                    </p>
                    <p className="text-xs text-orange70">
                      Qty:
                      <span className="pl-2 text-sm font-semibold text-white">
                        {item.quantity} x {formatTHB(item.card.price)}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
            <p className="pt-1 text-base font-semibold text-white">
              Subtotal: {formatTHB(subtotal)}
            </p>
            <p>
              Shipping:{" "}
              {formatTHB(
                deliveryMethods.find(
                  (method) => method.value === deliveryMethod,
                )?.amount ?? 0,
              )}
            </p>
            <p className="pt-1 text-base font-semibold text-white">
              Total:{" "}
              {formatTHB(
                subtotal +
                  (deliveryMethods.find(
                    (method) => method.value === deliveryMethod,
                  )?.amount ?? 0),
              )}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}

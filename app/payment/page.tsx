"use client";

import { useMemo, useRef, useState } from "react";
import { useCart } from "@/hooks/useCart";
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
  subtotal: number;
  shippingAmount: number;
  amount: number;
  currency: string;
  clientSecret: string;
};

type ReceiptItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

type ReceiptDetails = {
  orderId: string;
  items: ReceiptItem[];
  shippingAmount: number;
  total: number;
};

const deliveryMethods = [
  { value: "standard", label: "Standard delivery", amount: 0 },
  { value: "express", label: "Express delivery", amount: 50 },
];

const formatReceiptAmount = (value: number) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

function PaymentReceipt({ receipt }: { receipt: ReceiptDetails }) {
  return (
    <main className="min-h-[calc(100vh-96px)] bg-[#1f1f1f] px-6 py-7 text-black lg:px-6">
      <section className="mx-auto flex min-h-[calc(100vh-152px)] w-full max-w-[1128px] flex-col rounded-2xl bg-white px-5 py-8 sm:px-10 lg:px-10">
        <h1 className="text-xl font-bold leading-tight sm:text-2xl">
          Payment Confirmed: Order ID {receipt.orderId}
        </h1>

        <div className="flex flex-1 flex-col items-center justify-center gap-8 py-10">
          <div className="text-center">
            <h2 className="text-xl font-bold sm:text-2xl">
              Thank You For Your Purchase!
            </h2>
            <p className="mt-5 text-sm sm:text-base">
              Your payment was successful. Here is your receipt.
            </p>
          </div>

          <div className="w-full max-w-[570px] overflow-hidden rounded-2xl border border-orange-500">
            <table className="w-full table-fixed text-left text-[10px] sm:text-sm">
              <thead>
                <tr className="border-b border-orange-500 bg-white">
                  <th className="px-4 py-4 font-bold sm:px-5">Item</th>
                  <th className="px-2 py-4 text-center font-bold sm:px-5">
                    Quantity
                  </th>
                  <th className="px-2 py-4 text-center font-bold sm:px-5">
                    Unit Price
                  </th>
                  <th className="px-4 py-4 text-right font-bold sm:px-5">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((item) => (
                  <tr
                    key={`${item.name}-${item.quantity}-${item.unitPrice}`}
                    className="border-b border-orange-500/70"
                  >
                    <td className="px-4 py-5 sm:px-5">{item.name}</td>
                    <td className="px-2 py-5 text-center sm:px-5">
                      {item.quantity}
                    </td>
                    <td className="px-2 py-5 text-center sm:px-5">
                      {formatReceiptAmount(item.unitPrice)}
                    </td>
                    <td className="px-4 py-5 text-right sm:px-5">
                      {formatReceiptAmount(item.quantity * item.unitPrice)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="px-4 pt-5 sm:px-5">Shipping Cost</td>
                  <td />
                  <td />
                  <td className="px-4 pt-5 text-right sm:px-5">
                    {formatReceiptAmount(receipt.shippingAmount)}
                  </td>
                </tr>
                <tr className="font-bold">
                  <td className="px-4 pb-5 pt-4 sm:px-5">Total</td>
                  <td />
                  <td />
                  <td className="px-4 pb-5 pt-4 text-right sm:px-5">
                    {formatReceiptAmount(receipt.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="max-w-[520px] text-center text-sm sm:text-base">
            Once we get tracking number, we will notify you again via email
          </p>

          <div className="flex items-center gap-3 text-sm sm:text-base">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
              logo
            </span>
            <span>UGC</span>
          </div>
        </div>
      </section>
    </main>
  );
}

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
  const { items, subtotal, clearCart } = useCart();
  const checkoutKeyRef = useRef(
    globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
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
  const [receipt, setReceipt] = useState<ReceiptDetails | null>(null);
  const formatTHB = (value: number) => `THB ${value.toFixed(2)}`;

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

  if (receipt) {
    return <PaymentReceipt receipt={receipt} />;
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
                  setReceipt({
                    orderId: checkoutInit.orderId,
                    items: items.map((item) => ({
                      name: item.card.name,
                      quantity: item.quantity,
                      unitPrice: item.card.price,
                    })),
                    shippingAmount: checkoutInit.shippingAmount,
                    total: checkoutInit.amount,
                  });
                  clearCart();
                }}
              />
            </Elements>
          )}
        </section>

        <aside className="rounded-2xl border border-white/10 bg-surface p-6 min-h-52.5">
          <h2 className="mb-4 text-xl font-bold">Order Summary</h2>
          <div className="space-y-3 text-sm text-gray-300">
            {/* <p>Items: {items.length}</p>
            <p>
              Total quantity:{" "}
              {items.reduce((sum, item) => sum + item.quantity, 0)}
            </p> */}
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

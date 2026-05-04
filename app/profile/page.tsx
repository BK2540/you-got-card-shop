"use client";

import BouncingBallLoader from "@/components/BouncingBallLoader";
import { useAuth } from "@/hooks/useAuth";
import type { OrderStatus } from "@/lib/api/orders";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type ProfileOrder = {
  id: string;
  total: number;
  shippingAmount: number;
  status: OrderStatus;
  trackingNumber?: string | null;
  deliveryMethod?: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    card: {
      id: string;
      name: string;
      playerName: string;
      team: string;
    };
  }>;
};

const statusTone: Record<OrderStatus, string> = {
  PENDING: "border-yellow-400/30 bg-yellow-500/10 text-yellow-200",
  PAID: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  IN_DELIVERY: "border-orange-400/30 bg-orange-500/10 text-orange-200",
  COMPLETED: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  FAILED: "border-red-400/30 bg-red-500/10 text-red-200",
  CANCELED: "border-gray-400/30 bg-gray-500/10 text-gray-200",
};

const formatTHB = (value: number) => `THB ${value.toFixed(2)}`;

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const [orders, setOrders] = useState<ProfileOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const loadOrders = useCallback(async (isMounted: () => boolean) => {
    setOrdersLoading(true);
    setOrdersError("");

    try {
      const res = await fetch("/api/profile/orders", { cache: "no-store" });
      const data = (await res.json()) as ProfileOrder[] | { error?: string };

      if (!res.ok) {
        throw new Error(
          "error" in data && data.error ? data.error : "Failed to load orders",
        );
      }

      if (isMounted()) {
        setOrders(data as ProfileOrder[]);
      }
    } catch (error) {
      if (isMounted()) {
        setOrdersError(
          error instanceof Error ? error.message : "Failed to load orders",
        );
      }
    } finally {
      if (isMounted()) {
        setOrdersLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/signin");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let mounted = true;
    void loadOrders(() => mounted);

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, loadOrders]);

  const orderCountLabel = useMemo(() => {
    if (orders.length === 1) {
      return "1 order";
    }

    return `${orders.length} orders`;
  }, [orders.length]);

  if (isLoading || !isAuthenticated) {
    return <BouncingBallLoader fullScreen label="Loading profile..." />;
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="space-y-8 rounded-3xl border border-white/10 bg-surface/90 p-5 sm:p-6">
        <section>
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <p className="mt-1 text-sm text-gray-400">
            View your account details and track paid orders.
          </p>

          <div className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-gray-400">
                Name
              </p>
              <p className="text-white">{user?.name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-gray-400">
                Email
              </p>
              <p className="break-words text-white">{user?.email}</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">Order Tracking</h2>
              <p className="text-sm text-gray-400">{orderCountLabel}</p>
            </div>
          </div>

          {ordersLoading && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-6">
              <BouncingBallLoader label="Loading orders..." />
            </div>
          )}

          {ordersError && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {ordersError}
            </p>
          )}

          {!ordersLoading && !ordersError && orders.length === 0 && (
            <p className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm text-gray-400">
              No orders yet. Completed payments will appear here.
            </p>
          )}

          {!ordersLoading && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-orange-300">
                        Order ID: {order.id}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone[order.status]}`}
                    >
                      {order.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-gray-500">
                        Total
                      </p>
                      <p className="font-semibold text-white">
                        {formatTHB(order.total)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-gray-500">
                        Delivery
                      </p>
                      <p className="capitalize text-white">
                        {(order.deliveryMethod ?? "standard").replaceAll("_", " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-gray-500">
                        Tracking Number
                      </p>
                      <p className="font-semibold text-white">
                        {order.trackingNumber || "Not added yet"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm"
                      >
                        <p className="font-semibold text-white">
                          {item.card.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.card.team} | {item.card.playerName}
                        </p>
                        <p className="mt-1 text-xs text-gray-300">
                          {item.quantity} x {formatTHB(item.unitPrice)}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <button
          type="button"
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
          className="rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-300"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}

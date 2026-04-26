"use client";

import { useMemo, useState } from "react";
import {
  orderStatuses,
  type OrderListItem,
  type OrderStatus,
  updateOrder,
} from "@/lib/api/orders";

type OrdersTableProps = {
  orders: OrderListItem[];
  onOrderUpdated: () => Promise<void>;
};

type DraftState = {
  status: OrderStatus;
  trackingNumber: string;
};

const PURCHASED_STATUSES = new Set<OrderStatus>([
  "PAID",
  "IN_DELIVERY",
  "COMPLETED",
]);

const OrdersTable = ({ orders, onOrderUpdated }: OrdersTableProps) => {
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  const soldCardStats = useMemo(() => {
    const byCard = new Map<
      string,
      { cardName: string; playerName: string; quantitySold: number; revenue: number }
    >();

    for (const order of orders) {
      if (!PURCHASED_STATUSES.has(order.status)) {
        continue;
      }

      for (const item of order.items) {
        const current = byCard.get(item.card.id);
        const next = {
          cardName: item.card.name,
          playerName: item.card.playerName,
          quantitySold: (current?.quantitySold ?? 0) + item.quantity,
          revenue: (current?.revenue ?? 0) + item.quantity * item.unitPrice,
        };
        byCard.set(item.card.id, next);
      }
    }

    return Array.from(byCard.values())
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 8);
  }, [orders]);

  const getDraft = (order: OrderListItem): DraftState =>
    drafts[order.id] ?? {
      status: order.status,
      trackingNumber: order.trackingNumber ?? "",
    };

  const setDraft = (orderId: string, draft: DraftState) => {
    setDrafts((prev) => ({
      ...prev,
      [orderId]: draft,
    }));
  };

  const saveOrder = async (order: OrderListItem) => {
    const draft = getDraft(order);
    setSavingOrderId(order.id);
    setError("");

    try {
      await updateOrder(order.id, {
        status: draft.status,
        trackingNumber: draft.trackingNumber,
      });

      await onOrderUpdated();
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to update order",
      );
    } finally {
      setSavingOrderId(null);
    }
  };

  return (
    <div className="flex-1 space-y-10 p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-orange-500">Orders</h1>
        <p className="text-sm text-gray-300">
          Manage fulfillment status, tracking numbers, and purchased card data.
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="rounded-3xl bg-surface p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-white">Top Sold Cards</h2>
        {soldCardStats.length === 0 ? (
          <p className="text-sm text-gray-400">No paid orders yet.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {soldCardStats.map((entry) => (
              <div
                key={`${entry.cardName}-${entry.playerName}`}
                className="rounded-2xl border border-white/10 bg-black/25 p-3"
              >
                <p className="font-semibold text-white">{entry.cardName}</p>
                <p className="text-xs text-gray-400">{entry.playerName}</p>
                <p className="mt-2 text-sm text-gray-300">
                  Sold: {entry.quantitySold} | Revenue: THB {entry.revenue.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-surface p-6 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr>
                <th className="text-left">Order ID</th>
                <th className="text-left">Customer</th>
                <th className="text-left">Items</th>
                <th className="text-left">Total</th>
                <th className="text-left">Status</th>
                <th className="text-left">Tracking Number</th>
                <th className="text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => {
                const draft = getDraft(order);
                const isSaving = savingOrderId === order.id;
                const isDirty =
                  draft.status !== order.status ||
                  draft.trackingNumber !== (order.trackingNumber ?? "");

                return (
                  <tr key={order.id} className="border-t border-gray-700 align-top">
                    <td className="py-3 font-mono text-xs">{order.id}</td>
                    <td>
                      <div className="py-3">
                        <p>{order.customer?.name ?? "-"}</p>
                        <p className="text-xs text-gray-400">
                          {order.customer?.email ?? ""}
                        </p>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1 py-3">
                        {order.items.map((item) => (
                          <p key={item.id} className="text-xs text-gray-200">
                            {item.card.name} x {item.quantity}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="py-3">THB {order.total.toFixed(2)}</td>
                    <td className="py-3">
                      <select
                        className="rounded-lg border border-white/10 bg-black/30 px-2 py-1"
                        value={draft.status}
                        onChange={(event) =>
                          setDraft(order.id, {
                            ...draft,
                            status: event.target.value as OrderStatus,
                          })
                        }
                        disabled={isSaving}
                      >
                        {orderStatuses.map((status) => (
                          <option key={status} value={status} className="bg-surface">
                            {status.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3">
                      <input
                        className="w-48 rounded-lg border border-white/10 bg-black/30 px-2 py-1"
                        value={draft.trackingNumber}
                        onChange={(event) =>
                          setDraft(order.id, {
                            ...draft,
                            trackingNumber: event.target.value,
                          })
                        }
                        placeholder="Tracking number"
                        disabled={isSaving}
                      />
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => saveOrder(order)}
                        disabled={!isDirty || isSaving}
                        className="rounded-lg border border-primary px-3 py-1 text-xs text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrdersTable;

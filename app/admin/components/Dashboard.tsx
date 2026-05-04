"use client";

import { useMemo, useState } from "react";
import type { OrderListItem, OrderStatus } from "@/lib/api/orders";
import type { CustomerListItem } from "@/lib/api/customers";
import type { Card } from "@/types";

type DashboardProps = {
  cards: Card[];
  cardCount: number;
  orderCount: number;
  customerCount: number;
  orders: OrderListItem[];
  customers: CustomerListItem[];
};

type Period = "week" | "month" | "year";
type CustomerView = "month" | "year";

type ChartPoint = {
  label: string;
  value: number;
  revenue?: number;
};

type PurchaseSummary = {
  key: string;
  team: string;
  playerName: string;
  quantity: number;
  revenue: number;
  averagePrice: number;
};

const PURCHASED_STATUSES = new Set<OrderStatus>([
  "PAID",
  "IN_DELIVERY",
  "COMPLETED",
]);

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
});

const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
});

const toDate = (value: string) => new Date(value);

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const buildCustomerPoints = (
  customers: CustomerListItem[],
  view: CustomerView,
): ChartPoint[] => {
  const now = new Date();

  if (view === "year") {
    const startYear = now.getFullYear() - 4;
    const points = Array.from({ length: 5 }, (_, index) => {
      const year = startYear + index;
      return { label: String(year), value: 0 };
    });
    const byYear = new Map(points.map((point) => [point.label, point]));

    for (const customer of customers) {
      const year = String(toDate(customer.createdAt).getFullYear());
      const point = byYear.get(year);
      if (point) {
        point.value += 1;
      }
    }

    return points;
  }

  const points = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    return {
      label: `${monthFormatter.format(date)} ${String(date.getFullYear()).slice(2)}`,
      key: getMonthKey(date),
      value: 0,
    };
  });
  const byMonth = new Map(points.map((point) => [point.key, point]));

  for (const customer of customers) {
    const point = byMonth.get(getMonthKey(toDate(customer.createdAt)));
    if (point) {
      point.value += 1;
    }
  }

  return points.map(({ label, value }) => ({ label, value }));
};

const buildPurchasePoints = (
  orders: OrderListItem[],
  period: Period,
): ChartPoint[] => {
  const now = new Date();

  if (period === "week") {
    const start = startOfDay(now);
    start.setDate(start.getDate() - 6);
    const points = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        key: date.toISOString().slice(0, 10),
        label: weekdayFormatter.format(date),
        value: 0,
        revenue: 0,
      };
    });
    const byDay = new Map(points.map((point) => [point.key, point]));

    for (const order of orders) {
      if (!PURCHASED_STATUSES.has(order.status)) {
        continue;
      }

      const point = byDay.get(
        toDate(order.createdAt).toISOString().slice(0, 10),
      );
      if (point) {
        point.value += order.items.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );
        point.revenue += order.total;
      }
    }

    return points.map(({ label, value, revenue }) => ({
      label,
      value,
      revenue,
    }));
  }

  if (period === "month") {
    const points = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      return {
        key: getMonthKey(date),
        label: `${monthFormatter.format(date)} ${String(date.getFullYear()).slice(2)}`,
        value: 0,
        revenue: 0,
      };
    });
    const byMonth = new Map(points.map((point) => [point.key, point]));

    for (const order of orders) {
      if (!PURCHASED_STATUSES.has(order.status)) {
        continue;
      }

      const point = byMonth.get(getMonthKey(toDate(order.createdAt)));
      if (point) {
        point.value += order.items.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );
        point.revenue += order.total;
      }
    }

    return points.map(({ label, value, revenue }) => ({
      label,
      value,
      revenue,
    }));
  }

  const startYear = now.getFullYear() - 4;
  const points = Array.from({ length: 5 }, (_, index) => {
    const year = startYear + index;
    return { label: String(year), value: 0, revenue: 0 };
  });
  const byYear = new Map(points.map((point) => [point.label, point]));

  for (const order of orders) {
    if (!PURCHASED_STATUSES.has(order.status)) {
      continue;
    }

    const point = byYear.get(String(toDate(order.createdAt).getFullYear()));
    if (point) {
      point.value += order.items.reduce((sum, item) => sum + item.quantity, 0);
      point.revenue += order.total;
    }
  }

  return points;
};

const getPeriodStart = (period: Period) => {
  const now = new Date();
  const start = startOfDay(now);

  if (period === "week") {
    start.setDate(start.getDate() - 6);
    return start;
  }

  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth() - 5, 1);
  }

  return new Date(now.getFullYear() - 4, 0, 1);
};

const buildPurchaseSummaries = (
  orders: OrderListItem[],
  period: Period,
): PurchaseSummary[] => {
  const start = getPeriodStart(period);
  const summaries = new Map<string, PurchaseSummary>();

  for (const order of orders) {
    if (
      !PURCHASED_STATUSES.has(order.status) ||
      toDate(order.createdAt) < start
    ) {
      continue;
    }

    for (const item of order.items) {
      const key = `${item.card.team}-${item.card.playerName}-${item.unitPrice}`;
      const current = summaries.get(key);
      const quantity = (current?.quantity ?? 0) + item.quantity;
      const revenue = (current?.revenue ?? 0) + item.quantity * item.unitPrice;

      summaries.set(key, {
        key,
        team: item.card.team,
        playerName: item.card.playerName,
        quantity,
        revenue,
        averagePrice: revenue / quantity,
      });
    }
  }

  return Array.from(summaries.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);
};

const BarChart = ({
  points,
  formatValue,
}: {
  points: ChartPoint[];
  formatValue: (point: ChartPoint) => string;
}) => {
  const maxValue = Math.max(...points.map((point) => point.value), 1);

  return (
    <div className="grid min-h-72 auto-cols-fr grid-flow-col items-end gap-3 overflow-x-auto">
      {points.map((point) => (
        <div
          key={point.label}
          className="flex h-full min-w-16 flex-col justify-end gap-2"
        >
          <div className="flex h-44 items-end rounded-lg border border-white/10 bg-black/30 px-2 py-2">
            <div
              className="flex w-full min-w-6 items-start justify-center rounded-md bg-linear-to-t from-orange-700 via-primary to-yellow px-1 pt-2 text-xs font-semibold text-black"
              style={{
                height: `${Math.max((point.value / maxValue) * 100, point.value ? 14 : 0)}%`,
              }}
            >
              {/* {point.value > 0 ? point.value : null} */}
            </div>
          </div>
          <p className="truncate text-center text-xs text-gray-400">
            {point.label}
          </p>
          <p className="text-center text-xs font-semibold text-gray-200">
            {formatValue(point)}
          </p>
          <p className="min-h-4 text-center text-[11px] text-orange-200">
            {point.revenue !== undefined ? currency.format(point.revenue) : ""}
          </p>
        </div>
      ))}
    </div>
  );
};

const ToggleButton = <T extends string>({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: T;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
      active
        ? "bg-primary text-white"
        : "border border-white/10 bg-black/30 text-gray-300 hover:bg-white/10"
    }`}
  >
    {children}
  </button>
);

const Dashboard = ({
  cards,
  cardCount,
  orderCount,
  customerCount,
  orders,
  customers,
}: DashboardProps) => {
  const [customerView, setCustomerView] = useState<CustomerView>("month");
  const [purchasePeriod, setPurchasePeriod] = useState<Period>("month");

  const customerPoints = useMemo(
    () => buildCustomerPoints(customers, customerView),
    [customers, customerView],
  );
  const purchasePoints = useMemo(
    () => buildPurchasePoints(orders, purchasePeriod),
    [orders, purchasePeriod],
  );
  const purchaseSummaries = useMemo(
    () => buildPurchaseSummaries(orders, purchasePeriod),
    [orders, purchasePeriod],
  );

  const paidOrders = orders.filter((order) =>
    PURCHASED_STATUSES.has(order.status),
  );
  const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const unitsSold = paidOrders.reduce(
    (sum, order) =>
      sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0,
  );
  const lowStockCards = cards
    .filter((card) => card.quantity <= 2 || card.status === "OUT_OF_STOCK")
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5);

  return (
    <main className="space-y-8 p-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-orange-400/80">
          Admin Overview
        </p>
        <h1 className="text-3xl font-bold text-orange-500">Dashboard</h1>
        <p className="max-w-3xl text-sm text-gray-300">
          Track customer growth, purchasing trends, and cards that need
          inventory attention before promotion.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          ["Inventory", cardCount],
          ["Orders", orderCount],
          ["Customers", customerCount],
          ["Units Sold", unitsSold],
          ["Revenue", currency.format(revenue)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-white/10 bg-surface p-5"
          >
            <p className="text-sm text-gray-400">{label}</p>
            <p className="mt-3 text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-surface p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Customer Growth
              </h2>
              <p className="text-xs text-gray-400">
                New customers by month or year.
              </p>
            </div>
            <div className="flex gap-2">
              <ToggleButton
                active={customerView === "month"}
                onClick={() => setCustomerView("month")}
              >
                month
              </ToggleButton>
              <ToggleButton
                active={customerView === "year"}
                onClick={() => setCustomerView("year")}
              >
                year
              </ToggleButton>
            </div>
          </div>
          <BarChart
            points={customerPoints}
            formatValue={(point) =>
              `${point.value} new ${point.value === 1 ? "customer" : "customers"}`
            }
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-surface p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Purchasing Trend
              </h2>
              <p className="text-xs text-gray-400">
                Sold units and revenue over time.
              </p>
            </div>
            <div className="flex gap-2">
              {(["week", "month", "year"] as const).map((period) => (
                <ToggleButton
                  key={period}
                  active={purchasePeriod === period}
                  onClick={() => setPurchasePeriod(period)}
                >
                  {period}
                </ToggleButton>
              ))}
            </div>
          </div>
          <BarChart
            points={purchasePoints}
            formatValue={(point) =>
              `${point.value} card${point.value === 1 ? "" : "s"} sold`
            }
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-white/10 bg-surface p-6">
          <h2 className="text-lg font-semibold text-white">Top Purchases</h2>
          <p className="mt-1 text-xs text-gray-400">
            Ranked by revenue for the selected purchasing period.
          </p>

          {purchaseSummaries.length === 0 ? (
            <p className="mt-5 rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-gray-400">
              No paid purchases in this period yet.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs text-gray-400">
                    <th className="pb-3">Team</th>
                    <th className="pb-3">Player</th>
                    <th className="pb-3 text-right">Sold</th>
                    <th className="pb-3 text-right">Avg Price</th>
                    <th className="pb-3 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseSummaries.map((summary) => (
                    <tr key={summary.key} className="border-b border-white/5">
                      <td className="py-3 font-semibold text-white">
                        {summary.team}
                      </td>
                      <td className="py-3 text-gray-300">
                        {summary.playerName}
                      </td>
                      <td className="py-3 text-right text-gray-300">
                        {summary.quantity}
                      </td>
                      <td className="py-3 text-right text-gray-300">
                        {currency.format(summary.averagePrice)}
                      </td>
                      <td className="py-3 text-right font-semibold text-orange-300">
                        {currency.format(summary.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-surface p-6">
          <h2 className="text-lg font-semibold text-white">
            Inventory Signals
          </h2>
          <p className="mt-1 text-xs text-gray-400">
            Cards with 2 or fewer in stock, or cards marked out of stock.
          </p>

          <div className="mt-5 space-y-3">
            {lowStockCards.length === 0 ? (
              <p className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-gray-400">
                No low-stock cards right now.
              </p>
            ) : (
              lowStockCards.map((card) => (
                <div
                  key={card.id}
                  className="rounded-lg border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{card.name}</p>
                      <p className="text-xs text-gray-400">
                        {card.team} | {card.playerName}
                      </p>
                    </div>
                    <p className="rounded-md bg-orange-500/15 px-2 py-1 text-xs font-semibold text-orange-200">
                      {card.quantity} left
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;

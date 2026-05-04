export const orderStatuses = [
  "PENDING",
  "PAID",
  "IN_DELIVERY",
  "COMPLETED",
  "FAILED",
  "CANCELED",
] as const;

export type OrderStatus = (typeof orderStatuses)[number];

export type OrderListItem = {
  id: string;
  total: number;
  shippingAmount: number;
  status: OrderStatus;
  trackingNumber?: string | null;
  shippingName?: string | null;
  shippingEmail?: string | null;
  shippingPhone?: string | null;
  shippingAddressLine1?: string | null;
  shippingAddressLine2?: string | null;
  shippingCity?: string | null;
  shippingProvince?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
  deliveryMethod?: string | null;
  createdAt: string;
  customer?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
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

export async function getOrders(): Promise<OrderListItem[]> {
  const res = await fetch("/api/orders", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load orders");
  }

  return res.json() as Promise<OrderListItem[]>;
}

export async function updateOrder(
  orderId: string,
  payload: {
    status: OrderStatus;
    trackingNumber?: string;
  },
): Promise<OrderListItem> {
  const res = await fetch(`/api/orders/${orderId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as OrderListItem | { error?: string };
  if (!res.ok) {
    throw new Error(
      "error" in data && data.error ? data.error : "Failed to update order",
    );
  }

  return data as OrderListItem;
}

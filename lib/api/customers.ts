import type { OrderStatus } from "@/lib/api/orders";

export type CustomerListItem = {
  id: string;
  name: string;
  email: string;
  orders: Array<{
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
    items: Array<{
      id: string;
      quantity: number;
      unitPrice: number;
      card: {
        id: string;
        name: string;
        playerName: string;
      };
    }>;
  }>;
};

export async function getCustomers(): Promise<CustomerListItem[]> {
  const res = await fetch("/api/customers", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load customers");
  }

  return res.json() as Promise<CustomerListItem[]>;
}

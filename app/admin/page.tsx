"use client";

import { useAdminPortal } from "@/context/AdminPortalContext";
import { getAdminCards } from "@/lib/api/cards";
import { getCustomers } from "@/lib/api/customers";
import { getOrders } from "@/lib/api/orders";
import { Card } from "@/types";
import { type ChangeEvent, type FormEvent, useCallback, useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import InventoryPage from "./components/Inventory/InventoryPage";
import OrdersTable from "./components/Orders/OrdersTable";
import CustomersTable from "./components/Customers/CustomersTable";
import HomeContentForm from "./components/Home/HomeContentForm";

type Customer = {
  id: string;
  name: string;
  email: string;
};

type Order = {
  id: string;
  total: number;
  status: string;
  customer?: {
    name?: string;
  };
};

type HomeFormState = {
  id?: string;
  title: string;
  subtitle: string;
  description: string;
  price: string;
  featuredId: string;
};

const MAX_IMAGE_COUNT = 10;

export default function AdminPage() {
  const { tab } = useAdminPortal();
  const [cards, setCards] = useState<Card[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [homeLoading, setHomeLoading] = useState(false);

  const [homeForm, setHomeForm] = useState<HomeFormState>({
    title: "",
    subtitle: "",
    description: "",
    price: "",
    featuredId: "",
  });

  const fetchCards = useCallback(async () => {
    const response = await getAdminCards({
      page: 1,
      pageSize: 200,
      status: "ALL",
      recommendation: "ALL",
      sortBy: "createdAt",
      sortDirection: "desc",
    });
    setCards(response.items);
    return response.items;
  }, []);

  useEffect(() => {
    if (tab === "orders" || tab === "dashboard") {
      getOrders().then(setOrders);
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "customers" || tab === "dashboard") {
      getCustomers().then(setCustomers);
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "home" || tab === "dashboard") {
      fetchCards();
    }
  }, [tab, fetchCards]);

  useEffect(() => {
    if (tab !== "home") {
      return;
    }

    fetch("/api/home")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setHomeForm({
            id: data.id,
            title: data.title ?? "",
            subtitle: data.subtitle ?? "",
            description: data.description ?? "",
            price: data.price ? String(data.price) : "",
            featuredId: data.featuredId ?? "",
          });
        }
      });
  }, [tab]);

  const handleHomeFormChange =
    (field: keyof HomeFormState) =>
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setHomeForm((current) => ({
        ...current,
        [field]:
          field === "price"
            ? e.target.value.replace(/[^\d]/g, "")
            : e.target.value,
      }));
    };

  const handleHomeContentSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHomeLoading(true);

    try {
      await fetch("/api/home", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...homeForm,
          price: Number(homeForm.price || 0),
        }),
      });
    } finally {
      setHomeLoading(false);
    }
  };

  if (tab === "dashboard") {
    return (
      <Dashboard
        cardCount={cards.length}
        orderCount={orders.length}
        customerCount={customers.length}
      />
    );
  }

  if (tab === "home") {
    return (
      <HomeContentForm
        cards={cards}
        form={homeForm}
        loading={homeLoading}
        onChange={handleHomeFormChange}
        onSubmit={handleHomeContentSubmit}
      />
    );
  }

  if (tab === "inventory") {
    return <InventoryPage maxImageCount={MAX_IMAGE_COUNT} onChanged={fetchCards} />;
  }

  if (tab === "orders") {
    return <OrdersTable orders={orders} />;
  }

  if (tab === "customers") {
    return <CustomersTable customers={customers} />;
  }

  return <div className="min-h-screen w-full text-white" />;
}

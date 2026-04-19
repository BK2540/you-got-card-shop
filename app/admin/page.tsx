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

type HomeSubmitStatus = {
  type: "success" | "error";
  message: string;
} | null;

const MAX_IMAGE_COUNT = 10;
const EMPTY_HOME_FORM: HomeFormState = {
  title: "",
  subtitle: "",
  description: "",
  price: "",
  featuredId: "",
};

export default function AdminPage() {
  const { tab } = useAdminPortal();
  const [cards, setCards] = useState<Card[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [homeLoading, setHomeLoading] = useState(false);
  const [homeSubmitStatus, setHomeSubmitStatus] = useState<HomeSubmitStatus>(null);

  const [homeForm, setHomeForm] = useState<HomeFormState>(EMPTY_HOME_FORM);
  const [initialHomeForm, setInitialHomeForm] =
    useState<HomeFormState>(EMPTY_HOME_FORM);

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
          const nextFormState = {
            id: data.id,
            title: data.title ?? "",
            subtitle: data.subtitle ?? "",
            description: data.description ?? "",
            price: data.price ? String(data.price) : "",
            featuredId: data.featuredId ?? "",
          };

          setHomeForm(nextFormState);
          setInitialHomeForm(nextFormState);
          setHomeSubmitStatus(null);
          return;
        }

        setHomeForm(EMPTY_HOME_FORM);
        setInitialHomeForm(EMPTY_HOME_FORM);
        setHomeSubmitStatus(null);
      });
  }, [tab]);

  const handleHomeFormChange =
    (field: keyof HomeFormState) =>
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setHomeSubmitStatus(null);
      setHomeForm((current) => ({
        ...current,
        [field]:
          field === "price"
            ? e.target.value.replace(/[^\d]/g, "")
            : e.target.value,
      }));
    };

  const isHomeFormDirty =
    homeForm.title !== initialHomeForm.title ||
    homeForm.subtitle !== initialHomeForm.subtitle ||
    homeForm.description !== initialHomeForm.description ||
    homeForm.price !== initialHomeForm.price ||
    homeForm.featuredId !== initialHomeForm.featuredId;

  const handleHomeContentSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isHomeFormDirty || homeLoading) {
      return;
    }

    setHomeLoading(true);

    try {
      const res = await fetch("/api/home", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...homeForm,
          price: Number(homeForm.price || 0),
        }),
      });

      if (!res.ok) {
        let errorMessage = "Failed to save home content.";
        try {
          const payload = (await res.json()) as { error?: string };
          if (payload?.error) {
            errorMessage = payload.error;
          }
        } catch {
          // Keep generic error message if response is not JSON.
        }

        throw new Error(errorMessage);
      }

      const saved = (await res.json()) as {
        id: string;
        title?: string;
        subtitle?: string;
        description?: string;
        price?: number;
        featuredId?: string | null;
      };

      const savedFormState: HomeFormState = {
        id: saved.id,
        title: saved.title ?? homeForm.title,
        subtitle: saved.subtitle ?? homeForm.subtitle,
        description: saved.description ?? homeForm.description,
        price: saved.price !== undefined ? String(saved.price) : homeForm.price,
        featuredId: saved.featuredId ?? "",
      };

      setHomeForm(savedFormState);
      setInitialHomeForm(savedFormState);
      setHomeSubmitStatus({
        type: "success",
        message: "Home content saved successfully.",
      });
    } catch (error) {
      setHomeSubmitStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to save home content.",
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
        submitDisabled={!isHomeFormDirty}
        status={homeSubmitStatus}
        onStatusClose={() => setHomeSubmitStatus(null)}
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

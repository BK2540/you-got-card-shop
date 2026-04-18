// lib/api/cards.ts

import {
  CardStatus,
  InventoryCardSortDirection,
  InventoryCardSortField,
  PaginatedCardsResponse,
} from "@/types";

export async function getCards() {
  const res = await fetch("http://localhost:3000/api/cards", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch cards");
  }

  return res.json();
}

type GetAdminCardsOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: CardStatus | "ALL";
  sortBy?: InventoryCardSortField;
  sortDirection?: InventoryCardSortDirection;
};

export async function getAdminCards(options: GetAdminCardsOptions = {}) {
  const params = new URLSearchParams({
    view: "admin",
    page: String(options.page ?? 1),
    pageSize: String(options.pageSize ?? 6),
    search: options.search ?? "",
    status: options.status ?? "ALL",
    sortBy: options.sortBy ?? "createdAt",
    sortDirection: options.sortDirection ?? "desc",
  });

  const res = await fetch(`http://localhost:3000/api/cards?${params}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch admin cards");
  }

  return (await res.json()) as PaginatedCardsResponse;
}

export async function createCard(data: FormData) {
  const res = await fetch("http://localhost:3000/api/cards", {
    method: "POST",
    body: data,
  });

  const text = await res.text();
  let payload: { error?: string } | null = null;

  if (text) {
    try {
      payload = JSON.parse(text) as { error?: string };
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    throw new Error(payload?.error ?? "Failed to create card");
  }

  return payload;
}

export async function deleteCard(id: string) {
  await fetch(`http://localhost:3000/api/cards/${id}`, {
    method: "DELETE",
  });
}


export async function updateCard(id: string, data: FormData) {
  const res = await fetch(`http://localhost:3000/api/cards/${id}`, {
    method: "PUT",
    body: data,
  });

  const text = await res.text();
  let payload: { error?: string } | null = null;

  if (text) {
    try {
      payload = JSON.parse(text) as { error?: string };
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    throw new Error(payload?.error ?? "Failed to update card");
  }

  return payload;
}

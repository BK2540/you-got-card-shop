// lib/api/cards.ts

import {
  Card,
  CardStatus,
  InventoryCardSortDirection,
  InventoryCardSortField,
  PaginatedCardsResponse,
} from "@/types";

type GetCardsOptions = {
  search?: string;
  team?: string;
  year?: string;
  grade?: string;
  playerName?: string;
  minPrice?: string;
  maxPrice?: string;
  section?: "all" | "recommended" | "new-arrival";
  limit?: number;
};

const getApiUrl = (path: string) => {
  if (typeof window !== "undefined") {
    return path;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";

  return new URL(path, baseUrl).toString();
};

export async function getCards(options: GetCardsOptions = {}): Promise<Card[]> {
  const params = new URLSearchParams();

  if (options.search) params.set("search", options.search);
  if (options.team) params.set("team", options.team);
  if (options.year) params.set("year", options.year);
  if (options.grade) params.set("grade", options.grade);
  if (options.playerName) params.set("playerName", options.playerName);
  if (options.minPrice) params.set("minPrice", options.minPrice);
  if (options.maxPrice) params.set("maxPrice", options.maxPrice);
  if (options.section && options.section !== "all") {
    params.set("section", options.section);
  }
  if (options.limit && options.limit > 0) {
    params.set("limit", String(options.limit));
  }

  const queryString = params.toString();
  const endpoint = getApiUrl(
    queryString ? `/api/cards?${queryString}` : "/api/cards",
  );

  const res = await fetch(endpoint, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch cards");
  }

  return (await res.json()) as Card[];
}

type GetAdminCardsOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: CardStatus | "ALL";
  recommendation?: "ALL" | "RECOMMENDED" | "NOT_RECOMMENDED";
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
    recommendation: options.recommendation ?? "ALL",
    sortBy: options.sortBy ?? "createdAt",
    sortDirection: options.sortDirection ?? "desc",
  });

  const res = await fetch(getApiUrl(`/api/cards?${params}`), {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch admin cards");
  }

  return (await res.json()) as PaginatedCardsResponse;
}

export async function createCard(data: FormData) {
  const res = await fetch("/api/cards", {
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
  await fetch(`/api/cards/${id}`, {
    method: "DELETE",
  });
}


export async function updateCard(id: string, data: FormData) {
  const res = await fetch(`/api/cards/${id}`, {
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

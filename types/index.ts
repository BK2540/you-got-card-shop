// types/index.ts
export type CardImage = {
  id: string;
  url: string;
  isHero: boolean;
};

export type CardStatus =  "ACTIVE" |
  "INACTIVE" |
  "OUT_OF_STOCK"

export type Card = {
  id: string;
  name: string;
  playerName: string;
  team: string;
  price: number;
  image: string;
  images: CardImage[];
  grade: string;
  year: number;
  quantity: number;
  isRecommended: boolean;
  isNewArrival?: boolean;
  description: string;
  status: CardStatus;
};

export type InventoryCardSortField =
  | "createdAt"
  | "name"
  | "playerName"
  | "price"
  | "quantity"
  | "year"
  | "status"
  | "isRecommended";

export type InventoryCardSortDirection = "asc" | "desc";

export type PaginatedCardsResponse = {
  items: Card[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  sortBy: InventoryCardSortField;
  sortDirection: InventoryCardSortDirection;
  search: string;
  status: CardStatus | "ALL";
  recommendation: "ALL" | "RECOMMENDED" | "NOT_RECOMMENDED";
};


export type AdminTab = "inventory" | "orders" | "customers" | "dashboard" | "home";

export type CartItem = {
  cardId: string;
  quantity: number;
  card: Card;
};

// types/index.ts
export type CardImage = {
  id: string;
  url: string;
  isHero: boolean;
};

export type Card = {
  id: string;
  name: string;
  team: string;
  price: number;
  image: string;
  images: CardImage[];
  grade: string;
  year: number;
};


export type AdminTab = "inventory" | "orders" | "customers" | "dashboard" | "home";
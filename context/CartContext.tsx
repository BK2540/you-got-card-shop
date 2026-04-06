// context/CartContext.tsx
"use client";

import { createContext, useState, ReactNode } from "react";
import { Card } from "@/types";

type CartContextType = {
  cart: Card[];
  addToCart: (item: Card) => void;
};

export const CartContext = createContext<CartContextType>({
  cart: [],
  addToCart: () => {},
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<Card[]>([]);

  const addToCart = (item: Card) => {
    setCart((prev) => [...prev, item]);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart }}>
      {children}
    </CartContext.Provider>
  );
};

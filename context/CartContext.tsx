// // context/CartContext.tsx
// "use client";

// import { createContext, useState, ReactNode } from "react";
// import { Card } from "@/types";

// type CartContextType = {
//   cart: Card[];
//   addToCart: (item: Card) => void;
// };

// export const CartContext = createContext<CartContextType>({
//   cart: [],
//   addToCart: () => {},
// });

// export const CartProvider = ({ children }: { children: ReactNode }) => {
//   const [cart, setCart] = useState<Card[]>([]);

//   const addToCart = (item: Card) => {
//     setCart((prev) => [...prev, item]);
//   };

//   return (
//     <CartContext.Provider value={{ cart, addToCart }}>
//       {children}
//     </CartContext.Provider>
//   );
// };

"use client";

import { createContext, useEffect, useMemo, useState } from "react";
import type { Card, CartItem } from "@/types";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type CartContextValue = {
  items: CartItem[];
  addToCart: (card: Card, qty?: number) => void;
  removeFromCart: (cardId: string) => void;
  updateQty: (cardId: string, qty: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
};

export const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY_PREFIX = "vault-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuth();

  const storageKey = user ? `${STORAGE_KEY_PREFIX}:${user.id}` : null;

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!storageKey) {
      setItems([]);
      setLoadedStorageKey(null);
      return;
    }

    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      setItems([]);
      setLoadedStorageKey(storageKey);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as CartItem[];
      setItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      setItems([]);
    } finally {
      setLoadedStorageKey(storageKey);
    }
  }, [isLoading, storageKey]);

  useEffect(() => {
    if (!storageKey || loadedStorageKey !== storageKey) {
      return;
    }

    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, loadedStorageKey, storageKey]);

  const addToCart = (card: Card, qty = 1) => {
    if (!isAuthenticated) {
      const next = pathname || "/";
      router.push(`/signin?next=${encodeURIComponent(next)}`);
      return;
    }

    setItems((prev) => {
      const found = prev.find((item) => item.cardId === card.id);
      if (found) {
        return prev.map((item) =>
          item.cardId === card.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + qty, card.quantity || 99),
              }
            : item,
        );
      }

      return [...prev, { cardId: card.id, quantity: qty, card }];
    });
  };

  const removeFromCart = (cardId: string) => {
    setItems((prev) => prev.filter((item) => item.cardId !== cardId));
  };

  const updateQty = (cardId: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((item) =>
          item.cardId === cardId
            ? { ...item, quantity: Math.max(1, qty) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const clearCart = () => setItems([]);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.card.price, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        itemCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

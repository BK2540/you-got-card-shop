// components/CardItem.tsx
"use client";

import { Card } from "@/types";
import { useContext } from "react";
import { CartContext } from "@/context/CartContext";
import Link from "next/link";

export default function CardItem({ card }: { card: Card }) {
  const { addToCart } = useContext(CartContext);

  return (
    <div className="bg-gray-800 p-4">
      <img src={card.image} />

      <h3>{card.name}</h3>
      <p>${card.price}</p>

      <div className="flex gap-2 mt-2">
        <Link href={`/card/${card.id}`} className="bg-white text-black px-2">
          View
        </Link>

        <button onClick={() => addToCart(card)} className="bg-orange-500 px-2">
          Add
        </button>
      </div>
    </div>
  );
}

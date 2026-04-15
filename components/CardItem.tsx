// components/CardItem.tsx
"use client";

import { Card } from "@/types";
import { useContext } from "react";
import { CartContext } from "@/context/CartContext";
import Image from "next/image";
import CustomButton from "./CustomButton";
import { useRouter } from "next/navigation";

export default function CardItem({ card }: { card: Card }) {
  const { addToCart } = useContext(CartContext);
  const router = useRouter();

  return (
    <div
      key={card.id}
      className="p-4 rounded-2xl border border-white shadow-md bg-white/20 backdrop-blur-md flex flex-col items-center gap-6"
    >
      <Image
        src={card.image}
        alt={`card ${card.name}`}
        width={250}
        height={350}
      />
      <p className="text-primary font-bold text-2xl">{card.name}</p>
      <div className="flex gap-2">
        <CustomButton title="Add to Cart" onClick={() => addToCart(card)} />
        <CustomButton
          title="See more details"
          onClick={() => router.push(`/cards/${card.id}`)}
          className="border border-primary bg-transparent text-primary shadow-none text-white"
        />
      </div>
    </div>
  );
}

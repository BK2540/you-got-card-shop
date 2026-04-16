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
  const hasImage = Boolean(card.image);

  return (
    <div
      key={card.id}
      className="h-full rounded-2xl border border-white bg-white/20 p-4 shadow-md backdrop-blur-md"
    >
      <div className="flex h-full flex-col items-center gap-6">
        <div className="flex h-[430px] w-[286px] max-w-full items-center justify-center overflow-hidden rounded-xl bg-black/15">
          {hasImage ? (
            <Image
              src={card.image}
              alt={`card ${card.name}`}
              width={286}
              height={430}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-6 text-center text-lg font-medium text-white/70">
              No card image
            </div>
          )}
        </div>

        <div className="flex flex-1 w-full flex-col justify-between gap-6">
          <p className="text-center text-2xl font-bold text-primary">
            {card.name}
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            <CustomButton title="Add to Cart" onClick={() => addToCart(card)} />
            <CustomButton
              title="See more details"
              onClick={() => router.push(`/cards/${card.id}`)}
              className="border border-primary bg-transparent text-primary shadow-none text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

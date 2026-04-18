// components/CardItem.tsx
"use client";

import { Card } from "@/types";
import Image from "next/image";
import CustomButton from "./CustomButton";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";

export default function CardItem({ card }: { card: Card }) {
  const router = useRouter();
  const hasImage = Boolean(card.image);
  const { addToCart } = useCart();
  const isGradeTen = /\b10\b/.test(card.grade.trim());
  const cardFrameClass = card.isRecommended
    ? "recommended-card-frame"
    : "border border-orange70";

  return (
    <div
      key={card.id}
      className={`h-full rounded-2xl bg-white/8 p-4 shadow-sm backdrop-blur-xl relative ${cardFrameClass}`}
    >
      <div className="flex h-full flex-col items-center gap-6">
        <div className="relative flex h-[320px] w-[220px] max-w-full items-center justify-center overflow-hidden rounded-xl bg-black/15">
          {hasImage ? (
            <Image
              src={card.image}
              alt={`card ${card.name}`}
              width={220}
              height={320}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-6 text-center text-lg font-medium text-white/70">
              No card image
            </div>
          )}

          {isGradeTen && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 hologram-overlay"
            />
          )}
        </div>

        <div className="flex flex-1 w-full flex-col justify-between gap-6">
          <div className="space-y-2 text-center">
            {/* <p className="text-xl font-bold text-primary">{card.playerName}</p> */}
            <p className="text-2xl font-bold text-orange70">{card.name}</p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              {card.isRecommended && (
                <span className="rounded-full bg-orange-500/20 px-2 py-1 text-orange-300">
                  Recommended
                </span>
              )}
              {card.isNewArrival && (
                <span className="rounded-full bg-sky-500/20 px-2 py-1 text-sky-300">
                  New Arrival
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <CustomButton
              title="See more details"
              onClick={() => router.push(`/cards/${card.id}`)}
              className="border border-primary bg-transparent shadow-none text-white"
            />
            <CustomButton
              title="Add to Cart"
              onClick={() => addToCart(card, 1)}
              disable={card.status !== "ACTIVE" || card.quantity < 1}
            />
          </div>
        </div>
      </div>

      {isGradeTen && (
        <div className="absolute right-2 top-2 rounded-full border border-cyan-300/60 bg-cyan-400/20 px-3 py-1 text-xs font-semibold tracking-[0.15em] text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.5)]">
          GEM 10
        </div>
      )}
    </div>
  );
}

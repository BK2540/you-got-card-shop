// components/CardItem.tsx
"use client";

import { Card } from "@/types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import AddShoppingCartOutlinedIcon from "@mui/icons-material/AddShoppingCartOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

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
      className={`relative h-full rounded-2xl bg-white/8 p-3 shadow-sm backdrop-blur-xl sm:p-4 ${cardFrameClass}`}
    >
      <div className="flex h-full flex-col items-center gap-4 sm:gap-6">
        <div className="relative flex aspect-[11/16] w-[clamp(8.5rem,42vw,13.75rem)] max-w-full items-center justify-center overflow-hidden rounded-xl bg-black/15">
          {hasImage ? (
            <Image
              src={card.image}
              alt={`card ${card.name}`}
              width={220}
              height={320}
              sizes="(max-width: 640px) 42vw, (max-width: 1024px) 220px, 220px"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-3 text-center text-sm font-medium text-white/70 sm:px-6 sm:text-lg">
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

        <div className="flex w-full flex-1 flex-col justify-between gap-4 sm:gap-6">
          <div className="space-y-2 text-center">
            {/* <p className="text-xl font-bold text-primary">{card.playerName}</p> */}
            <p className="text-lg font-bold text-orange70 sm:text-2xl">
              {card.name}
            </p>
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

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              aria-label={`See more details for ${card.name}`}
              title="See more details"
              onClick={() => router.push(`/cards/${card.id}`)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-primary bg-transparent text-white transition hover:bg-white/10 sm:w-auto sm:px-5"
            >
              <InfoOutlinedIcon fontSize="small" />
              <span className="hidden sm:ml-2 sm:inline">See more details</span>
            </button>
            <button
              type="button"
              aria-label={`Add ${card.name} to cart`}
              title="Add to cart"
              onClick={() => addToCart(card, 1)}
              disabled={card.status !== "ACTIVE" || card.quantity < 1}
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-r from-orange-400 to-orange-600 font-semibold text-white shadow-lg transition hover:scale-105 disabled:cursor-default disabled:opacity-40 sm:w-auto sm:px-5"
            >
              <AddShoppingCartOutlinedIcon fontSize="small" />
              <span className="hidden sm:ml-2 sm:inline">Add to Cart</span>
            </button>
          </div>
        </div>
      </div>

      {isGradeTen && (
        <div className="absolute right-2 top-2 rounded-full border border-cyan-300/60 bg-cyan-400/20 px-2 py-1 text-[10px] font-semibold tracking-[0.15em] text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.5)] sm:px-3 sm:text-xs">
          GEM 10
        </div>
      )}
    </div>
  );
}

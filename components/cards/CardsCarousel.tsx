"use client";

import CardItem from "@/components/CardItem";
import { Card } from "@/types";
import { useEffect, useMemo, useState } from "react";

type CardsCarouselProps = {
  cards: Card[];
};

export default function CardsCarousel({ cards }: CardsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    const updateVisibleCount = () => {
      setVisibleCount(window.innerWidth >= 1024 ? 3 : 1);
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);

    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  const maxIndex = useMemo(
    () => Math.max(0, cards.length - visibleCount),
    [cards.length, visibleCount],
  );
  const safeActiveIndex = Math.min(activeIndex, maxIndex);

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300"
          style={{
            transform: `translateX(-${(safeActiveIndex * 100) / visibleCount}%)`,
          }}
        >
          {cards.map((card) => (
            <div key={card.id} className="w-full shrink-0 px-2 lg:w-1/3">
              <CardItem card={card} />
            </div>
          ))}
        </div>
      </div>

      {cards.length > visibleCount && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setActiveIndex((current) => Math.max(0, current - 1))}
            disabled={safeActiveIndex === 0}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-white/10"
          >
            Prev
          </button>
          <p className="text-sm text-gray-300">
            {Math.min(safeActiveIndex + 1, maxIndex + 1)} / {maxIndex + 1}
          </p>
          <button
            type="button"
            onClick={() =>
              setActiveIndex((current) => Math.min(maxIndex, current + 1))
            }
            disabled={safeActiveIndex >= maxIndex}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white transition disabled:cursor-not-allowed disabled:opacity-40 hover:bg-white/10"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import CardItem from "@/components/CardItem";
import { useCart } from "@/hooks/useCart";
import { getCards } from "@/lib/api/cards";
import { Card } from "@/types";
import Image from "next/image";
import { use, useEffect, useRef, useState } from "react";
import CustomButton from "@/components/CustomButton";

export default function CardDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const { id } = use(params);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState<Record<string, string>>(
    {},
  );
  const card = cards.find((c) => c.id === id);
  const heroImage =
    card?.images.find((image) => image.isHero)?.url ?? card?.image ?? "";
  const selectedImage = card ? (selectedImages[card.id] ?? heroImage) : "";

  const { addToCart } = useCart();

  useEffect(() => {
    let mounted = true;

    getCards().then((data) => {
      if (mounted) {
        setCards(data);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (cards.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % cards.length);
    }, 3500);

    return () => window.clearInterval(interval);
  }, [cards.length]);

  useEffect(() => {
    const track = carouselRef.current;

    if (!track) {
      return;
    }

    const slides = track.children;
    const targetSlide = slides.item(activeSlide) as HTMLElement | null;

    if (!targetSlide) {
      return;
    }

    track.scrollTo({
      left: targetSlide.offsetLeft,
      behavior: "smooth",
    });
  }, [activeSlide]);

  const goToSlide = (index: number) => {
    setActiveSlide(index);
  };

  const showPreviousSlide = () => {
    setActiveSlide((current) => (current - 1 + cards.length) % cards.length);
  };

  const showNextSlide = () => {
    setActiveSlide((current) => (current + 1) % cards.length);
  };

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!card) return <div className="p-8">Not found</div>;

  return (
    <div className="px-6 lg:px-16 py-10 text-white">
      {/* 🔥 MAIN SECTION */}
      <div className="flex flex-col lg:flex-row gap-10">
        {/* 🖼 LEFT: IMAGE + THUMB */}
        <div className="flex-1 flex flex-col items-center lg:items-start gap-4">
          {/* main image */}
          <div className="h-[600px] w-full max-w-[400px] rounded-2xl border border-white/10 bg-white/5 shadow-2xl overflow-hidden">
            <Image
              src={selectedImage || card.image}
              alt={card.name}
              width={400}
              height={600}
              className="h-full w-full object-cover"
            />
          </div>

          {/* thumbnails */}
          <div className="flex gap-3">
            {card.images.map((image) => (
              <button
                key={image.id}
                type="button"
                onClick={() =>
                  setSelectedImages((current) => ({
                    ...current,
                    [card.id]: image.url,
                  }))
                }
                className={`overflow-hidden rounded-lg border ${
                  selectedImage === image.url
                    ? "border-orange-500"
                    : "border-white/10"
                }`}
              >
                <Image
                  src={image.url}
                  alt={`${card.name} thumbnail`}
                  width={64}
                  height={80}
                  className="h-20 w-16 object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* 📊 RIGHT: INFO */}
        <div className="flex-1 flex flex-col gap-6">
          {/* title */}
          <div>
            <h1 className="text-3xl lg:text-5xl font-bold">
              {card.playerName}
            </h1>
            <p className="mt-1 text-base text-gray-300">{card.name}</p>
          </div>

          {/* price */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl">
            <p className="text-orange70 text-base">CURRENT VALUE</p>
            <p className="text-3xl font-bold">${card.price}</p>

            <div className="flex gap-3 mt-4">
              {/* <button className="flex-1 bg-linear-to-r from-orange-500 to-orange-600 py-3 rounded-xl font-semibold hover:scale-105 transition">
                BUY IT NOW
              </button> */}

              {/* <button
                className="flex-1 bg-white/10 border border-white/10 py-3 rounded-xl hover:bg-white/20 transition"
                onClick={() => addToCart(card, 1)}
                disabled={card.status !== "ACTIVE" || card.quantity < 1}
              >
                ADD TO CART
              </button> */}
              <CustomButton
                title="Add to cart"
                onClick={() => addToCart(card, 1)}
                disable={card.status !== "ACTIVE" || card.quantity < 1}
              />
            </div>
          </div>

          {/* specs */}
          <div className="text-sm grid grid-cols-2 gap-4">
            <div>
              <p className="text-orange70 text-base">TEAM</p>
              <p className="text-white text-xl font-bold">{card.team}</p>
            </div>

            <div>
              <p className="text-orange70 text-base">GRADE</p>
              <p className="text-white text-xl font-bold">{card.grade}</p>
            </div>

            <div>
              <p className="text-orange70 text-base">YEAR</p>
              <p className="text-white text-xl font-bold">{card.year}</p>
            </div>

            <div>
              <p className="text-orange70 text-base">TYPE</p>
              <p className="text-white text-xl font-bold">
                {card.isRecommended
                  ? "Recommended"
                  : card.isNewArrival
                    ? "New Arrival"
                    : "Standard"}
              </p>
            </div>

            <div>
              <p className="text-orange70 text-base">PRINT RUN</p>
              <p className="text-white text-xl font-bold">
                {card.printRun || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 RELATED SECTION */}
      <div className="mt-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Related in the Vault</h2>
          {cards.length > 3 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={showPreviousSlide}
                className="h-11 w-11 rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Show previous card"
              >
                ←
              </button>
              <button
                type="button"
                onClick={showNextSlide}
                className="h-11 w-11 rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Show next card"
              >
                →
              </button>
            </div>
          )}
        </div>
        <div
          ref={carouselRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-hidden scroll-smooth"
        >
          {cards.map((card) => (
            <div
              key={card.id}
              className="min-w-full snap-center md:min-w-[calc(50%-2rem)] xl:min-w-[calc(30%-0.2rem)]"
            >
              <CardItem card={card} />
            </div>
          ))}
        </div>

        {cards.length > 1 && (
          <div className="flex items-center justify-center gap-2 my-6">
            {cards.map((card, index) => (
              <button
                key={card.id}
                type="button"
                onClick={() => goToSlide(index)}
                className={`h-2.5 rounded-full transition-all ${
                  activeSlide === index
                    ? "w-8 bg-orange-500"
                    : "w-2.5 bg-white/30 hover:bg-white/50"
                }`}
                aria-label={`Go to card ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

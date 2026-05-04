"use client";

import CardItem from "@/components/CardItem";
import CustomButton from "@/components/CustomButton";
import { useCart } from "@/hooks/useCart";
import { getCards } from "@/lib/api/cards";
import { Card } from "@/types";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import Image from "next/image";
import { use, useEffect, useRef, useState } from "react";

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
  const card = cards.find((currentCard) => currentCard.id === id);
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

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!card) {
    return <div className="p-8">Not found</div>;
  }

  return (
    <div className="px-4 py-10 text-white sm:px-6 lg:px-16">
      <div className="flex flex-col gap-10 lg:flex-row">
        <div className="flex flex-1 flex-col items-center gap-4 lg:items-start">
          <div className="aspect-[2/3] w-full max-w-[min(100%,400px)] overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl">
            <Image
              src={selectedImage || card.image}
              alt={card.name}
              width={400}
              height={600}
              sizes="(max-width: 640px) 92vw, 400px"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex w-full max-w-[400px] gap-3 overflow-x-auto pb-1">
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
                className={`shrink-0 overflow-hidden rounded-lg border ${
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

        <div className="flex flex-1 flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold lg:text-5xl">
              {card.playerName}
            </h1>
            <p className="mt-1 text-base text-gray-300">{card.name}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:p-6">
            <p className="text-base text-orange70">CURRENT VALUE</p>
            <p className="text-3xl font-bold">${card.price}</p>

            <div className="mt-4 flex gap-3">
              <CustomButton
                title="Add to cart"
                onClick={() => addToCart(card, 1)}
                disable={card.status !== "ACTIVE" || card.quantity < 1}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-base text-orange70">TEAM</p>
              <p className="text-xl font-bold text-white">{card.team}</p>
            </div>

            <div>
              <p className="text-base text-orange70">GRADE</p>
              <p className="text-xl font-bold text-white">{card.grade}</p>
            </div>

            <div>
              <p className="text-base text-orange70">YEAR</p>
              <p className="text-xl font-bold text-white">{card.year}</p>
            </div>

            <div>
              <p className="text-base text-orange70">TYPE</p>
              <p className="text-xl font-bold text-white">
                {card.isRecommended
                  ? "Recommended"
                  : card.isNewArrival
                    ? "New Arrival"
                    : "Standard"}
              </p>
            </div>

            <div>
              <p className="text-base text-orange70">PRINT RUN</p>
              <p className="text-xl font-bold text-white">
                {card.printRun || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Related in the Vault</h2>
          {cards.length > 3 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={showPreviousSlide}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Show previous card"
              >
                <ArrowBackOutlinedIcon fontSize="small" />
              </button>
              <button
                type="button"
                onClick={showNextSlide}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Show next card"
              >
                <ArrowForwardOutlinedIcon fontSize="small" />
              </button>
            </div>
          )}
        </div>

        <div
          ref={carouselRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-hidden scroll-smooth"
        >
          {cards.map((relatedCard) => (
            <div
              key={relatedCard.id}
              className="min-w-full snap-center md:min-w-[calc(50%-2rem)] xl:min-w-[calc(30%-0.2rem)]"
            >
              <CardItem card={relatedCard} />
            </div>
          ))}
        </div>

        {cards.length > 1 && (
          <div className="my-6 flex items-center justify-center gap-2">
            {cards.map((relatedCard, index) => (
              <button
                key={relatedCard.id}
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

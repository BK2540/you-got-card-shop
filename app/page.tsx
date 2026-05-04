"use client";

import Image from "next/image";
import basketballImage from "@/public/ball.png";
import CustomButton from "@/components/CustomButton";
import { useEffect, useRef, useState } from "react";
import { getCards } from "@/lib/api/cards";
import { Card } from "@/types";
import CardItem from "@/components/CardItem";
import { useCart } from "@/hooks/useCart";

type HomeContentResponse = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  featuredId?: string | null;
  featured?: {
    id: string;
    name: string;
    playerName: string;
    team: string;
    image: string;
    grade: string;
    printRun?: string | null;
  } | null;
} | null;

export default function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [homeContent, setHomeContent] = useState<HomeContentResponse>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();
  const heroPrintRun = homeContent?.featured?.printRun || "-";

  useEffect(() => {
    let mounted = true;

    getCards({ section: "new-arrival", limit: 8 }).then((data) => {
      if (mounted) setCards(data);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    fetch("/api/home", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch home content");
        }

        return res.json();
      })
      .then((data: HomeContentResponse) => {
        if (mounted) {
          setHomeContent(data);
        }
      })
      .catch(() => {
        if (mounted) {
          setHomeContent(null);
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

  const heroTitle = homeContent?.title?.trim() || "No data";
  const heroSubtitle = homeContent?.subtitle?.trim() || "No data";
  const heroDescription = homeContent?.description?.trim() || "No data";
  const heroPrice = homeContent?.price ?? 482500;
  const heroImage = homeContent?.featured?.image || basketballImage;
  const featuredLabel = homeContent?.featured
    ? `${homeContent.featured.playerName} ${homeContent.featured.name}`.toUpperCase()
    : "ZION WILLIAMSON";
  const heroGrade = homeContent?.featured?.grade || "No data";
  const heroTeam = homeContent?.featured?.team || "No data";
  const featuredCard =
    cards.find((card) => card.id === homeContent?.featuredId) ??
    cards.find((card) => card.id === homeContent?.featured?.id) ??
    null;

  return (
    <section className="min-h-screen flex flex-col px-6 lg:px-16 py-12 gap-25">
      <section className="w-full h-full flex flex-col lg:flex-row items-center gap-6 justify-between">
        <div className="flex-1 flex flex-col gap-6 text-center lg:text-left  w-full">
          <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight">
            <span className="text-white">{heroTitle}</span> <br />
            <span className="bg-linear-to-b from-orange-300 via-orange-400 to-orange-700 bg-clip-text text-transparent">
              {heroSubtitle}
            </span>
          </h1>

          <p className="text-white max-w-xl mx-auto lg:mx-0 text-xs md:text-sm wrap-break-word">
            {heroDescription}
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl max-w-md mx-auto lg:mx-0 w-full">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-orange70">PSA Grade</p>
                <p className="font-semibold text-white">{heroGrade}</p>
              </div>

              <div>
                <p className="text-orange70">TEAM</p>
                <p className="font-semibold text-white">{heroTeam}</p>
              </div>

              <div>
                <p className="text-orange70">PRINT RUN</p>
                <p className="font-semibold text-white">{heroPrintRun}</p>
              </div>

              <div>
                <p className="text-orange70">CURRENT PRICE</p>
                <p className="text-2xl font-bold text-white">
                  $
                  {heroPrice.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center lg:justify-start">
            <CustomButton
              title="Add to cart"
              onClick={() => {
                if (featuredCard) {
                  addToCart(featuredCard, 1);
                }
              }}
              disable={!featuredCard}
            />
          </div>
        </div>

        <div className="flex-1 flex justify-center items-center relative mt-12">
          <div className="absolute w-75 h-100 bg-black/50 blur-3xl translate-x-6 translate-y-10 rounded-3xl" />

          <div className="relative w-full max-w-100 lg:max-h-150 rounded-3xl overflow-hidden bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl rotate-6 hover:rotate-0 transition duration-500">
            <Image
              src={heroImage}
              alt={featuredLabel}
              className="w-full object-cover"
              width={400}
              height={600}
            />

            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 hologram-overlay"
            />

            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />

            <div className="absolute bottom-4 left-4">
              <p className="text-xs text-gray-300">FEATURED ASSET</p>
              <p className="text-lg font-bold">{featuredLabel}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full h-full flex flex-col gap-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <p className="bg-linear-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent text-5xl lg:text-[64px] font-bold">
            New Arrival
          </p>

          {cards.length > 1 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={showPreviousSlide}
                className="h-11 w-11 rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Show previous card"
              >
                &lt;
              </button>
              <button
                type="button"
                onClick={showNextSlide}
                className="h-11 w-11 rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Show next card"
              >
                &gt;
              </button>
            </div>
          )}
        </div>

        <div className="relative flex justify-center">
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
        </div>

        {cards.length > 1 && (
          <div className="flex items-center justify-center gap-2">
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
      </section>
    </section>
  );
}

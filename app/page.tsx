"use client";

import Image from "next/image";
import basketballImage from "@/public/images.png";
import CustomButton from "@/components/CustomButton";
import { useEffect, useRef, useState } from "react";
import { getCards } from "@/lib/api/cards";
import { Card } from "@/types";
import CardItem from "@/components/CardItem";

export default function Home() {
  const [cards, setCards] = useState<Card[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    getCards().then((data) => {
      if (mounted) setCards(data);
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

  return (
    <section className="min-h-screen flex flex-col px-6 lg:px-16 py-12 gap-25">
      <section className="w-full h-full flex flex-col lg:flex-row items-center justify-between">
        {/* 🔥 LEFT CONTENT */}
        <div className="flex-1 flex flex-col gap-6 text-center lg:text-left">
          {/* badge */}
          <div className="flex items-center gap-4 justify-center lg:justify-start">
            <span className="px-3 py-1 text-xs rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
              LEGENDARY DROP
            </span>
            <span className="text-xs text-gray-400">BATCH #0824</span>
          </div>

          {/* title */}
          <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight">
            <span className="text-white">ZION</span> <br />
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              WILLIAMSON
            </span>
          </h1>

          {/* description */}
          <p className="text-gray-400 max-w-xl mx-auto lg:mx-0">
            The 2019-20 Panini Prizm Gold rookie card remains the definitive
            centerpiece for modern basketball collectors. Encased in archival
            glass.
          </p>

          {/* 🔥 INFO CARD */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl max-w-md mx-auto lg:mx-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">RARITY LEVEL</p>
                <p className="font-semibold text-white">Gold Prizm /10</p>
              </div>

              <div>
                <p className="text-gray-500">AUTHENTICATION</p>
                <p className="font-semibold text-white">PSA 10 Gem Mint</p>
              </div>

              <div className="col-span-2">
                <p className="text-gray-500">CURRENT VALUATION</p>
                <p className="text-2xl font-bold text-white">
                  $482,500.00{" "}
                  {/* <span className="text-green-400 text-sm ml-2">+12.4%</span> */}
                </p>
              </div>
            </div>
          </div>

          {/* 🔥 BUTTONS */}
          <div className="flex gap-4 justify-center lg:justify-start">
            <CustomButton title="Buy Now" onClick={() => {}} />
          </div>
        </div>

        {/* 🔥 RIGHT CARD PREVIEW */}
        <div className="flex-1 flex justify-center items-center relative">
          {/* shadow */}
          <div className="absolute w-[300px] h-[400px] bg-black/50 blur-3xl translate-x-6 translate-y-10 rounded-3xl" />

          {/* card */}
          <div className="relative w-full max-w-[400px] h-[600px] rounded-3xl overflow-hidden bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl rotate-6 hover:rotate-0 transition duration-500">
            {/* image */}
            <Image
              src={basketballImage}
              alt="card"
              className="w-full  object-cover"
              width={400}
              height={600}
            />

            {/* overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* text */}
            <div className="absolute bottom-4 left-4">
              <p className="text-xs text-gray-300">FEATURED ASSET</p>
              <p className="text-lg font-bold">ZION WILLIAMSON</p>
            </div>
          </div>
        </div>
      </section>

      {/* new arrive */}
      <section className="w-full h-full flex flex-col gap-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <p className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent text-5xl lg:text-[64px] font-bold">
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

        <div className="relative  flex justify-center">
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

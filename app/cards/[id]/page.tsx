"use client";

import { getCards } from "@/lib/api/cards";
import { Card } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";

export default function CardDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [cards, setCards] = useState<Card[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const card = cards.find((c) => c.id === id);

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

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!card) return <div className="p-8">Not found</div>;

  return (
    <div className="px-6 lg:px-16 py-10 text-white">
      {/* 🔥 MAIN SECTION */}
      <div className="flex flex-col lg:flex-row gap-10">
        {/* 🖼 LEFT: IMAGE + THUMB */}
        <div className="flex-1 flex flex-col items-center lg:items-start gap-4">
          {/* main image */}
          <div className="w-full max-w-[400px] rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-2xl">
            <img src={card.image} className="w-full object-cover" />
          </div>

          {/* thumbnails */}
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((_, i) => (
              <div
                key={i}
                className="w-16 h-20 bg-white/10 rounded-lg border border-white/10"
              />
            ))}
          </div>
        </div>

        {/* 📊 RIGHT: INFO */}
        <div className="flex-1 flex flex-col gap-6">
          {/* title */}
          <div>
            <p className="text-sm text-gray-400">2019 Panini Prizm Gold</p>

            <h1 className="text-3xl lg:text-5xl font-bold">{card.name}</h1>
          </div>

          {/* price */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl">
            <p className="text-gray-400 text-sm">CURRENT VALUE</p>
            <p className="text-3xl font-bold">${card.price}</p>

            <div className="flex gap-3 mt-4">
              <button className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 py-3 rounded-xl font-semibold hover:scale-105 transition">
                BUY IT NOW
              </button>

              <button className="flex-1 bg-white/10 border border-white/10 py-3 rounded-xl hover:bg-white/20 transition">
                ADD TO CART
              </button>
            </div>
          </div>

          {/* specs */}
          <div className="text-sm grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500">TEAM</p>
              <p>{card.team}</p>
            </div>

            <div>
              <p className="text-gray-500">GRADE</p>
              <p>{card.grade}</p>
            </div>

            <div>
              <p className="text-gray-500">YEAR</p>
              <p>{card.year}</p>
            </div>

            <div>
              <p className="text-gray-500">TYPE</p>
              <p>Gold Prizm</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 RELATED SECTION */}
      <div className="mt-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Related in the Vault</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {cards.slice(0, 4).map((c) => (
            <Link
              href={`/cards/${c.id}`}
              key={c.id}
              className="bg-white/5 border border-white/10 rounded-xl p-3 hover:scale-105 transition"
            >
              <Image
                src={c.image}
                alt="card"
                className="w-full h-40 object-cover rounded-md"
              />
              <p className="mt-2 text-sm font-semibold">{c.name}</p>
              <p className="text-gray-400 text-sm">${c.price}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

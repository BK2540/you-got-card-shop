"use client";

import { useCart } from "@/hooks/useCart";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function CartPage() {
  const { items, subtotal, updateQty, removeFromCart } = useCart();
  const router = useRouter();

  return (
    <main className="px-6 lg:px-16 py-10 text-white">
      <h1 className="text-3xl font-bold mb-8">Cart</h1>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-surface p-6">
              Your cart is empty.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.cardId}
                className="rounded-2xl border border-white/10 bg-surface p-4 flex gap-4 items-center"
              >
                <Image
                  src={item.card.image || item.card.images?.[0]?.url}
                  alt={item.card.name}
                  className="w-24 h-32 object-cover rounded-xl"
                  width={96}
                  height={128}
                />

                <div className="flex-1">
                  <h2 className="font-semibold">{item.card.name}</h2>
                  <p className="text-gray-400">${item.card.price}</p>
                </div>

                <input
                  type="number"
                  min={1}
                  max={Math.max(1, item.card.quantity)}
                  value={item.quantity}
                  onChange={(e) =>
                    updateQty(item.cardId, Number(e.target.value))
                  }
                  className="w-20 rounded bg-black/30 border border-white/10 px-2 py-1"
                />

                <button onClick={() => removeFromCart(item.cardId)}>
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        <aside className="rounded-2xl border border-white/10 bg-surface p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Summary</h2>
          <div className="flex justify-between mb-4">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          <button
            onClick={() => router.push("/payment")}
            disabled={items.length === 0}
            className="w-full rounded-xl bg-orange-500 py-3 font-semibold disabled:opacity-50"
          >
            Checkout
          </button>
        </aside>
      </div>
    </main>
  );
}

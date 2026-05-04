"use client";

import { useCart } from "@/hooks/useCart";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

export default function CartPage() {
  const { items, subtotal, updateQty, removeFromCart } = useCart();
  const router = useRouter();

  return (
    <main className="px-4 py-10 text-white sm:px-6 lg:px-16">
      <h1 className="mb-8 text-3xl font-bold">Cart</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-surface p-6">
              Your cart is empty.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.cardId}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-surface p-3 sm:items-center sm:gap-4 sm:p-4"
              >
                <Image
                  src={item.card.image || item.card.images?.[0]?.url}
                  alt={item.card.name}
                  className="h-24 w-[4.5rem] shrink-0 rounded-xl object-cover sm:h-32 sm:w-24"
                  width={96}
                  height={128}
                />

                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">{item.card.name}</h2>
                  <p className="text-gray-400">${item.card.price}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, item.card.quantity)}
                      value={item.quantity}
                      onChange={(e) =>
                        updateQty(item.cardId, Number(e.target.value))
                      }
                      aria-label={`Quantity for ${item.card.name}`}
                      className="input-no-spinner h-10 w-16 rounded border border-white/10 bg-black/30 px-2 py-1"
                    />

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cardId)}
                      aria-label={`Remove ${item.card.name} from cart`}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 text-sm text-red-200 transition hover:bg-red-500/20"
                    >
                      <DeleteOutlineOutlinedIcon fontSize="small" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </div>
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

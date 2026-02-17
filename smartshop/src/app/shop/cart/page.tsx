// app/cart/page.tsx
"use client";
import Link from "next/link";
import { useCart, cartSelectors } from "@/store/cart";

export default function CartPage() {
  const list = useCart(cartSelectors.list);
  const subtotal = useCart(cartSelectors.subtotal);
  const remove = useCart((s) => s.remove);
  const setQty = useCart((s) => s.setQty);

  return (
    <div className="container space-y-6 py-10">
      <h1 className="text-2xl md:text-3xl font-extrabold">Your Cart</h1>

      {list.length === 0 ? (
        <p className="text-neutral-500">Your cart is empty.</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {list.map((it) => (
              <div key={it.key} className="flex gap-4 rounded-2xl border p-4">
                <img
                  src={it.image}
                  alt=""
                  className="h-24 w-24 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <div className="font-semibold">{it.title}</div>
                  <div className="mt-0.5 text-sm text-neutral-500">
                    {it.size && <>Size: {it.size} </>}
                    {it.size && it.color && <span>• </span>}
                    {it.color && <>Color: {it.color}</>}
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() => setQty(it.key, Math.max(1, it.qty - 1))}
                      className="rounded-full border px-2 py-1"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span>{it.qty}</span>
                    <button
                      onClick={() => setQty(it.key, it.qty + 1)}
                      className="rounded-full border px-2 py-1"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                    <button
                      onClick={() => remove(it.key)}
                      className="ml-4 text-sm underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="font-semibold">
                  ${Number(it.qty * it.price).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <aside className="h-max rounded-2xl border p-6">
            <div className="flex justify-between text-lg font-semibold">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              Taxes and shipping calculated at checkout.
            </p>
            <Link
              href="/shop/checkout"
              className="mt-4 block w-full rounded-xl bg-black py-3 text-center text-white hover:opacity-90"
            >
              Checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}

"use client";
import { useCart, cartSelectors } from "@/store/cart";

export default function CartPage() {
  const list = useCart(cartSelectors.list);
  const subtotal = useCart(cartSelectors.subtotal);
  const remove = useCart((s) => s.remove);
  const setQty = useCart((s) => s.setQty);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-extrabold">Your Cart</h1>

      {list.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          <div className="space-y-4">
            {list.map((it) => (
              <div key={it.key} className="flex gap-4 border rounded-2xl p-4">
                <img src={it.image} alt="" className="w-24 h-24 rounded-xl object-cover" />
                <div className="flex-1">
                  <div className="font-semibold">{it.name}</div>
                  <div className="text-sm text-muted">
                    {it.size && <>Size: {it.size} </>}
                    {it.color && <>• Color: {it.color}</>}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <button onClick={() => setQty(it.key, Math.max(1, it.qty - 1))} className="px-2 py-1 border rounded-full">−</button>
                    <span>{it.qty}</span>
                    <button onClick={() => setQty(it.key, it.qty + 1)} className="px-2 py-1 border rounded-full">+</button>
                    <button onClick={() => remove(it.key)} className="ml-4 text-sm underline">Remove</button>
                  </div>
                </div>
                <div className="font-semibold">${(it.qty * it.price).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <aside className="border rounded-2xl p-6 h-max">
            <div className="flex justify-between font-semibold text-lg">
              <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
            </div>
            <p className="text-sm text-muted mt-1">Taxes and shipping calculated at checkout.</p>
            <button className="mt-4 w-full bg-black text-white rounded-xl py-3">Checkout</button>
          </aside>
        </div>
      )}
    </div>
  );
}

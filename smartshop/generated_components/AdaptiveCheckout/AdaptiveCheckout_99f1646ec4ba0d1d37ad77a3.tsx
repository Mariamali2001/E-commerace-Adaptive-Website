import React, { useState } from "react";

export type CheckoutItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
};

export type CheckoutProps = {
  items?: CheckoutItem[];
  subtotal?: number;
  currency?: string;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
};

const defaultItems: CheckoutItem[] = [
  {
    id: "item-1",
    name: "Everyday Essentials",
    quantity: 1,
    price: 89,
  },
];

export function OnePageCheckout({
  items = defaultItems,
  subtotal,
  currency = "$",
  onSubmit,
}: CheckoutProps) {
  const [completed, setCompleted] = useState(false);

  const calculatedSubtotal =
    subtotal ?? items.reduce((total, item) => total + item.price * item.quantity, 0);
  const shipping = calculatedSubtotal >= 75 ? 0 : 6.95;
  const tax = calculatedSubtotal * 0.08;
  const total = calculatedSubtotal + shipping + tax;

  const formatPrice = (amount: number) => `${currency}${amount.toFixed(2)}`;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (onSubmit) {
      onSubmit(event);
      return;
    }

    event.preventDefault();
    setCompleted(true);
  };

  if (completed) {
    return (
      <main className="min-h-screen bg-white px-5 py-12 text-slate-900 sm:px-8">
        <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
          <section className="w-full rounded-3xl bg-slate-50 px-6 py-12 text-center sm:px-12">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Thank you for your order</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
              Your order has been received. We&apos;ll send a confirmation and tracking details to your email.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Secure checkout</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Complete your order</h1>
          </div>
          <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect width="16" height="18" x="4" y="3" rx="2" />
              <path d="M8 7h8M8 11h8M8 15h5" strokeLinecap="round" />
            </svg>
            <span>One-page checkout</span>
          </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <form onSubmit={handleSubmit} className="space-y-8">
            <section aria-labelledby="contact-heading">
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <h2 id="contact-heading" className="text-xl font-semibold">
                  Contact information
                </h2>
                <span className="text-xs text-slate-500">Required fields</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium">Email address</span>
                  <input
                    required
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl bg-slate-100 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:bg-slate-200 focus:ring-2 focus:ring-slate-900/10"
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium">Phone number <span className="font-normal text-slate-400">(optional)</span></span>
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    placeholder="(555) 555-5555"
                    className="w-full rounded-xl bg-slate-100 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:bg-slate-200 focus:ring-2 focus:ring-slate-900/10"
                  />
                </label>
              </div>
            </section>

            <section aria-labelledby="shipping-heading">
              <h2 id="shipping-heading" className="mb-4 text-xl font-semibold">
                Shipping address
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium">Full name</span>
                  <input
                    required
                    name="name"
                    autoComplete="name"
                    placeholder="Alex Morgan"
                    className="w-full rounded-xl bg-slate-100 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:bg-slate-200 focus:ring-2 focus:ring-slate-900/10"
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium">Address</span>
                  <input
                    required
                    name="address"
                    autoComplete="street-address"
                    placeholder="123 Main Street"
                    className="w-full rounded-xl bg-slate-100 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:bg-slate-200 focus:ring-2 focus:ring-slate-900/10"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium">City</span>
                  <input
                    required
                    name="city"
                    autoComplete="address-level2"
                    placeholder="New York"
                    className="w-full rounded-xl bg-slate-100 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:bg-slate-200 focus:ring-2 focus:ring-slate-900/10"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium">State</span>
                  <select
                    required
                    name="state"
                    autoComplete="address-level1"
                    defaultValue=""
                    className="w-full appearance-none rounded-xl bg-slate-100 px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:bg-slate-200 focus:ring-2 focus:ring-slate-900/10"
                  >
                    <option value="" disabled>
                      Select state
                    </option>
                    <option>California</option>
                    <option>New York</option>
                    <option>Texas</option>
                    <option>Florida</option>
                    <option>Washington</option>
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium">ZIP code</span>
                  <input
                    required
                    name="zip"
                    autoComplete="postal-code"
                    placeholder="10001"
                    className="w-full rounded-xl bg-slate-100 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:bg-slate-200 focus:ring-2 focus:ring-slate-900/10"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium">Country</span>
                  <select
                    required
                    name="country"
                    autoComplete="country-name"
                    defaultValue="United States"
                    className="w-full appearance-none rounded-xl bg-slate-100 px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:bg-slate-200 focus:ring-2 focus:ring-slate-900/10"
                  >
                    <option>United States</option>
                    <option>Canada</option>
                    <option>United Kingdom</option>
                  </select>
                </label>
              </div>
            </section>

            <section aria-labelledby="payment-heading">
              <h2 id="payment-heading" className="mb-4 text-xl font-semibold">
                Payment details
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium">Card number</span>
                  <input
                    required
                    inputMode="numeric"
                    name="cardNumber"
                    autoComplete="cc-number"
                    placeholder="1234 5678 9012 3456"
                    className="w-full rounded-xl bg-slate-100 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:bg-slate-200 focus:ring-2 focus:ring-slate-900/10"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium">Expiration date</span>
                  <input
                    required
                    name="expiration"
                    autoComplete="cc-exp"
                    placeholder="MM / YY"
                    className="w-full rounded-xl bg-slate-100 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:bg-slate-200 focus:ring-2 focus:ring-slate-900/10"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-sm font-medium">Security code</span>
                  <input
                    required
                    inputMode="numeric"
                    name="cvc"
                    autoComplete="cc-csc"
                    placeholder="CVC"
                    className="w-full rounded-xl bg-slate-100 px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 focus:bg-slate-200 focus:ring-2 focus:ring-slate-900/10"
                  />
                </label>
              </div>
            </section>

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-6 py-4 text-base font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/20"
            >
              Place order · {formatPrice(total)}
            </button>

            <p className="text-center text-xs leading-5 text-slate-500">
              By placing your order, you agree to our terms and conditions and privacy policy.
            </p>
          </form>

          <aside className="rounded-3xl bg-slate-50 p-5 sm:p-6 lg:sticky lg:top-8" aria-label="Order summary">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Order summary</h2>
              <span className="text-sm text-slate-500">{items.length} {items.length === 1 ? "item" : "items"}</span>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                    {item.image ? (
                      <img src={item.image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-7 w-7 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M5 7h14l1 13H4L5 7Z" />
                        <path d="M9 10V5a3 3 0 0 1 6 0v5" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500">Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="my-6 h-px bg-slate-200" />

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatPrice(calculatedSubtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated tax</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between pt-2 text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 7h12l1 13H5L6 7Z" />
                  <path d="M9 7V5a3 3 0 0 1 6 0v2M12 11v3" strokeLinecap="round" />
                </svg>
                <span>Only 3 left in stock</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-900">
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Order within <strong>09:42</strong> for today&apos;s dispatch</span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect width="14" height="17" x="5" y="3.5" rx="2" />
                <path d="M8.5 11.5 11 14l4.5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Payments are encrypted and secure</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
import { useState, type FormEvent } from "react";

export type CheckoutItem = {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  stockRemaining?: number;
};

export type CheckoutSubmitData = {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  cardNumber: string;
  expiration: string;
  securityCode: string;
  items: CheckoutItem[];
};

export type CheckoutProps = {
  items: CheckoutItem[];
  currency?: string;
  onSubmit?: (data: CheckoutSubmitData) => void;
};

export function OnePageCheckout({
  items,
  currency = "USD",
  onSubmit,
}: CheckoutProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const data: CheckoutSubmitData = {
      email: String(form.get("email") ?? ""),
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      address: String(form.get("address") ?? ""),
      apartment: String(form.get("apartment") ?? ""),
      city: String(form.get("city") ?? ""),
      state: String(form.get("state") ?? ""),
      postalCode: String(form.get("postalCode") ?? ""),
      country: String(form.get("country") ?? ""),
      cardNumber: String(form.get("cardNumber") ?? ""),
      expiration: String(form.get("expiration") ?? ""),
      securityCode: String(form.get("securityCode") ?? ""),
      items,
    };

    try {
      await onSubmit?.(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <div className="mb-10 flex items-center justify-between border-b border-slate-200 pb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
          <span className="text-sm text-slate-500">Secure checkout</span>
        </div>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
          <form onSubmit={handleSubmit} className="space-y-10">
            <section aria-labelledby="contact-heading">
              <div className="mb-5">
                <h2 id="contact-heading" className="text-lg font-medium">
                  Contact information
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  We&apos;ll use this email to send your order confirmation.
                </p>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">Email</span>
                <input
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                />
              </label>
            </section>

            <section aria-labelledby="shipping-heading">
              <div className="mb-5">
                <h2 id="shipping-heading" className="text-lg font-medium">
                  Shipping address
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the address where you&apos;d like your order delivered.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    First name
                  </span>
                  <input
                    required
                    name="firstName"
                    autoComplete="given-name"
                    className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    Last name
                  </span>
                  <input
                    required
                    name="lastName"
                    autoComplete="family-name"
                    className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium">
                    Address
                  </span>
                  <input
                    required
                    name="address"
                    autoComplete="street-address"
                    className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium">
                    Apartment, suite, etc.{" "}
                    <span className="font-normal text-slate-400">
                      (optional)
                    </span>
                  </span>
                  <input
                    name="apartment"
                    autoComplete="address-line2"
                    className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">City</span>
                  <input
                    required
                    name="city"
                    autoComplete="address-level2"
                    className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    State / province
                  </span>
                  <input
                    required
                    name="state"
                    autoComplete="address-level1"
                    className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    Postal code
                  </span>
                  <input
                    required
                    name="postalCode"
                    autoComplete="postal-code"
                    className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">
                    Country
                  </span>
                  <select
                    required
                    name="country"
                    defaultValue="United States"
                    autoComplete="country-name"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                  >
                    <option>United States</option>
                    <option>Canada</option>
                    <option>United Kingdom</option>
                    <option>Australia</option>
                  </select>
                </label>
              </div>
            </section>

            <section aria-labelledby="payment-heading">
              <div className="mb-5">
                <h2 id="payment-heading" className="text-lg font-medium">
                  Payment
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your payment information is encrypted and secure.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-sm font-medium">Credit or debit card</span>
                  <span className="text-xs text-slate-500">Visa · Mastercard · Amex</span>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">
                      Card number
                    </span>
                    <input
                      required
                      name="cardNumber"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="1234 5678 9012 3456"
                      className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                    />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium">
                        Expiration date
                      </span>
                      <input
                        required
                        name="expiration"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM / YY"
                        className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium">
                        Security code
                      </span>
                      <input
                        required
                        name="securityCode"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="CVC"
                        className="h-12 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-14 w-full rounded-full bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-950/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Processing…" : `Place order · ${formatPrice(subtotal)}`}
            </button>
          </form>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6 lg:sticky lg:top-8">
            <h2 className="text-lg font-medium">Order summary</h2>

            <div className="mt-6 space-y-5">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                        Item
                      </div>
                    )}
                    <span className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-950 px-1 text-[10px] font-semibold text-white">
                      {item.quantity}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3">
                      <h3 className="truncate text-sm font-medium">{item.name}</h3>
                      <span className="shrink-0 text-sm">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                    {item.description && (
                      <p className="mt-1 text-xs text-slate-500">
                        {item.description}
                      </p>
                    )}
                    {typeof item.stockRemaining === "number" && (
                      <p className="mt-2 text-xs font-medium text-amber-700">
                        Only {item.stockRemaining} left in stock
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="my-6 border-t border-slate-200" />

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Shipping</span>
                <span>Calculated at no extra cost</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-4 text-base font-semibold">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-medium">Your items are in high demand.</p>
              <p className="text-amber-800">
                Complete your order soon to keep your items reserved.
              </p>
              <p className="font-semibold text-amber-900">
                Reservation expires in 09:58
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
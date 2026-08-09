import { FormEvent, useEffect, useState } from "react";

type CheckoutProps = {
  productName?: string;
  price?: string;
  onComplete?: () => void;
};

export function OnePageCheckout({
  productName = "Everyday Essentials Set",
  price = "$89.00",
  onComplete,
}: CheckoutProps) {
  const [secondsLeft, setSecondsLeft] = useState(2 * 60 * 60);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const hours = Math.floor(secondsLeft / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((secondsLeft % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onComplete?.();
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
        <header className="mb-10 flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="text-xl font-semibold tracking-tight">Checkout</div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.7 1.7-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.4v-.2a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.7-1.7.06-.06A1.7 1.7 0 0 0 8.4 15a1.7 1.7 0 0 0-1.56-1.03H6.6v-2.4h.24A1.7 1.7 0 0 0 8.4 10a1.7 1.7 0 0 0-.34-1.88L8 8.06l1.7-1.7.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 12.67 5.2V5h2.4v.2a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.7 1.7-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03h.2v2.4h-.2A1.7 1.7 0 0 0 19.4 15Z"
              />
            </svg>
            Secure checkout
          </div>
        </header>

        <div className="mb-10 rounded-2xl bg-slate-50 px-5 py-4 sm:flex sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-sm font-medium text-slate-900">Limited-time offer</p>
            <p className="mt-1 text-sm text-slate-500">Sale ends in 2 hours</p>
          </div>
          <div
            aria-label={`Sale countdown: ${hours} hours, ${minutes} minutes, ${seconds} seconds`}
            className="mt-3 font-mono text-lg font-medium tabular-nums text-slate-900 sm:mt-0"
          >
            {hours}:{minutes}:{seconds}
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
          <form onSubmit={handleSubmit} className="space-y-10">
            <section>
              <div className="mb-5 flex items-baseline justify-between">
                <h1 className="text-2xl font-semibold tracking-tight">Complete your order</h1>
                <span className="text-sm text-slate-400">1 of 1</span>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
                  <input
                    required
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </label>
              </div>
            </section>

            <section className="border-t border-slate-100 pt-10">
              <h2 className="mb-5 text-lg font-semibold">Shipping address</h2>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">First name</span>
                  <input
                    required
                    type="text"
                    name="firstName"
                    autoComplete="given-name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Last name</span>
                  <input
                    required
                    type="text"
                    name="lastName"
                    autoComplete="family-name"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Address</span>
                  <input
                    required
                    type="text"
                    name="address"
                    autoComplete="street-address"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">City</span>
                  <input
                    required
                    type="text"
                    name="city"
                    autoComplete="address-level2"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Postal code</span>
                  <input
                    required
                    type="text"
                    name="postalCode"
                    autoComplete="postal-code"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </label>
              </div>
            </section>

            <section className="border-t border-slate-100 pt-10">
              <h2 className="mb-5 text-lg font-semibold">Payment</h2>
              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">Card number</span>
                  <input
                    required
                    inputMode="numeric"
                    name="cardNumber"
                    autoComplete="cc-number"
                    placeholder="1234 1234 1234 1234"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </label>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Expiration date</span>
                    <input
                      required
                      name="expiration"
                      autoComplete="cc-exp"
                      placeholder="MM / YY"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Security code</span>
                    <input
                      required
                      inputMode="numeric"
                      name="cvc"
                      autoComplete="cc-csc"
                      placeholder="CVC"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    />
                  </label>
                </div>
              </div>
            </section>

            <button
              type="submit"
              className="w-full rounded-full bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200"
            >
              Place order
            </button>
          </form>

          <aside className="h-fit rounded-2xl border border-slate-100 bg-slate-50 p-6 lg:sticky lg:top-8">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <div className="mt-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">{productName}</p>
                <p className="mt-1 text-sm text-slate-500">Quantity 1</p>
              </div>
              <p className="text-sm font-medium text-slate-900">{price}</p>
            </div>
            <div className="my-6 border-t border-slate-200" />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>{price}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Shipping</span>
                <span>Free</span>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-semibold">{price}</span>
            </div>
            <p className="mt-5 text-xs leading-5 text-slate-500">
              Your payment information is encrypted and securely processed.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
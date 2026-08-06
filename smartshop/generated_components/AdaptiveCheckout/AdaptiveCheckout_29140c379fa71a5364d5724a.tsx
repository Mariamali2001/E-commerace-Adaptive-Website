type CheckoutProps = {
  productName?: string;
  price?: string;
  onSubmit?: () => void;
};

export function OnePageCheckout({
  productName = "Premium Product",
  price = "$89.00",
  onSubmit,
}: CheckoutProps) {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <section>
          <header className="mb-10">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Checkout
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Complete your order
            </h1>
            <p className="mt-3 text-slate-600">
              Enter your details below to place your order.
            </p>
          </header>

          <form
            className="space-y-8"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit?.();
            }}
          >
            <section className="rounded-2xl bg-slate-50 p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Contact information</h2>
                <p className="mt-1 text-sm text-slate-500">
                  We&apos;ll use this to send your order confirmation.
                </p>
              </div>

              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Email address
                  </span>
                  <input
                    required
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl bg-white px-4 py-3.5 text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:bg-slate-100"
                  />
                </label>

                <label className="flex items-start gap-3 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="updates"
                    className="mt-0.5 h-4 w-4 rounded bg-white text-slate-900 accent-slate-900"
                  />
                  <span>Keep me updated about new products and offers</span>
                </label>
              </div>
            </section>

            <section className="rounded-2xl bg-slate-50 p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Shipping address</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Where should we deliver your order?
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Full name
                  </span>
                  <input
                    required
                    type="text"
                    name="name"
                    autoComplete="name"
                    placeholder="Your full name"
                    className="w-full rounded-xl bg-white px-4 py-3.5 text-slate-900 outline-none placeholder:text-slate-400 focus:bg-slate-100"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Address
                  </span>
                  <input
                    required
                    type="text"
                    name="address"
                    autoComplete="street-address"
                    placeholder="Street address"
                    className="w-full rounded-xl bg-white px-4 py-3.5 text-slate-900 outline-none placeholder:text-slate-400 focus:bg-slate-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    City
                  </span>
                  <input
                    required
                    type="text"
                    name="city"
                    autoComplete="address-level2"
                    placeholder="City"
                    className="w-full rounded-xl bg-white px-4 py-3.5 text-slate-900 outline-none placeholder:text-slate-400 focus:bg-slate-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Postal code
                  </span>
                  <input
                    required
                    type="text"
                    name="postalCode"
                    autoComplete="postal-code"
                    placeholder="Postal code"
                    className="w-full rounded-xl bg-white px-4 py-3.5 text-slate-900 outline-none placeholder:text-slate-400 focus:bg-slate-100"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Country
                  </span>
                  <select
                    required
                    name="country"
                    defaultValue=""
                    autoComplete="country-name"
                    className="w-full appearance-none rounded-xl bg-white px-4 py-3.5 text-slate-900 outline-none focus:bg-slate-100"
                  >
                    <option value="" disabled>
                      Select a country
                    </option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-2xl bg-slate-50 p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Payment details</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your payment information is secure and encrypted.
                </p>
              </div>

              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Card number
                  </span>
                  <input
                    required
                    inputMode="numeric"
                    name="cardNumber"
                    autoComplete="cc-number"
                    placeholder="1234 1234 1234 1234"
                    className="w-full rounded-xl bg-white px-4 py-3.5 text-slate-900 outline-none placeholder:text-slate-400 focus:bg-slate-100"
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Expiration date
                    </span>
                    <input
                      required
                      inputMode="numeric"
                      name="expiration"
                      autoComplete="cc-exp"
                      placeholder="MM / YY"
                      className="w-full rounded-xl bg-white px-4 py-3.5 text-slate-900 outline-none placeholder:text-slate-400 focus:bg-slate-100"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Security code
                    </span>
                    <input
                      required
                      inputMode="numeric"
                      name="securityCode"
                      autoComplete="cc-csc"
                      placeholder="CVC"
                      className="w-full rounded-xl bg-white px-4 py-3.5 text-slate-900 outline-none placeholder:text-slate-400 focus:bg-slate-100"
                    />
                  </label>
                </div>
              </div>
            </section>

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-slate-300 active:translate-y-px"
            >
              Place order
            </button>
          </form>
        </section>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-2xl bg-slate-50 p-6 sm:p-8">
            <h2 className="text-xl font-semibold">Order summary</h2>

            <div className="mt-6 flex gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Product
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium">{productName}</h3>
                <p className="mt-1 text-sm text-slate-500">Quantity: 1</p>
                <p className="mt-3 text-sm font-semibold">{price}</p>
              </div>
            </div>

            <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              Only 3 left in stock
            </p>

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{price}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-base font-bold">
                <span>Total</span>
                <span>{price}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
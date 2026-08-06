import { useState, type FormEvent } from "react";

type CheckoutValues = {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  cardNumber: string;
  expiration: string;
  cvc: string;
};

type ProgressBarCheckoutProps = {
  productName?: string;
  price?: string;
  onSubmit?: (values: CheckoutValues) => void;
};

const steps = ["Information", "Shipping", "Payment"];

export function ProgressBarCheckout({
  productName = "Your order",
  price = "$99.00",
  onSubmit,
}: ProgressBarCheckoutProps) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<CheckoutValues>({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    cardNumber: "",
    expiration: "",
    cvc: "",
  });

  const updateValue = (field: keyof CheckoutValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    onSubmit?.(values);
  };

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="mb-10">
            <div className="mb-3 flex items-center justify-between text-sm font-medium">
              {steps.map((label, index) => (
                <div
                  key={label}
                  className={index <= step ? "text-slate-900" : "text-slate-400"}
                >
                  <span className="hidden sm:inline">{index + 1}. </span>
                  {label}
                </div>
              ))}
            </div>

            <div className="relative h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-slate-900 transition-all duration-300"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="max-w-2xl">
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Contact information
                  </h1>
                  <p className="mt-2 text-sm text-slate-600">
                    Enter your details to continue checkout.
                  </p>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Email address</span>
                  <input
                    required
                    type="email"
                    value={values.email}
                    onChange={(event) => updateValue("email", event.target.value)}
                    className="w-full rounded-xl border-0 bg-slate-100 px-4 py-3 outline-none ring-0 placeholder:text-slate-400 focus:bg-slate-200"
                    placeholder="you@example.com"
                  />
                </label>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Shipping address
                  </h1>
                  <p className="mt-2 text-sm text-slate-600">
                    Where should we send your order?
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">First name</span>
                    <input
                      required
                      value={values.firstName}
                      onChange={(event) => updateValue("firstName", event.target.value)}
                      className="w-full rounded-xl border-0 bg-slate-100 px-4 py-3 outline-none focus:bg-slate-200"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">Last name</span>
                    <input
                      required
                      value={values.lastName}
                      onChange={(event) => updateValue("lastName", event.target.value)}
                      className="w-full rounded-xl border-0 bg-slate-100 px-4 py-3 outline-none focus:bg-slate-200"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Address</span>
                  <input
                    required
                    value={values.address}
                    onChange={(event) => updateValue("address", event.target.value)}
                    className="w-full rounded-xl border-0 bg-slate-100 px-4 py-3 outline-none focus:bg-slate-200"
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-3">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">City</span>
                    <input
                      required
                      value={values.city}
                      onChange={(event) => updateValue("city", event.target.value)}
                      className="w-full rounded-xl border-0 bg-slate-100 px-4 py-3 outline-none focus:bg-slate-200"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">State</span>
                    <input
                      required
                      value={values.state}
                      onChange={(event) => updateValue("state", event.target.value)}
                      className="w-full rounded-xl border-0 bg-slate-100 px-4 py-3 outline-none focus:bg-slate-200"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">ZIP code</span>
                    <input
                      required
                      value={values.zip}
                      onChange={(event) => updateValue("zip", event.target.value)}
                      className="w-full rounded-xl border-0 bg-slate-100 px-4 py-3 outline-none focus:bg-slate-200"
                    />
                  </label>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Payment details
                  </h1>
                  <p className="mt-2 text-sm text-slate-600">
                    Complete your order securely.
                  </p>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Card number</span>
                  <input
                    required
                    inputMode="numeric"
                    value={values.cardNumber}
                    onChange={(event) => updateValue("cardNumber", event.target.value)}
                    className="w-full rounded-xl border-0 bg-slate-100 px-4 py-3 outline-none focus:bg-slate-200"
                    placeholder="1234 5678 9012 3456"
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">Expiration date</span>
                    <input
                      required
                      value={values.expiration}
                      onChange={(event) => updateValue("expiration", event.target.value)}
                      className="w-full rounded-xl border-0 bg-slate-100 px-4 py-3 outline-none focus:bg-slate-200"
                      placeholder="MM / YY"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">CVC</span>
                    <input
                      required
                      inputMode="numeric"
                      value={values.cvc}
                      onChange={(event) => updateValue("cvc", event.target.value)}
                      className="w-full rounded-xl border-0 bg-slate-100 px-4 py-3 outline-none focus:bg-slate-200"
                      placeholder="123"
                    />
                  </label>
                </div>
              </div>
            )}

            <div className="mt-10 flex items-center gap-4">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((current) => current - 1)}
                  className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                {step === steps.length - 1 ? "Place order" : "Continue"}
              </button>
            </div>
          </form>
        </section>

        <aside className="h-fit rounded-2xl bg-slate-50 p-6">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <div className="mt-6 flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">{productName}</p>
              <p className="mt-2 text-sm font-medium text-red-600">
                Only 3 left in stock
              </p>
            </div>
            <p className="font-semibold">{price}</p>
          </div>
          <div className="my-6 h-px bg-slate-200" />
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span>{price}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
import { FormEvent, useState } from "react";

type CheckoutData = {
  email: string;
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
};

type ProgressBarCheckoutProps = {
  amount: number;
  currency?: string;
  productName?: string;
  onComplete?: (data: CheckoutData) => void;
};

const steps = ["Contact", "Shipping", "Payment"];

export function ProgressBarCheckout({
  amount,
  currency = "USD",
  productName = "Your order",
  onComplete,
}: ProgressBarCheckoutProps) {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [data, setData] = useState<CheckoutData>({
    email: "",
    fullName: "",
    address: "",
    city: "",
    postalCode: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  const formattedAmount = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount);

  const updateField = (field: keyof CheckoutData, value: string) => {
    setData((current) => ({ ...current, [field]: value }));
  };

  const canContinue = () => {
    if (step === 0) return Boolean(data.email);
    if (step === 1) {
      return Boolean(
        data.fullName && data.address && data.city && data.postalCode
      );
    }
    return Boolean(data.cardNumber && data.expiry && data.cvc);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step < steps.length - 1) {
      if (canContinue()) setStep((current) => current + 1);
      return;
    }

    if (canContinue()) {
      onComplete?.(data);
      setCompleted(true);
    }
  };

  const inputClassName =
    "mt-2 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900";

  if (completed) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
        <section className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-700">
            ✓
          </div>
          <h1 className="mt-5 text-2xl font-semibold">Thank you for your order</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your payment was submitted successfully.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
          <p className="mt-2 text-sm text-slate-600">
            Complete your order in a few simple steps.
          </p>
        </div>

        <div className="mb-10">
          <div className="flex items-center">
            {steps.map((label, index) => (
              <div key={label} className="flex flex-1 items-center">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium ${
                      index <= step
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-500"
                    }`}
                  >
                    {index < step ? "✓" : index + 1}
                  </div>
                  <span
                    className={`hidden text-sm font-medium sm:block ${
                      index <= step ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-3 h-px flex-1 ${
                      index < step ? "bg-slate-900" : "bg-slate-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8"
          >
            <div className="mb-8">
              <p className="text-sm font-medium text-slate-500">
                Step {step + 1} of {steps.length}
              </p>
              <h2 className="mt-1 text-xl font-semibold">{steps[step]} details</h2>
            </div>

            {step === 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Email address
                  <input
                    type="email"
                    value={data.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="you@example.com"
                    className={inputClassName}
                    required
                  />
                </label>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <label className="block text-sm font-medium text-slate-700">
                  Full name
                  <input
                    type="text"
                    value={data.fullName}
                    onChange={(event) => updateField("fullName", event.target.value)}
                    className={inputClassName}
                    required
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Address
                  <input
                    type="text"
                    value={data.address}
                    onChange={(event) => updateField("address", event.target.value)}
                    className={inputClassName}
                    required
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    City
                    <input
                      type="text"
                      value={data.city}
                      onChange={(event) => updateField("city", event.target.value)}
                      className={inputClassName}
                      required
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Postal code
                    <input
                      type="text"
                      value={data.postalCode}
                      onChange={(event) =>
                        updateField("postalCode", event.target.value)
                      }
                      className={inputClassName}
                      required
                    />
                  </label>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <label className="block text-sm font-medium text-slate-700">
                  Card number
                  <input
                    type="text"
                    inputMode="numeric"
                    value={data.cardNumber}
                    onChange={(event) =>
                      updateField("cardNumber", event.target.value)
                    }
                    placeholder="1234 5678 9012 3456"
                    className={inputClassName}
                    required
                  />
                </label>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Expiry date
                    <input
                      type="text"
                      inputMode="numeric"
                      value={data.expiry}
                      onChange={(event) => updateField("expiry", event.target.value)}
                      placeholder="MM / YY"
                      className={inputClassName}
                      required
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Security code
                    <input
                      type="text"
                      inputMode="numeric"
                      value={data.cvc}
                      onChange={(event) => updateField("cvc", event.target.value)}
                      placeholder="CVC"
                      className={inputClassName}
                      required
                    />
                  </label>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(0, current - 1))}
                className={`rounded-lg px-5 py-3 text-sm font-medium text-slate-700 ${
                  step === 0 ? "invisible" : "bg-slate-100 hover:bg-slate-200"
                }`}
              >
                Back
              </button>

              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
              >
                {step === steps.length - 1 ? "Place order" : "Continue"}
              </button>
            </div>
          </form>

          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Order summary</h2>
            <div className="mt-6 flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
              <span className="text-sm text-slate-600">{productName}</span>
              <span className="text-sm font-medium">{formattedAmount}</span>
            </div>
            <div className="flex items-center justify-between pt-5">
              <span className="font-medium">Total</span>
              <span className="text-lg font-semibold">{formattedAmount}</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
"use client";

import Link from "next/link";
import { useState } from "react";
import { useExperimentStore } from "@/store/experiment";
import { resolveVariants } from "@/lib/uiAdapter";
import { useAdaptiveAllowed } from "@/lib/experiment/useAdaptiveAllowed";
import {
  useCheckoutOrder,
  type ShippingAddress,
} from "./Checkout/useCheckoutOrder";
import { cn } from "@/lib/utils";
import { adaptiveFieldClass } from "@/lib/uiAdapter/adaptiveFieldClass";

type CheckoutMode = "one_page" | "multi_step" | "express";

function resolveCheckoutMode(variant: string | undefined): CheckoutMode {
  const id = (variant ?? "one_page").toLowerCase();
  if (id.includes("express")) return "express";
  if (id.includes("progress") || id.includes("multi")) return "multi_step";
  return "one_page";
}

const STEPS = [
  { id: "shipping", label: "Shipping" },
  { id: "payment", label: "Payment" },
  { id: "review", label: "Review" },
] as const;

function fieldClass(compact?: boolean) {
  return adaptiveFieldClass({ compact });
}

function ShippingFields({
  shippingAddress,
  handleInputChange,
  compact,
}: {
  shippingAddress: ShippingAddress;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <div>
        <label className="mb-2 block text-sm font-medium">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="fullName"
          value={shippingAddress.fullName}
          onChange={handleInputChange}
          className={fieldClass(compact)}
          required
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={shippingAddress.email}
            onChange={handleInputChange}
            className={fieldClass(compact)}
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={shippingAddress.phone}
            onChange={handleInputChange}
            placeholder="+1 (555) 000-0000"
            className={fieldClass(compact)}
            required
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">
          Street Address <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="street"
          value={shippingAddress.street}
          onChange={handleInputChange}
          placeholder="123 Main Street, Apt 4B"
          className={fieldClass(compact)}
          required
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="city"
            value={shippingAddress.city}
            onChange={handleInputChange}
            className={fieldClass(compact)}
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">
            State <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="state"
            value={shippingAddress.state}
            onChange={handleInputChange}
            placeholder="NY"
            className={fieldClass(compact)}
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">
            ZIP Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="zip"
            value={shippingAddress.zip}
            onChange={handleInputChange}
            placeholder="10001"
            className={fieldClass(compact)}
            required
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">
          Country <span className="text-red-500">*</span>
        </label>
        <select
          name="country"
          value={shippingAddress.country}
          onChange={handleInputChange}
          className={fieldClass(compact)}
          required
        >
          <option value="Egypt">Egypt</option>
          <option value="USA">United States</option>
          <option value="Canada">Canada</option>
          <option value="UK">United Kingdom</option>
          <option value="Australia">Australia</option>
        </select>
      </div>
    </div>
  );
}

function PaymentBlock({ compact }: { compact?: boolean }) {
  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      <div className="rounded-xl border-2 border-neutral-900 bg-neutral-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-neutral-900">
            <div className="h-3 w-3 rounded-full bg-neutral-900" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Cash on Delivery</div>
            <div className="text-sm text-neutral-600">
              Pay when you receive your order
            </div>
          </div>
        </div>
      </div>
      {!compact && (
        <p className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
          Please have the exact amount ready. Our delivery person will hand over
          your order after payment is received.
        </p>
      )}
    </div>
  );
}

function OrderSummary({
  checkout,
  onPlaceOrder,
  showButton = true,
  compact,
}: {
  checkout: ReturnType<typeof useCheckoutOrder>;
  onPlaceOrder: () => void;
  showButton?: boolean;
  compact?: boolean;
}) {
  const {
    list,
    subtotal,
    shipping,
    tax,
    total,
    submitting,
    error,
  } = checkout;

  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-200 bg-white p-6",
        !compact && "sticky top-4"
      )}
    >
      <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>
      <div className="mb-4 max-h-64 space-y-3 overflow-y-auto">
        {list.map((item) => (
          <div key={item.key} className="flex gap-3">
            <img
              src={item.image}
              alt={item.title}
              className="h-16 w-16 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.title}</p>
              <p className="text-xs text-neutral-500">Qty: {item.qty}</p>
              {item.size && (
                <p className="text-xs text-neutral-500">Size: {item.size}</p>
              )}
            </div>
            <div className="text-sm font-semibold">
              ${(item.price * item.qty).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2 border-t border-neutral-200 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Subtotal</span>
          <span className="font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Shipping</span>
          <span className="font-medium">
            {shipping === 0 ? (
              <span className="text-green-600">FREE</span>
            ) : (
              `$${shipping.toFixed(2)}`
            )}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Tax (2%)</span>
          <span className="font-medium">${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t border-neutral-200 pt-2 text-lg font-bold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
      {subtotal < 100 && (
        <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          Add ${(100 - subtotal).toFixed(2)} more for free shipping
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {showButton && (
        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={submitting}
          className="mt-6 w-full rounded-xl bg-neutral-900 py-4 font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Placing Order..." : "Place Order"}
        </button>
      )}
      <Link
        href="/shop/cart"
        className="mt-4 block text-center text-sm text-neutral-600 hover:text-neutral-900"
      >
        ← Back to Cart
      </Link>
    </div>
  );
}

function ProgressBar({ step }: { step: number }) {
  return (
    <ol className="mb-8 flex items-center gap-2">
      {STEPS.map((s, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <li key={s.id} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                done || active
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-200 text-neutral-600"
              )}
            >
              {i + 1}
            </div>
            <span
              className={cn(
                "hidden text-sm font-medium sm:inline",
                active ? "text-neutral-900" : "text-neutral-500"
              )}
            >
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-1 h-0.5 flex-1",
                  done ? "bg-neutral-900" : "bg-neutral-200"
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function CheckoutShell({
  mode,
  checkout,
}: {
  mode: CheckoutMode;
  checkout: ReturnType<typeof useCheckoutOrder>;
}) {
  const [step, setStep] = useState(0);
  const {
    shippingAddress,
    handleInputChange,
    placeOrder,
    submitting,
    error,
  } = checkout;

  if (mode === "express") {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <div className="rounded-2xl border border-neutral-900 bg-neutral-900 px-4 py-3 text-sm text-white">
          Express checkout — confirm details and place your order in one step.
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-semibold">Delivery & contact</h2>
          <form onSubmit={placeOrder}>
            <ShippingFields
              shippingAddress={shippingAddress}
              handleInputChange={handleInputChange}
              compact
            />
            <div className="mt-4">
              <PaymentBlock compact />
            </div>
            <div className="mt-5">
              <OrderSummary
                checkout={checkout}
                onPlaceOrder={() => placeOrder()}
                compact
              />
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (mode === "multi_step") {
    return (
      <div className="mx-auto max-w-3xl">
        <ProgressBar step={step} />
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          {step === 0 && (
            <>
              <h2 className="mb-4 text-xl font-semibold">Shipping</h2>
              <ShippingFields
                shippingAddress={shippingAddress}
                handleInputChange={handleInputChange}
              />
              <button
                type="button"
                className="btn mt-6 bg-neutral-900 text-white hover:opacity-90"
                onClick={() => setStep(1)}
              >
                Continue to Payment
              </button>
            </>
          )}
          {step === 1 && (
            <>
              <h2 className="mb-4 text-xl font-semibold">Payment</h2>
              <PaymentBlock />
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn border border-neutral-200 bg-white"
                  onClick={() => setStep(0)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn bg-neutral-900 text-white hover:opacity-90"
                  onClick={() => setStep(2)}
                >
                  Continue to Review
                </button>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2 className="mb-4 text-xl font-semibold">Review & place order</h2>
              <div className="mb-4 space-y-1 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700">
                <p>
                  <span className="font-medium">Ship to:</span>{" "}
                  {shippingAddress.fullName || "—"}
                </p>
                <p>
                  {shippingAddress.street}
                  {shippingAddress.city
                    ? `, ${shippingAddress.city}`
                    : ""}
                  {shippingAddress.state ? `, ${shippingAddress.state}` : ""}{" "}
                  {shippingAddress.zip}
                </p>
                <p>{shippingAddress.email}</p>
                <p className="pt-2">Payment: Cash on Delivery</p>
              </div>
              <OrderSummary
                checkout={checkout}
                onPlaceOrder={() => placeOrder()}
                compact
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn border border-neutral-200 bg-white"
                  onClick={() => setStep(1)}
                  disabled={submitting}
                >
                  Back
                </button>
              </div>
              {error && (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // one_page — original two-column layout
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Shipping Information</h2>
          <form onSubmit={placeOrder}>
            <ShippingFields
              shippingAddress={shippingAddress}
              handleInputChange={handleInputChange}
            />
          </form>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold">Payment Method</h2>
          <PaymentBlock />
        </div>
      </div>
      <OrderSummary checkout={checkout} onPlaceOrder={() => placeOrder()} />
    </div>
  );
}

/**
 * Checkout UI driven by Adaptive Engine `checkout_style` → `checkout` variant.
 * No LLM decisions here — only Final UI Configuration tokens.
 */
export function AdaptiveCheckout() {
  const { ready, allowed } = useAdaptiveAllowed();
  const uiConfig = useExperimentStore((s) => s.uiConfig);
  const checkout = useCheckoutOrder();

  const variants =
    ready && allowed && uiConfig ? resolveVariants(uiConfig) : null;
  const mode: CheckoutMode = variants
    ? resolveCheckoutMode(variants.checkout)
    : "one_page";

  if (checkout.empty) return null;

  return (
    <div
      className="container py-10"
      data-checkout-variant={mode}
      data-form-fields={variants?.formFields}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-bold">Checkout</h1>
          {variants ? (
            <p className="text-xs text-neutral-500">
              Layout:{" "}
              <span className="font-medium text-neutral-700">
                {mode === "multi_step"
                  ? "Multi-step / progress"
                  : mode === "express"
                    ? "Express"
                    : "One page"}
              </span>
              {" · "}
              Fields:{" "}
              <span className="font-medium text-neutral-700">
                {variants.formFields.replace(/_/g, " ")}
              </span>
            </p>
          ) : null}
        </div>
        <CheckoutShell mode={mode} checkout={checkout} />
      </div>
    </div>
  );
}

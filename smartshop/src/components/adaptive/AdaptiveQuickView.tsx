"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";
import { Price } from "@/components/shared/Price";
import { AdaptiveUrgencyCue } from "@/components/adaptive/AdaptiveUrgencyCue";
import { useCart } from "@/store/cart";
import { cn } from "@/lib/utils";

export type QuickViewMode =
  | "none"
  | "modal"
  | "sidebar"
  | "slide_up"
  | "new_tab"
  | "direct";

export function resolveQuickViewMode(variant: string | undefined): QuickViewMode {
  const id = (variant ?? "no_quick_view").toLowerCase();
  if (id.includes("no_quick") || id.includes("none")) return "none";
  if (id.includes("new_tab")) return "new_tab";
  if (id.includes("direct")) return "direct";
  if (id.includes("sidebar") || id.includes("slide_in")) return "sidebar";
  if (id.includes("slide_up") || id.includes("bottom")) return "slide_up";
  if (id.includes("modal") || id.includes("popup") || id.includes("overlay")) {
    return "modal";
  }
  return "none";
}

type OverlayProps = {
  product: Product;
  mode: "modal" | "sidebar" | "slide_up";
  onClose: () => void;
};

function QuickViewBody({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const addToCart = () => {
    add({
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      image: product.images[0] ?? "",
      size: product.sizes[0] ?? "",
      color: product.colors[0] ?? "",
      qty: 1,
    });
    setAdded(true);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100 sm:aspect-square">
        <img
          src={product.images[0]}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            {product.brand || product.category}
          </p>
          <h2 className="mt-1 text-lg font-bold text-neutral-900">
            {product.title}
          </h2>
          <div className="mt-2">
            <Price price={product.price} compareAt={product.compareAt} />
          </div>
          <AdaptiveUrgencyCue productId={product.id} className="mt-1" />
        </div>
        <p className="line-clamp-4 text-sm text-neutral-600">
          {product.description}
        </p>

        {added ? (
          <div
            className="mt-auto space-y-3 rounded-xl border border-green-200 bg-green-50 p-3"
            role="status"
            aria-live="polite"
          >
            <p className="text-sm font-semibold text-green-800">
              Added to your cart!
            </p>
            <p className="text-xs text-green-700">{product.title}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="btn flex-1 bg-neutral-900 text-white hover:opacity-90"
                onClick={() => {
                  onClose();
                  router.push("/shop/cart");
                }}
              >
                Go to Cart
              </button>
              <button
                type="button"
                className="btn flex-1 border border-neutral-200 bg-white text-neutral-900"
                onClick={onClose}
              >
                Continue shopping
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-auto flex flex-col gap-2 pt-2">
            <button
              type="button"
              className="btn w-full bg-neutral-900 text-white hover:opacity-90"
              onClick={addToCart}
            >
              Add to Cart
            </button>
            <Link
              href={`/shop/product/${product.slug}`}
              onClick={onClose}
              className="btn w-full border border-neutral-200 bg-white text-center text-neutral-900"
            >
              View full details
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Quick-view chrome: modal / sidebar / slide-up.
 * Portaled to body at z-[300] so header/hearts never paint on top.
 */
export function AdaptiveQuickViewOverlay({
  product,
  mode,
  onClose,
}: OverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.setAttribute("data-quick-view-open", "1");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      document.body.removeAttribute("data-quick-view-open");
    };
  }, [onClose]);

  if (!mounted || typeof document === "undefined") return null;

  const overlay = (
    <div
      className="fixed inset-0 z-[9999]"
      data-quick-view={mode}
      role="dialog"
      aria-modal="true"
      aria-label="Product quick view"
    >
      <button
        type="button"
        className="absolute inset-0 z-0 bg-black/60"
        aria-label="Close quick view"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute z-10 flex max-h-[100dvh] flex-col overflow-hidden bg-white shadow-2xl",
          mode === "modal" &&
            "left-1/2 top-1/2 max-h-[90vh] w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl",
          mode === "sidebar" &&
            "right-0 top-0 h-full w-[min(100vw,24rem)] animate-[slideInRight_0.25s_ease-out]",
          mode === "slide_up" &&
            "bottom-0 left-0 right-0 max-h-[88vh] rounded-t-2xl"
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 bg-white px-4 py-3">
          <p className="text-sm font-semibold text-neutral-900">Quick view</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <QuickViewBody product={product} onClose={onClose} />
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}

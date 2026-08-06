"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { Product } from "@/types/product";
import { Price } from "@/components/shared/Price";
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
        </div>
        <p className="line-clamp-4 text-sm text-neutral-600">
          {product.description}
        </p>
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
      </div>
    </div>
  );
}

/**
 * Quick-view chrome: modal (desktop), sidebar slide (desktop), slide-up (mobile).
 */
export function AdaptiveQuickViewOverlay({
  product,
  mode,
  onClose,
}: OverlayProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60]"
      data-quick-view={mode}
      role="dialog"
      aria-modal="true"
      aria-label="Product quick view"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close quick view"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute z-10 overflow-y-auto bg-white shadow-2xl",
          mode === "modal" &&
            "left-1/2 top-1/2 max-h-[90vh] w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl",
          mode === "sidebar" &&
            "right-0 top-0 h-full w-[min(100vw,24rem)] animate-[slideInRight_0.25s_ease-out]",
          mode === "slide_up" &&
            "bottom-0 left-0 right-0 max-h-[88vh] rounded-t-2xl"
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-100 bg-white/95 px-4 py-3 backdrop-blur">
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
        <QuickViewBody product={product} onClose={onClose} />
      </div>
    </div>
  );
}

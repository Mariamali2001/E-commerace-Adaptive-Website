"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { Product } from "@/types/product";
import {
  AdaptiveQuickViewOverlay,
  resolveQuickViewMode,
  type QuickViewMode,
} from "./AdaptiveQuickView";
import { cn } from "@/lib/utils";

/**
 * Wraps any product card with Adaptive Engine quick_view behavior
 * (desktop: modal / sidebar / new tab / none; mobile: slide-up / direct / none).
 */
export function ProductCardWithQuickView({
  product,
  quickViewVariant,
  children,
}: {
  product: Product;
  quickViewVariant: string;
  children: ReactNode;
}) {
  const mode: QuickViewMode = resolveQuickViewMode(quickViewVariant);
  const [open, setOpen] = useState(false);

  const overlayMode =
    mode === "modal" || mode === "sidebar" || mode === "slide_up"
      ? mode
      : null;

  const openNewTab = () => {
    window.open(`/shop/product/${product.slug}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="group relative" data-quick-view-mode={mode}>
      {children}

      {mode === "none" ? null : mode === "new_tab" ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openNewTab();
          }}
          className={cn(
            "absolute bottom-3 left-3 z-10 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-neutral-900 shadow-sm ring-1 ring-neutral-200",
            "opacity-100 transition md:opacity-0 md:group-hover:opacity-100"
          )}
        >
          Open in new tab
        </button>
      ) : mode === "direct" ? (
        <div className="mt-2 px-1">
          <Link
            href={`/shop/product/${product.slug}`}
            className="btn flex w-full items-center justify-center bg-neutral-900 py-2 text-xs text-white hover:opacity-90"
          >
            View product
          </Link>
        </div>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
          className={cn(
            "absolute bottom-3 left-3 z-10 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-neutral-900 shadow-sm ring-1 ring-neutral-200",
            "opacity-100 transition md:opacity-0 md:group-hover:opacity-100"
          )}
        >
          Quick view
        </button>
      )}

      {open && overlayMode && (
        <AdaptiveQuickViewOverlay
          product={product}
          mode={overlayMode}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

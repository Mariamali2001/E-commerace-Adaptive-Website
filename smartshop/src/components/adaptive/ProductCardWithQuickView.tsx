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
 * Wraps any product card with Adaptive Engine quick_view behavior.
 * Only shows a control when the guideline is not "none" / "no_quick_view".
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
    <div
      className="flex h-full flex-col"
      data-quick-view-mode={mode}
    >
      <div className="group relative min-h-0 flex-1" data-product-chrome>
        {children}
      </div>

      {mode === "none" ? null : mode === "new_tab" ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openNewTab();
          }}
          className={cn(
            "mt-2 self-start rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-900 shadow-sm ring-1 ring-neutral-200",
            "hover:bg-neutral-50"
          )}
        >
          Open in new tab
        </button>
      ) : mode === "direct" ? (
        <div className="mt-2">
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
            "mt-2 self-start rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-900 shadow-sm ring-1 ring-neutral-200",
            "hover:bg-neutral-50"
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

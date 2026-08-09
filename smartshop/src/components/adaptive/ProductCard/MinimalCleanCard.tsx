"use client";

import Link from "next/link";
import type { Product } from "@/types/product";
import { Price } from "@/components/shared/Price";
import { AdaptiveReviewSnippet } from "./AdaptiveReviewSnippet";

/** Implements product_card = Minimal Clean */
export function MinimalCleanCard({
  product,
  reviewMode = "none",
  priceMode = "bold_large",
}: {
  product: Product;
  reviewMode?: string;
  priceMode?: string;
}) {
  return (
    <Link
      href={`/shop/product/${product.slug}`}
      className="group flex h-full flex-col"
    >
      <div className="aspect-square w-full shrink-0 overflow-hidden rounded-lg bg-neutral-100">
        <img
          src={product.images[0]}
          loading="lazy"
          decoding="async"
          alt=""
          className="h-full w-full object-cover transition group-hover:opacity-90"
        />
      </div>
      <div className="mt-2 flex flex-1 flex-col space-y-0.5">
        <h3 className="min-h-[1.25rem] text-sm text-neutral-900 line-clamp-1">
          {product.title}
        </h3>
        <AdaptiveReviewSnippet
          rating={product.rating}
          mode={reviewMode}
          compact
        />
        <div className="mt-auto">
          <Price
            price={product.price}
            compareAt={product.compareAt}
            mode={priceMode}
          />
        </div>
      </div>
    </Link>
  );
}

"use client";

import Link from "next/link";
import type { Product } from "@/types/product";
import { Price } from "@/components/shared/Price";
import { AdaptiveReviewSnippet } from "./AdaptiveReviewSnippet";

/** Implements product_card ≈ Image Heavy — large photo, minimal text */
export function ImageHeavyCard({
  product,
  reviewMode,
  priceMode,
}: {
  product: Product;
  reviewMode: string;
  priceMode: string;
}) {
  return (
    <Link
      href={`/shop/product/${product.slug}`}
      className="group flex h-full flex-col"
    >
      <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-2xl bg-neutral-100">
        <img
          src={product.images[0]}
          loading="lazy"
          decoding="async"
          alt=""
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3 pt-10 text-white">
          <h3 className="min-h-[1.25rem] text-sm font-semibold line-clamp-1">
            {product.title}
          </h3>
          <div className="mt-1 text-white [&_span]:text-white">
            <Price
              price={product.price}
              compareAt={product.compareAt}
              mode={priceMode}
            />
          </div>
        </div>
      </div>
      <div className="mt-2 min-h-[1.25rem] px-0.5">
        <AdaptiveReviewSnippet
          rating={product.rating}
          mode={reviewMode}
          compact
        />
      </div>
    </Link>
  );
}

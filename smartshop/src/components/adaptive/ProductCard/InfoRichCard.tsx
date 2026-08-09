"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/types/product";
import { Price } from "@/components/shared/Price";
import { useWishlist, wishlistSelectors } from "@/store/wishlist";
import { AdaptiveReviewSnippet } from "./AdaptiveReviewSnippet";

/** Implements product_card = Info Rich */
export function InfoRichCard({
  product,
  reviewMode = "customer_reviews",
  priceMode = "bold_large",
}: {
  product: Product;
  reviewMode?: string;
  priceMode?: string;
}) {
  const wishlist = useWishlist(wishlistSelectors.list);
  const toggle = useWishlist((s) => s.toggle);
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    setIsInWishlist(wishlist.some((item) => item.id === product.id));
  }, [wishlist, product.id]);

  return (
    <div className="group relative flex h-full flex-col rounded-xl border border-neutral-100 bg-white p-2">
      <Link href={`/shop/product/${product.slug}`} className="block shrink-0">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-neutral-100">
          <img
            src={product.images[0]}
            loading="lazy"
            decoding="async"
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        </div>
      </Link>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          toggle({
            id: product.id,
            slug: product.slug,
            title: product.title,
            price: product.price,
            image: product.images[0],
            rating: product.rating,
          });
        }}
        className="absolute right-4 top-4 z-[1] flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm"
        aria-label="Wishlist"
        data-wishlist-btn=""
      >
        <span className={isInWishlist ? "text-red-500" : "text-neutral-600"}>
          ♥
        </span>
      </button>
      <Link
        href={`/shop/product/${product.slug}`}
        className="mt-3 flex flex-1 flex-col space-y-1.5 px-1"
      >
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          {product.brand || product.category}
        </p>
        <h3 className="min-h-[2.5rem] text-sm font-semibold text-neutral-900 line-clamp-2">
          {product.title}
        </h3>
        <AdaptiveReviewSnippet rating={product.rating} mode={reviewMode} />
        <div className="mt-auto text-sm">
          <Price
            price={product.price}
            compareAt={product.compareAt}
            mode={priceMode}
          />
        </div>
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/types/product";
import { Price } from "@/components/shared/Price";
import { useWishlist, wishlistSelectors } from "@/store/wishlist";
import { AdaptiveReviewSnippet } from "./AdaptiveReviewSnippet";

/** Info + social-proof badges (bestseller / deal). */
export function BadgeHeavyCard({
  product,
  reviewMode,
  priceMode,
}: {
  product: Product;
  reviewMode: string;
  priceMode: string;
}) {
  const wishlist = useWishlist(wishlistSelectors.list);
  const toggle = useWishlist((s) => s.toggle);
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    setIsInWishlist(wishlist.some((item) => item.id === product.id));
  }, [wishlist, product.id]);

  const onSale =
    product.compareAt != null && product.compareAt > product.price;

  return (
    <div className="group relative flex h-full flex-col rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm">
      <Link href={`/shop/product/${product.slug}`} className="block shrink-0">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-neutral-100">
          <img
            src={product.images[0]}
            loading="lazy"
            decoding="async"
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.rating >= 4.4 ? (
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-900">
                Bestseller
              </span>
            ) : null}
            {onSale ? (
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                Deal
              </span>
            ) : null}
          </div>
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
        className="mt-3 flex flex-1 flex-col space-y-1 px-1"
      >
        <h3 className="min-h-[2.5rem] text-sm font-semibold text-neutral-900 line-clamp-2">
          {product.title}
        </h3>
        <AdaptiveReviewSnippet rating={product.rating} mode={reviewMode} />
        <div className="mt-auto">
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

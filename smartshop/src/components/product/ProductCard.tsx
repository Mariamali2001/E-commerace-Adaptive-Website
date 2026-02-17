// components/product/ProductCard.tsx
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { Price } from "../shared/Price";
import { RatingStars } from "../shared/RatingStars";
import { useWishlist, wishlistSelectors } from "@/store/wishlist";

export function ProductCard({ product }: { product: Product }) {
  const wishlist = useWishlist(wishlistSelectors.list);
  const toggle = useWishlist((s) => s.toggle);
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    setIsInWishlist(wishlist.some((item) => item.id === product.id));
  }, [wishlist, product.id]);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle({
      id: product.id,
      slug: product.slug,
      title: product.title,
      price: product.price,
      image: product.images[0],
      rating: product.rating,
    });
  };

  return (
    <div className="group block relative">
      <Link href={`/shop/product/${product.slug}`}>
        <div className="aspect-[3/4] w-full overflow-hidden rounded-xl bg-neutral-100 relative">
          <img
            src={product.images[0]}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        </div>
      </Link>

      {/* Wishlist Heart Button */}
      <button
        onClick={handleWishlistClick}
        className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white flex items-center justify-center transition-all shadow-sm hover:shadow-md"
        aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        {isInWishlist ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 text-red-500"
          >
            <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 text-neutral-700"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
            />
          </svg>
        )}
      </button>

      <Link href={`/shop/product/${product.slug}`}>
        <div className="mt-3 space-y-2">
          <p className="text-xs text-neutral-500 uppercase tracking-wide">
            {product.brand || product.category}
          </p>
          <h3 className="text-sm font-semibold leading-tight min-h-[2.5rem]">
            {product.title}
          </h3>
          <div className="flex items-center gap-2 pt-1">
            <Price price={product.price} compareAt={product.compareAt} />
            <RatingStars rating={product.rating} small />
          </div>
        </div>
      </Link>
    </div>
  );
}

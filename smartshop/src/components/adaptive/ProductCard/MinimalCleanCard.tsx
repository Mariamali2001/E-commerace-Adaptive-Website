"use client";

import Link from "next/link";
import type { Product } from "@/types/product";
import { Price } from "@/components/shared/Price";

/** Implements product_card = Minimal Clean */
export function MinimalCleanCard({ product }: { product: Product }) {
  return (
    <Link href={`/shop/product/${product.slug}`} className="group block">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-neutral-100">
        <img
          src={product.images[0]}
          alt=""
          className="h-full w-full object-cover transition group-hover:opacity-90"
        />
      </div>
      <div className="mt-2 space-y-0.5">
        <h3 className="text-sm text-neutral-900 line-clamp-1">{product.title}</h3>
        <Price price={product.price} />
      </div>
    </Link>
  );
}

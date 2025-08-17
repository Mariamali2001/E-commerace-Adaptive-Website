// components/product/ProductCard.tsx
import Link from "next/link";
import { Product } from "@/types/product";
import { Price } from "../shared/Price";
import { RatingStars } from "../shared/RatingStars";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="aspect-[4/5] w-full overflow-hidden rounded-xl bg-neutral-100">
        <img src={product.images[0]} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
      </div>
      <div className="mt-2 space-y-1">
        <p className="text-sm text-neutral-500">Label</p>
        <p className="text-sm font-medium">{product.title}</p>
        <div className="flex items-center gap-2">
          <Price price={product.price} compareAt={product.compareAt} />
          <RatingStars rating={product.rating} small />
        </div>
      </div>
    </Link>
  );
}

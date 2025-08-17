// components/product/ProductCard.tsx
import { Heart } from "lucide-react";
import Link from "next/link";
import { Price } from "@/components/shared/Price";

export default function ProductCard({ p }: { p: { slug:string; name:string; price:number; oldPrice?:number; image:string; label?:string } }) {
  return (
    <Link href={`/product/${p.slug}`} className="block group">
      <div className="relative rounded-2xl overflow-hidden bg-white shadow-card aspect-square">
        {p.label && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium">{p.label}</span>}
        <button aria-label="Wishlist" className="absolute right-3 top-3 bg-white/90 rounded-full p-2">
          <Heart className="w-4 h-4" />
        </button>
        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
      </div>
      <div className="mt-3">
        <div className="text-sm text-neutral-700 line-clamp-1">{p.name}</div>
        <Price value={p.price} old={p.oldPrice} />
      </div>
    </Link>
  );
}
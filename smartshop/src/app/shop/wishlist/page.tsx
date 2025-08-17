"use client";
import { useWishlist, wishSelectors } from "@/store/wishlist";
import { ProductCard } from "@/app/components/product/ProductCard";

export default function WishlistPage() {
  const list = useWishlist(wishSelectors.list);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-extrabold">Your Wishlist</h1>
      {list.length === 0 ? (
        <p>No items yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {list.map((w) => (
            <ProductCard
              key={w.slug}
              p={{ slug: w.slug, name: w.name, price: w.price, image: w.image }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

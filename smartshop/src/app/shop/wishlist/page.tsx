"use client";
import { useWishlist, wishSelectors } from "@/store/wishlist";
import { ProductCard } from "@/app/components/product/ProductCard";

export default function WishlistPage() {
  const list = useWishlist(wishSelectors.list);

  return (
    <div className="container space-y-6 py-10">
      <h1 className="text-2xl md:text-3xl font-extrabold">Your Wishlist</h1>
      {list.length === 0 ? (
        <p>No items yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {list.map((w) => (
            <ProductCard
              key={w.slug}
              product={{
                id: w.id,
                slug: w.slug,
                title: w.title,
                price: w.price,
                rating: 4.5,
                images: [w.image],
                colors: [],
                sizes: [],
                description: "",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// components/home/TopSelling.tsx
import { Product } from "@/types/product";
import { ProductCard } from "@/components/product/ProductCard";

export function TopSelling({ products }: { products: Product[] }) {
  return (
    <section className="container">
      <h2 className="mb-4 text-xl font-bold">Top Selling</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

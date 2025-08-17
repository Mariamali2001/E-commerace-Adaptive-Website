import { ProductCard } from "@/components/product/ProductCard";
import { products } from "@/data/products";

export default function ShopPage() {
  return (
    <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </section>
  );
}

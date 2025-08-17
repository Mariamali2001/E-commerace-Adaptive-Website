import { products } from "@/data/products";
import ProductCard from "@/components/product/ProductCard";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-extrabold">All Products</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard key={p.slug} p={p} />
        ))}
      </div>
    </div>
  );
}

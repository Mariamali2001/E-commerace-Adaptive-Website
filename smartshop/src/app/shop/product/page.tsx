// app/products/page.tsx
import { products } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";

export default function ProductsPage() {
  return (
    <div className="container space-y-6 py-10">
      <h1 className="text-2xl md:text-3xl font-extrabold">All Products</h1>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}



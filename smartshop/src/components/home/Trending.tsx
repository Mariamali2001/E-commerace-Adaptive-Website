// components/home/Trending.tsx
import Link from "next/link";
import { Product } from "@/types/product";

type TrendingProps = {
  products: Product[];
};

export function Trending({ products }: TrendingProps) {
  return (
    <section className="container mt-10 mb-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">Trending Now</h2>
        <Link href="/shop?sort=rating" className="text-sm hover:underline">
          View All →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.slice(0, 5).map((product) => (
          <Link
            key={product.id}
            href={`/shop/product/${product.slug}`}
            className="group block"
          >
            <div className="aspect-[3/4] overflow-hidden rounded-xl bg-neutral-100 mb-3">
              <img
                src={product.images[0]}
                alt={product.title}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <h3 className="font-medium text-sm leading-tight min-h-[2.5rem] mb-2">
              {product.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className="font-bold">${product.price}</span>
              {product.compareAt && (
                <span className="text-sm text-neutral-400 line-through">
                  ${product.compareAt}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-yellow-400">★</span>
              <span className="text-sm">{product.rating}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

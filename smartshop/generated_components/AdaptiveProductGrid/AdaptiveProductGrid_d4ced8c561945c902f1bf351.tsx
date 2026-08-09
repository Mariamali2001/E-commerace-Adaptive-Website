type Product = {
  id: string | number;
  name: string;
  price: string | number;
  image?: string;
};

type ProductGridProps = {
  products: Product[];
};

export function Columns4ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {products.map((product) => (
        <article
          key={product.id}
          className="min-w-0 overflow-hidden rounded-md border border-gray-200 bg-white"
        >
          <div className="aspect-square overflow-hidden bg-gray-100">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full" aria-hidden="true" />
            )}
          </div>

          <div className="space-y-1 p-2">
            <h3 className="truncate text-sm font-medium text-gray-900">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600">
              {typeof product.price === "number"
                ? `$${product.price.toFixed(2)}`
                : product.price}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
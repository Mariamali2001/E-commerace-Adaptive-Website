type Product = {
  id: string | number;
  name: string;
  price: string;
  image?: string;
};

type ProductGridProps = {
  products: Product[];
};

export function CompactStackedCardsProductGrid({
  products,
}: ProductGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <article
          key={product.id}
          className="overflow-hidden rounded-md border border-gray-200 bg-white"
        >
          <div className="aspect-square bg-gray-100">
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

          <div className="space-y-1 p-2.5">
            <h3 className="truncate text-sm font-medium text-gray-900">
              {product.name}
            </h3>
            <p className="text-sm font-semibold text-gray-900">
              {product.price}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
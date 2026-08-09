type ProductGridProduct = {
  id: string | number;
  name: string;
  price: string;
  imageUrl?: string;
  category?: string;
};

type ProductGridProps = {
  products: ProductGridProduct[];
};

export function 4ColumnsProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {products.map((product) => (
        <article
          key={product.id}
          className="min-w-0 overflow-hidden border border-zinc-200 bg-white"
        >
          <div className="aspect-square bg-zinc-100">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>

          <div className="space-y-1 p-2">
            {product.category ? (
              <p className="truncate text-[10px] uppercase tracking-wide text-zinc-500">
                {product.category}
              </p>
            ) : null}
            <h3 className="truncate text-xs font-medium text-zinc-900">
              {product.name}
            </h3>
            <p className="text-xs text-zinc-700">{product.price}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
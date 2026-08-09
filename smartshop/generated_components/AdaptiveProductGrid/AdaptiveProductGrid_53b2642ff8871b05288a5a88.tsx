type Product = {
  id: string | number;
  name: string;
  price: string;
  imageUrl?: string;
  href?: string;
};

export type ProductGridProps = {
  products: Product[];
  onProductClick?: (product: Product) => void;
};

export function FourColumnsProductGrid({
  products,
  onProductClick,
}: ProductGridProps) {
  return (
    <section aria-label="Products" className="w-full">
      <div className="grid grid-cols-4 gap-3">
        {products.map((product) => {
          const content = (
            <>
              <div className="aspect-square overflow-hidden rounded-md bg-slate-100">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 pt-2">
                <h3 className="truncate text-sm font-medium text-slate-900">
                  {product.name}
                </h3>
                <p className="mt-1 text-sm text-slate-600">{product.price}</p>
              </div>
            </>
          );

          if (product.href) {
            return (
              <a
                key={product.id}
                href={product.href}
                className="group block min-w-0"
              >
                {content}
              </a>
            );
          }

          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onProductClick?.(product)}
              className="group min-w-0 text-left"
            >
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export { FourColumnsProductGrid as "4ColumnsProductGrid" };
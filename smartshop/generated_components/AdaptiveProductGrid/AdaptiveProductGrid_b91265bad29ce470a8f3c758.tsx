type Product = {
  id: string | number;
  name: string;
  price: string | number;
  image?: string;
  href?: string;
};

type ProductGridProps = {
  products: Product[];
};

export function Columns4ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {products.map((product) => {
        const content = (
          <>
            {product.image && (
              <img
                src={product.image}
                alt={product.name}
                className="aspect-square w-full object-cover"
              />
            )}
            <div className="space-y-1 p-3">
              <h3 className="truncate text-sm font-medium text-gray-900">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600">{product.price}</p>
            </div>
          </>
        );

        return product.href ? (
          <a
            key={product.id}
            href={product.href}
            className="block border border-gray-200 bg-white"
          >
            {content}
          </a>
        ) : (
          <article
            key={product.id}
            className="border border-gray-200 bg-white"
          >
            {content}
          </article>
        );
      })}
    </div>
  );
}
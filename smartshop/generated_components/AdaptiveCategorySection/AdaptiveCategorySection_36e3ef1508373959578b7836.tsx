type CategoryItem = {
  name: string;
  href: string;
  image: string;
  description?: string;
  subcategories?: Array<{
    name: string;
    href: string;
  }>;
};

type MegaMenuWithImagesCategorySectionProps = {
  categories: CategoryItem[];
};

export function MegaMenuWithImagesCategorySection({
  categories,
}: MegaMenuWithImagesCategorySectionProps) {
  return (
    <section aria-label="Categories" className="w-full">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((category) => (
          <article
            key={category.href}
            className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            <a href={category.href} className="block">
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              <div className="p-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  {category.name}
                </h2>

                {category.description && (
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                    {category.description}
                  </p>
                )}
              </div>
            </a>

            {category.subcategories && category.subcategories.length > 0 && (
              <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                <ul className="grid gap-2">
                  {category.subcategories.map((subcategory) => (
                    <li key={subcategory.href}>
                      <a
                        href={subcategory.href}
                        className="text-sm text-slate-600 transition-colors hover:text-slate-950"
                      >
                        {subcategory.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
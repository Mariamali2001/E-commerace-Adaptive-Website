type CategoryItem = {
  name: string;
  href: string;
  image: string;
  imageAlt?: string;
  subcategories?: Array<{
    name: string;
    href: string;
  }>;
};

type MegaMenuWithImagesCategorySectionProps = {
  categories: CategoryItem[];
  heading?: string;
  ariaLabel?: string;
};

export function MegaMenuWithImagesCategorySection({
  categories,
  heading,
  ariaLabel = "Categories",
}: MegaMenuWithImagesCategorySectionProps) {
  return (
    <section aria-label={ariaLabel} className="w-full border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {heading ? (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              {heading}
            </h2>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <div
              key={category.href}
              className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
            >
              <a href={category.href} className="block">
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                  <img
                    src={category.image}
                    alt={category.imageAlt ?? category.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-950">
                  {category.name}
                </h3>
              </a>

              {category.subcategories?.length ? (
                <ul className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  {category.subcategories.map((subcategory) => (
                    <li key={subcategory.href}>
                      <a
                        href={subcategory.href}
                        className="text-sm text-slate-600 transition-colors hover:text-slate-950 hover:underline"
                      >
                        {subcategory.name}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
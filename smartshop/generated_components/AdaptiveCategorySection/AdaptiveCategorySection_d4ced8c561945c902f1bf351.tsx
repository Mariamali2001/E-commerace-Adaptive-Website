type CategorySubcategory = {
  name: string;
  href: string;
};

type MegaMenuCategory = {
  name: string;
  href: string;
  image: string;
  imageAlt?: string;
  subcategories: CategorySubcategory[];
};

type CategorySectionProps = {
  categories: MegaMenuCategory[];
};

export function MegaMenuWithImagesCategorySection({
  categories,
}: CategorySectionProps) {
  return (
    <section
      aria-label="Categories"
      className="w-full border-y border-slate-200 bg-white"
    >
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => (
            <div key={category.href} className="min-w-0">
              <a
                href={category.href}
                className="group block overflow-hidden rounded-lg"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                  <img
                    src={category.image}
                    alt={category.imageAlt ?? category.name}
                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
                <h2 className="mt-4 text-base font-semibold text-slate-900 group-hover:text-slate-600">
                  {category.name}
                </h2>
              </a>

              {category.subcategories.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {category.subcategories.map((subcategory) => (
                    <li key={subcategory.href}>
                      <a
                        href={subcategory.href}
                        className="text-sm text-slate-600 hover:text-slate-950 hover:underline"
                      >
                        {subcategory.name}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
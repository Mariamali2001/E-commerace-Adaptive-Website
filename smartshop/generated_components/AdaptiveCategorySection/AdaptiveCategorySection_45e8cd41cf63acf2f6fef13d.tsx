type Category = {
  title: string
  image: string
  href: string
  alt?: string
}

type CategorySectionProps = {
  categories: Category[]
}

export function VisualGridCategorySection({
  categories,
}: CategorySectionProps) {
  return (
    <section aria-label="Categories">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <a
            key={`${category.href}-${category.title}`}
            href={category.href}
            className="group block overflow-hidden rounded-lg border border-neutral-200 bg-white"
          >
            <div className="aspect-square overflow-hidden bg-neutral-100">
              <img
                src={category.image}
                alt={category.alt ?? category.title}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
            </div>
            <div className="px-3 py-3">
              <span className="text-sm font-medium text-neutral-900">
                {category.title}
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
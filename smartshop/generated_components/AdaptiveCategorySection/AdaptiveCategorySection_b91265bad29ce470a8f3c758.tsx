type CategoryItem = {
  label: string;
  href: string;
};

type DropdownMenuCategorySectionProps = {
  categories: CategoryItem[];
  label?: string;
};

export function DropdownMenuCategorySection({
  categories,
  label = "Categories",
}: DropdownMenuCategorySectionProps) {
  return (
    <section aria-label={label}>
      <details className="relative">
        <summary className="cursor-pointer list-none text-sm font-medium text-gray-900 [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            {label}
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </summary>

        <nav className="absolute left-0 z-10 mt-2 min-w-48 border border-gray-200 bg-white py-1 shadow-sm">
          {categories.map((category) => (
            <a
              key={`${category.href}-${category.label}`}
              href={category.href}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              {category.label}
            </a>
          ))}
        </nav>
      </details>
    </section>
  );
}
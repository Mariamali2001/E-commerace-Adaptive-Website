export interface CategorySectionProps {
  categories: string[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export function DropdownMenuCategorySection({
  categories,
  selectedCategory,
  onCategoryChange,
}: CategorySectionProps) {
  return (
    <section className="w-full">
      <select
        aria-label="Category"
        className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        value={selectedCategory ?? ""}
        onChange={(event) => onCategoryChange?.(event.target.value)}
      >
        <option value="" disabled>
          Select a category
        </option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </section>
  );
}
type DropdownMenuCategorySectionProps = {
  categories: string[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
};

export function DropdownMenuCategorySection({
  categories,
  selectedCategory,
  onCategoryChange,
}: DropdownMenuCategorySectionProps) {
  return (
    <section className="w-full">
      <label
        htmlFor="category-select"
        className="mb-2 block text-sm font-medium text-gray-900"
      >
        Category
      </label>

      <select
        id="category-select"
        value={selectedCategory ?? ""}
        onChange={(event) => onCategoryChange?.(event.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
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
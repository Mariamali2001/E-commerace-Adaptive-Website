// components/shop/FilterSidebar.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type FilterOption = {
  value: string;
  label: string;
  count?: number;
};

type FilterSidebarProps = {
  categories: FilterOption[];
  brands: FilterOption[];
  colors: FilterOption[];
  sizes: FilterOption[];
  priceRange: { min: number; max: number };
};

export function FilterSidebar({ categories, brands, colors, sizes, priceRange }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(String(priceRange.min));
  const [maxPrice, setMaxPrice] = useState(String(priceRange.max));
  
  // Initialize from URL params after mount to avoid hydration mismatch
  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "");
    setSelectedBrand(searchParams.get("brand") || "");
    setSelectedColors(searchParams.get("colors")?.split(",").filter(Boolean) || []);
    setSelectedSizes(searchParams.get("sizes")?.split(",").filter(Boolean) || []);
    setMinPrice(searchParams.get("minPrice") || String(priceRange.min));
    setMaxPrice(searchParams.get("maxPrice") || String(priceRange.max));
  }, [searchParams, priceRange.min, priceRange.max]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedBrand) params.set("brand", selectedBrand);
    if (selectedColors.length) params.set("colors", selectedColors.join(","));
    if (selectedSizes.length) params.set("sizes", selectedSizes.join(","));
    if (minPrice !== String(priceRange.min)) params.set("minPrice", minPrice);
    if (maxPrice !== String(priceRange.max)) params.set("maxPrice", maxPrice);
    
    // Track filter application for adaptive UI
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("shop:filter-applied", {
          detail: {
            category: selectedCategory,
            brand: selectedBrand,
            colors: selectedColors,
            sizes: selectedSizes,
            priceRange: { min: minPrice, max: maxPrice },
            timestamp: Date.now(),
          },
        })
      );
    }
    
    router.push(`/shop?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setSelectedColors([]);
    setSelectedSizes([]);
    setMinPrice(String(priceRange.min));
    setMaxPrice(String(priceRange.max));
    
    // Track filter clear for adaptive UI
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("shop:filters-cleared", { detail: { timestamp: Date.now() } }));
    }
    
    router.push("/shop");
  };

  const hasActiveFilters = selectedCategory || selectedBrand || selectedColors.length || selectedSizes.length || 
    minPrice !== String(priceRange.min) || maxPrice !== String(priceRange.max);

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  return (
    <aside className="w-full lg:w-64 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-neutral-500 hover:text-neutral-900 underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm uppercase tracking-wider">Category</h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                value={cat.value}
                checked={selectedCategory === cat.value}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-4 w-4"
              />
              <span className="text-sm flex-1">{cat.label}</span>
              {cat.count !== undefined && (
                <span className="text-xs text-neutral-500">({cat.count})</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm uppercase tracking-wider">Price Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
          <span className="text-neutral-400">-</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {/* Brands */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm uppercase tracking-wider">Brand</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {brands.map((brand) => (
            <label key={brand.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="brand"
                value={brand.value}
                checked={selectedBrand === brand.value}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="h-4 w-4"
              />
              <span className="text-sm flex-1">{brand.label}</span>
              {brand.count !== undefined && (
                <span className="text-xs text-neutral-500">({brand.count})</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm uppercase tracking-wider">Colors</h3>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color.value}
              onClick={() => toggleColor(color.value)}
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-all",
                selectedColors.includes(color.value)
                  ? "border-neutral-900 ring-2 ring-neutral-900 ring-offset-2"
                  : "border-neutral-200 hover:border-neutral-400"
              )}
              style={{ backgroundColor: color.value }}
              title={color.label}
            />
          ))}
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm uppercase tracking-wider">Sizes</h3>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size.value}
              onClick={() => toggleSize(size.value)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                selectedSizes.includes(size.value)
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 hover:border-neutral-400"
              )}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      {/* Apply Button */}
      <button
        onClick={applyFilters}
        className="w-full rounded-xl bg-neutral-900 py-3 text-white font-medium hover:opacity-90 transition"
      >
        Apply Filters
      </button>
    </aside>
  );
}


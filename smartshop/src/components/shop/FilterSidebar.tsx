// components/shop/FilterSidebar.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useExperimentStore } from "@/store/experiment";
import { resolveVariants } from "@/lib/uiAdapter";
import { useAdaptiveAllowed } from "@/lib/experiment/useAdaptiveAllowed";
import {
  resolveFilterPlacement,
  type FilterPlacement,
} from "@/components/adaptive/AdaptiveShopLayout";

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

const PRICE_PRESETS = [
  { label: "Under $50", min: "0", max: "50" },
  { label: "$50–$150", min: "50", max: "150" },
  { label: "$150–$500", min: "150", max: "500" },
  { label: "$500+", min: "500", max: "5000" },
];

export function FilterSidebar({
  categories,
  brands,
  colors,
  sizes,
  priceRange,
}: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, allowed } = useAdaptiveAllowed();
  const uiConfig = useExperimentStore((s) => s.uiConfig);
  const placement: FilterPlacement =
    ready && allowed && uiConfig
      ? resolveFilterPlacement(
          resolveVariants(uiConfig).filters,
          resolveVariants(uiConfig).persistentFilters
        )
      : "sidebar";

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(String(priceRange.min));
  const [maxPrice, setMaxPrice] = useState(String(priceRange.max));
  const [dealFilter, setDealFilter] = useState<"all" | "sale" | "new">("all");

  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "");
    setSelectedBrand(searchParams.get("brand") || "");
    setSelectedColors(
      searchParams.get("colors")?.split(",").filter(Boolean) || []
    );
    setSelectedSizes(
      searchParams.get("sizes")?.split(",").filter(Boolean) || []
    );
    setMinPrice(searchParams.get("minPrice") || String(priceRange.min));
    setMaxPrice(searchParams.get("maxPrice") || String(priceRange.max));
    if (searchParams.get("sale")) setDealFilter("sale");
    else if (searchParams.get("new")) setDealFilter("new");
    else setDealFilter("all");
  }, [searchParams, priceRange.min, priceRange.max]);

  const pushFilters = (overrides?: {
    category?: string;
    brand?: string;
    colors?: string[];
    sizes?: string[];
    minPrice?: string;
    maxPrice?: string;
    deal?: "all" | "sale" | "new";
  }) => {
    const category = overrides?.category ?? selectedCategory;
    const brand = overrides?.brand ?? selectedBrand;
    const cols = overrides?.colors ?? selectedColors;
    const sz = overrides?.sizes ?? selectedSizes;
    const min = overrides?.minPrice ?? minPrice;
    const max = overrides?.maxPrice ?? maxPrice;
    const deal = overrides?.deal ?? dealFilter;

    const params = new URLSearchParams();
    const search = searchParams.get("search");
    if (search) params.set("search", search);

    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (cols.length) params.set("colors", cols.join(","));
    if (sz.length) params.set("sizes", sz.join(","));
    if (min !== String(priceRange.min)) params.set("minPrice", min);
    if (max !== String(priceRange.max)) params.set("maxPrice", max);
    if (deal === "sale") params.set("sale", "1");
    if (deal === "new") params.set("new", "1");

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("shop:filter-applied", {
          detail: {
            category,
            brand,
            colors: cols,
            sizes: sz,
            priceRange: { min, max },
            deal,
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
    setDealFilter("all");
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("shop:filters-cleared", {
          detail: { timestamp: Date.now() },
        })
      );
    }
    router.push("/shop");
  };

  const hasActiveFilters =
    selectedCategory ||
    selectedBrand ||
    selectedColors.length ||
    selectedSizes.length ||
    dealFilter !== "all" ||
    minPrice !== String(priceRange.min) ||
    maxPrice !== String(priceRange.max);

  const chipClass = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-xs font-medium transition whitespace-nowrap",
      active
        ? "border-neutral-900 bg-neutral-900 text-white"
        : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
    );

  /* Top-bar filters: compact horizontal toolbar (professional e-commerce style) */
  if (placement === "top") {
    return (
      <div
        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 shadow-sm"
        data-filters-ui="top"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-bold uppercase tracking-wider text-neutral-500">
            Filters
          </span>
          {(
            [
              { id: "all", label: "All" },
              { id: "sale", label: "On sale" },
              { id: "new", label: "New" },
            ] as const
          ).map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => {
                setDealFilter(chip.id);
                pushFilters({ deal: chip.id });
              }}
              className={chipClass(dealFilter === chip.id)}
            >
              {chip.label}
            </button>
          ))}
          <span className="mx-1 hidden h-5 w-px bg-neutral-200 sm:block" />
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              pushFilters({ category: e.target.value });
            }}
            className="adaptive-field rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs"
          >
            {categories.map((cat) => (
              <option key={cat.value || "all-cat"} value={cat.value}>
                {cat.label}
                {cat.count != null ? ` (${cat.count})` : ""}
              </option>
            ))}
          </select>
          <select
            value={selectedBrand}
            onChange={(e) => {
              setSelectedBrand(e.target.value);
              pushFilters({ brand: e.target.value });
            }}
            className="adaptive-field rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs"
          >
            {brands.map((brand) => (
              <option key={brand.value || "all-brand"} value={brand.value}>
                {brand.label}
                {brand.count != null ? ` (${brand.count})` : ""}
              </option>
            ))}
          </select>
          {PRICE_PRESETS.map((preset) => {
            const active = minPrice === preset.min && maxPrice === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setMinPrice(preset.min);
                  setMaxPrice(preset.max);
                  pushFilters({ minPrice: preset.min, maxPrice: preset.max });
                }}
                className={chipClass(active)}
              >
                {preset.label}
              </button>
            );
          })}
          <div className="flex items-center gap-1.5">
            {colors.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => {
                  const next = selectedColors.includes(color.value)
                    ? selectedColors.filter((c) => c !== color.value)
                    : [...selectedColors, color.value];
                  setSelectedColors(next);
                  pushFilters({ colors: next });
                }}
                className={cn(
                  "h-6 w-6 rounded-full border transition",
                  selectedColors.includes(color.value)
                    ? "border-neutral-900 ring-2 ring-neutral-900 ring-offset-1"
                    : "border-neutral-300"
                )}
                style={{ backgroundColor: color.value }}
                title={color.label}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {sizes.map((size) => (
              <button
                key={size.value}
                type="button"
                onClick={() => {
                  const next = selectedSizes.includes(size.value)
                    ? selectedSizes.filter((s) => s !== size.value)
                    : [...selectedSizes, size.value];
                  setSelectedSizes(next);
                  pushFilters({ sizes: next });
                }}
                className={chipClass(selectedSizes.includes(size.value))}
              >
                {size.label}
              </button>
            ))}
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto text-xs font-medium text-neutral-500 underline hover:text-neutral-900"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "w-full shrink-0 space-y-6",
        placement === "sidebar"
          ? "lg:sticky lg:top-20 lg:w-64 lg:self-start"
          : "lg:static lg:w-full"
      )}
      data-filters-ui={placement}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-neutral-500 underline hover:text-neutral-900"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Quick chips — All / Sale / New */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider">
          Quick
        </h3>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "all", label: "All" },
              { id: "sale", label: "On sale" },
              { id: "new", label: "New" },
            ] as const
          ).map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => {
                setDealFilter(chip.id);
                pushFilters({ deal: chip.id });
              }}
              className={chipClass(dealFilter === chip.id)}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider">
          Category
        </h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label
              key={cat.value || "all-cat"}
              className="flex cursor-pointer items-center gap-2"
            >
              <input
                type="radio"
                name="category"
                value={cat.value}
                checked={selectedCategory === cat.value}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  pushFilters({ category: e.target.value });
                }}
                className="h-4 w-4"
              />
              <span className="flex-1 text-sm">{cat.label}</span>
              {cat.count !== undefined && (
                <span className="text-xs text-neutral-500">({cat.count})</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider">
          Price Range
        </h3>
        <div className="flex flex-wrap gap-2">
          {PRICE_PRESETS.map((preset) => {
            const active = minPrice === preset.min && maxPrice === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setMinPrice(preset.min);
                  setMaxPrice(preset.max);
                  pushFilters({ minPrice: preset.min, maxPrice: preset.max });
                }}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition",
                  active
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
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
        <h3 className="text-sm font-semibold uppercase tracking-wider">Brand</h3>
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {brands.map((brand) => (
            <label
              key={brand.value || "all-brand"}
              className="flex cursor-pointer items-center gap-2"
            >
              <input
                type="radio"
                name="brand"
                value={brand.value}
                checked={selectedBrand === brand.value}
                onChange={(e) => {
                  setSelectedBrand(e.target.value);
                  pushFilters({ brand: e.target.value });
                }}
                className="h-4 w-4"
              />
              <span className="flex-1 text-sm">{brand.label}</span>
              {brand.count !== undefined && (
                <span className="text-xs text-neutral-500">({brand.count})</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider">
          Colors
        </h3>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => {
                const next = selectedColors.includes(color.value)
                  ? selectedColors.filter((c) => c !== color.value)
                  : [...selectedColors, color.value];
                setSelectedColors(next);
                pushFilters({ colors: next });
              }}
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
        <h3 className="text-sm font-semibold uppercase tracking-wider">Sizes</h3>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => (
            <button
              key={size.value}
              type="button"
              onClick={() => {
                const next = selectedSizes.includes(size.value)
                  ? selectedSizes.filter((s) => s !== size.value)
                  : [...selectedSizes, size.value];
                setSelectedSizes(next);
                pushFilters({ sizes: next });
              }}
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

      <button
        type="button"
        onClick={() => pushFilters()}
        className="w-full rounded-xl bg-neutral-900 py-3 font-medium text-white transition hover:opacity-90"
      >
        Apply Filters
      </button>
    </aside>
  );
}

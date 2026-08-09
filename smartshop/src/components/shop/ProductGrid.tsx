// components/shop/ProductGrid.tsx
"use client";
import { useState } from "react";
import { Product } from "@/types/product";
import { AdaptiveProductCard } from "@/components/adaptive/AdaptiveProductCard";
import { cn } from "@/lib/utils";
import { useExperimentStore } from "@/store/experiment";
import { gridClassFromVariant, resolveVariants } from "@/lib/uiAdapter";
import { useAdaptiveAllowed } from "@/lib/experiment/useAdaptiveAllowed";

type SortOption = "price-asc" | "price-desc" | "newest" | "popular" | "rating";

type ProductGridProps = {
  products: Product[];
  /** Count after filters/search (what the grid is showing) */
  totalCount: number;
  /** Full catalog size — used only when unfiltered */
  catalogCount?: number;
};

export function ProductGrid({
  products: initialProducts,
  totalCount,
  catalogCount,
}: ProductGridProps) {
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { ready, allowed } = useAdaptiveAllowed();
  const uiConfig = useExperimentStore((s) => s.uiConfig);
  const adaptiveGrid =
    ready && allowed && uiConfig && viewMode === "grid"
      ? gridClassFromVariant(resolveVariants(uiConfig).grid)
      : null;

  const sortProducts = (products: Product[], sortOption: SortOption): Product[] => {
    const sorted = [...products];
    
    switch (sortOption) {
      case "price-asc":
        return sorted.sort((a, b) => a.price - b.price);
      case "price-desc":
        return sorted.sort((a, b) => b.price - a.price);
      case "rating":
        return sorted.sort((a, b) => b.rating - a.rating);
      case "newest":
        // Assuming products with higher IDs are newer
        return sorted.sort((a, b) => b.id.localeCompare(a.id));
      case "popular":
      default:
        return sorted.sort((a, b) => b.rating - a.rating);
    }
  };

  const sortedProducts = sortProducts(initialProducts, sortBy);

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    
    // Track sort preference for adaptive UI
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("shop:sort-changed", {
          detail: { sortBy: newSort, timestamp: Date.now() },
        })
      );
    }
  };

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    
    // Track view preference for adaptive UI
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("shop:view-mode-changed", {
          detail: { viewMode: mode, timestamp: Date.now() },
        })
      );
    }
  };

  return (
    <div className="flex-1 space-y-4">
      {/* Header with count, sort, and view options */}
      <div className="flex flex-col items-start justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <p className="text-sm text-neutral-600">
          {catalogCount != null && catalogCount !== totalCount ? (
            <>
              Showing <span className="font-semibold">{sortedProducts.length}</span>{" "}
              matching product{sortedProducts.length === 1 ? "" : "s"}
              <span className="text-neutral-400">
                {" "}
                (of {catalogCount} in shop)
              </span>
            </>
          ) : (
            <>
              Showing <span className="font-semibold">{sortedProducts.length}</span>{" "}
              product{sortedProducts.length === 1 ? "" : "s"}
            </>
          )}
        </p>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <button
              type="button"
              onClick={() => handleViewModeChange("grid")}
              className={cn(
                "rounded p-2 transition-colors",
                viewMode === "grid" ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
              )}
              aria-label="Grid view"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange("list")}
              className={cn(
                "rounded p-2 transition-colors",
                viewMode === "list" ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
              )}
              aria-label="List view"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {/* Products Grid/List */}
      {sortedProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-neutral-500 text-lg">No products found</p>
          <p className="text-neutral-400 text-sm mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === "list"
              ? "space-y-4"
              : adaptiveGrid ??
                  "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-3"
          )}
        >
          {sortedProducts.map((product) => (
            <div
              key={product.id}
              className={cn(
                viewMode === "list" &&
                  "rounded-xl border border-neutral-100 bg-white p-3 [&_.group]:relative"
              )}
            >
              <AdaptiveProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// components/home/TopSelling.tsx
"use client";

import { useMemo, type CSSProperties } from "react";
import { Product } from "@/types/product";
import { AdaptiveProductCard } from "@/components/adaptive/AdaptiveProductCard";
import { useExperimentStore } from "@/store/experiment";
import { gridClassFromVariant, resolveVariants } from "@/lib/uiAdapter";
import { useAdaptiveAllowed } from "@/lib/experiment/useAdaptiveAllowed";
import { cn } from "@/lib/utils";

function pickRecommended(
  products: Product[],
  recommendation: string,
  count: number
): { title: string; items: Product[] } {
  const id = recommendation.toLowerCase();
  if (id.includes("deal") || id.includes("sale")) {
    const deals = products.filter(
      (p) => p.compareAt != null && p.compareAt > p.price
    );
    return {
      title: "Deals for you",
      items: (deals.length ? deals : products).slice(0, count),
    };
  }
  if (id.includes("new")) {
    const newest = [...products].sort((a, b) => b.id.localeCompare(a.id));
    return { title: "New arrivals", items: newest.slice(0, count) };
  }
  if (id.includes("trend") || id.includes("popular")) {
    const trending = [...products].sort((a, b) => b.rating - a.rating);
    return { title: "Trending now", items: trending.slice(0, count) };
  }
  if (id.includes("categor")) {
    const byCat = [...products].sort((a, b) =>
      (a.category ?? "").localeCompare(b.category ?? "")
    );
    return { title: "Shop by category picks", items: byCat.slice(0, count) };
  }
  return { title: "Top Selling", items: products.slice(0, count) };
}

export function TopSelling({ products }: { products: Product[] }) {
  const { ready, allowed } = useAdaptiveAllowed();
  const uiConfig = useExperimentStore((s) => s.uiConfig);
  const adapted = ready && allowed && uiConfig;
  const variants = adapted ? resolveVariants(uiConfig) : null;
  const gridClass = variants
    ? gridClassFromVariant(variants.grid)
    : "grid grid-cols-2 gap-4 md:grid-cols-4";

  const strength = variants?.nudges.recommendation_strength ?? 0;
  const count = Math.max(4, Math.min(12, 8 + Math.round(strength * 2)));

  const { title, items } = useMemo(
    () =>
      adapted && variants
        ? pickRecommended(products, variants.recommendation, count)
        : { title: "Top Selling", items: products.slice(0, 8) },
    [adapted, variants, products, count]
  );

  return (
    <section
      id="new-arrivals"
      className="container"
      data-recommendation={variants?.recommendation}
      style={
        strength !== 0
          ? ({
              ["--adaptive-recommendation"]: String(strength),
            } as CSSProperties)
          : undefined
      }
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="text-xl font-bold">{title}</h2>
        {strength > 0 && (
          <p className="text-xs font-medium text-neutral-500">
            Personalized picks
          </p>
        )}
      </div>
      <div className={cn(gridClass)}>
        {items.map((p) => (
          <AdaptiveProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

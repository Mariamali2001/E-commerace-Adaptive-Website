// components/home/TopSelling.tsx
"use client";

import { Product } from "@/types/product";
import { AdaptiveProductCard } from "@/components/adaptive/AdaptiveProductCard";
import { useExperimentStore } from "@/store/experiment";
import { gridClassFromVariant, resolveVariants } from "@/lib/uiAdapter";
import { useAdaptiveAllowed } from "@/lib/experiment/useAdaptiveAllowed";
import { cn } from "@/lib/utils";

export function TopSelling({ products }: { products: Product[] }) {
  const { ready, allowed } = useAdaptiveAllowed();
  const uiConfig = useExperimentStore((s) => s.uiConfig);
  const gridClass =
    ready && allowed && uiConfig
      ? gridClassFromVariant(resolveVariants(uiConfig).grid)
      : "grid grid-cols-2 gap-4 md:grid-cols-4";

  return (
    <section id="new-arrivals" className="container">
      <h2 className="mb-4 text-xl font-bold">Top Selling</h2>
      <div className={cn(gridClass)}>
        {products.map((p) => (
          <AdaptiveProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

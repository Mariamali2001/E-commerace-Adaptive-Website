"use client";

import type { Product } from "@/types/product";
import { useExperimentStore } from "@/store/experiment";
import { resolveVariants } from "@/lib/uiAdapter";
import { useAdaptiveAllowed } from "@/lib/experiment/useAdaptiveAllowed";
import { InfoRichCard } from "./ProductCard/InfoRichCard";
import { MinimalCleanCard } from "./ProductCard/MinimalCleanCard";
import { ProductCard } from "@/components/product/ProductCard";

export function AdaptiveProductCard({ product }: { product: Product }) {
  const { ready, allowed } = useAdaptiveAllowed();
  const uiConfig = useExperimentStore((s) => s.uiConfig);

  if (!ready || !allowed || !uiConfig) {
    return <ProductCard product={product} />;
  }

  const variants = resolveVariants(uiConfig);
  if (
    variants.productCard.includes("minimal") ||
    variants.productCard.includes("clean")
  ) {
    return <MinimalCleanCard product={product} />;
  }
  return <InfoRichCard product={product} />;
}

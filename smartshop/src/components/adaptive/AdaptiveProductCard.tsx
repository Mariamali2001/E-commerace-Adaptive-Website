"use client";

import type { Product } from "@/types/product";
import { useExperimentStore } from "@/store/experiment";
import { resolveVariants } from "@/lib/uiAdapter";
import { useAdaptiveAllowed } from "@/lib/experiment/useAdaptiveAllowed";
import { InfoRichCard } from "./ProductCard/InfoRichCard";
import { MinimalCleanCard } from "./ProductCard/MinimalCleanCard";
import { ImageHeavyCard } from "./ProductCard/ImageHeavyCard";
import { BadgeHeavyCard } from "./ProductCard/BadgeHeavyCard";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductCardWithQuickView } from "./ProductCardWithQuickView";
import { AdaptiveUrgencyCue } from "./AdaptiveUrgencyCue";

export function AdaptiveProductCard({ product }: { product: Product }) {
  const { ready, allowed } = useAdaptiveAllowed();
  const uiConfig = useExperimentStore((s) => s.uiConfig);

  if (!ready || !allowed || !uiConfig) {
    return <ProductCard product={product} />;
  }

  const variants = resolveVariants(uiConfig);
  const card = variants.productCard.toLowerCase();
  const socialProofMode = variants.socialProofDisplay;
  const priceMode = variants.priceDisplay;

  let body;
  if (card.includes("minimal") || card.includes("clean")) {
    body = (
      <MinimalCleanCard
        product={product}
        reviewMode={socialProofMode}
        priceMode={priceMode}
      />
    );
  } else if (card.includes("image")) {
    body = (
      <ImageHeavyCard
        product={product}
        reviewMode={socialProofMode}
        priceMode={priceMode}
      />
    );
  } else if (card.includes("badge") || card.includes("social")) {
    body = (
      <BadgeHeavyCard
        product={product}
        reviewMode={socialProofMode}
        priceMode={priceMode}
      />
    );
  } else {
    body = (
      <InfoRichCard
        product={product}
        reviewMode={socialProofMode}
        priceMode={priceMode}
      />
    );
  }

  return (
    <ProductCardWithQuickView
      product={product}
      quickViewVariant={variants.quickView}
    >
      <div>
        {body}
        <AdaptiveUrgencyCue
          productId={product.id}
          compact
          className="mt-1 px-1"
        />
      </div>
    </ProductCardWithQuickView>
  );
}

"use client";

import { ReviewsList } from "@/components/product/Reviews";
import type { Review } from "@/types/review";
import { useExperimentStore } from "@/store/experiment";
import { resolveVariants } from "@/lib/uiAdapter";
import { useAdaptiveAllowed } from "@/lib/experiment/useAdaptiveAllowed";

/**
 * PDP reviews: layout from `review_display`, proof type from `social_proof_display`.
 */
export function AdaptiveReviews({
  reviews,
  productSlug,
}: {
  reviews: Review[];
  productSlug: string;
}) {
  const { ready, allowed } = useAdaptiveAllowed();
  const uiConfig = useExperimentStore((s) => s.uiConfig);

  const adapted = ready && allowed && uiConfig;
  const variants = adapted ? resolveVariants(uiConfig) : null;

  return (
    <ReviewsList
      reviews={reviews}
      productSlug={productSlug}
      displayMode={variants?.reviewDisplay ?? "all_paginated"}
      socialProofMode={variants?.socialProofDisplay ?? "customer_reviews"}
    />
  );
}

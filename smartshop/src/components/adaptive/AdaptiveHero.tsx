"use client";

import { MediumSplitHero } from "./Hero/MediumSplitHero";
import { SmallStripHero } from "./Hero/SmallStripHero";
import { useExperimentStore } from "@/store/experiment";
import { resolveVariants } from "@/lib/uiAdapter";
import { useAdaptiveAllowed } from "@/lib/experiment/useAdaptiveAllowed";

export function AdaptiveHero() {
  const { ready, allowed } = useAdaptiveAllowed();
  const uiConfig = useExperimentStore((s) => s.uiConfig);

  if (!ready || !allowed || !uiConfig) {
    return <MediumSplitHero />;
  }

  const variants = resolveVariants(uiConfig);
  if (
    variants.heroBanner.includes("small") ||
    variants.heroBanner.includes("strip")
  ) {
    return <SmallStripHero />;
  }
  return <MediumSplitHero />;
}

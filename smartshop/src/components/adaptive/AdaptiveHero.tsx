"use client";

import { MediumSplitHero } from "./Hero/MediumSplitHero";
import { SmallStripHero } from "./Hero/SmallStripHero";
import { LargeFullHero } from "./Hero/LargeFullHero";
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
  const hero = variants.heroBanner.toLowerCase();

  // None — skip promo, go straight to products
  if (hero.includes("none") || hero.includes("no_promotional") || hero === "no") {
    return null;
  }
  if (hero.includes("small") || hero.includes("strip")) {
    return <SmallStripHero />;
  }
  if (hero.includes("large") || hero.includes("full")) {
    return <LargeFullHero />;
  }
  return <MediumSplitHero />;
}

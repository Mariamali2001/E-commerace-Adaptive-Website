import type { SupportedComponent } from "./LLMTypes";

/** Filesystem / export names for generated Adaptive* components */
export const ADAPTIVE_COMPONENT_NAMES: Record<SupportedComponent, string> = {
  Navbar: "AdaptiveNavbar",
  HeroBanner: "AdaptiveHeroBanner",
  SearchBar: "AdaptiveSearchBar",
  CategorySection: "AdaptiveCategorySection",
  ProductGrid: "AdaptiveProductGrid",
  ProductCard: "AdaptiveProductCard",
  FilterPanel: "AdaptiveFilterPanel",
  RecommendationSection: "AdaptiveRecommendationSection",
  ReviewSection: "AdaptiveReviewSection",
  Checkout: "AdaptiveCheckout",
  Footer: "AdaptiveFooter",
};

export function adaptiveFileName(
  componentName: SupportedComponent,
  configurationHash: string
): string {
  const base = ADAPTIVE_COMPONENT_NAMES[componentName];
  return `${base}_${configurationHash}.tsx`;
}

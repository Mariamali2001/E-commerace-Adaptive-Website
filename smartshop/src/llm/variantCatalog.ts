import type { SupportedComponent } from "./LLMTypes";

/**
 * Hand-seeded React module registry.
 * When a variant exists here, LLMService treats it as a cache hit ($0)
 * and records it in generated_components/ for the configuration hash.
 * Runtime modules live under src/components/adaptive/.
 */
const CATALOG: Partial<
  Record<SupportedComponent, Record<string, string>>
> = {
  HeroBanner: {
    medium_split: "@/components/adaptive/Hero/MediumSplitHero",
    small_strip: "@/components/adaptive/Hero/SmallStripHero",
    default: "@/components/adaptive/Hero/MediumSplitHero",
  },
  ProductCard: {
    info_rich: "@/components/adaptive/ProductCard/InfoRichCard",
    minimal_clean: "@/components/adaptive/ProductCard/MinimalCleanCard",
    default: "@/components/adaptive/ProductCard/InfoRichCard",
  },
  Navbar: {
    top_bar: "@/components/adaptive/Navbar/TopBarNav",
    mega_menu: "@/components/adaptive/Navbar/MegaMenuNav",
    combination_of_top_bar_and_dropdowns:
      "@/components/adaptive/Navbar/CombinationNav",
    default: "@/components/adaptive/Navbar/MegaMenuNav",
  },
};

export function getCatalogModulePath(
  componentName: SupportedComponent,
  variantId: string
): string | null {
  const family = CATALOG[componentName];
  if (!family) return null;
  return family[variantId] ?? family.default ?? null;
}

/** Marker source so LLMService treats hand variants as cache hits. */
export function getCatalogSource(
  componentName: SupportedComponent,
  variantId: string
): string | null {
  const mod = getCatalogModulePath(componentName, variantId);
  if (!mod) return null;
  return `/* Hand-seeded catalog variant (${componentName}/${variantId}). Runtime: import from ${mod}. LLM skipped. */\nexport {};\n`;
}

export function listCatalogVariants(): Array<{
  componentName: string;
  variantId: string;
  modulePath: string;
}> {
  const out: Array<{
    componentName: string;
    variantId: string;
    modulePath: string;
  }> = [];
  for (const [componentName, variants] of Object.entries(CATALOG)) {
    for (const [variantId, modulePath] of Object.entries(variants)) {
      if (variantId === "default") continue;
      out.push({ componentName, variantId, modulePath });
    }
  }
  return out;
}

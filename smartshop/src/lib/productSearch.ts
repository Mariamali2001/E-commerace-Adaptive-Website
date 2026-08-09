import type { Product } from "@/types/product";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Normalize text so hyphenated slugs/titles tokenize cleanly. */
function normalizeHaystack(text: string): string {
  return text.toLowerCase().replace(/[-_/]+/g, " ");
}

/**
 * Whole-word search on title / brand / category / slug.
 * Avoids false hits like "rings" ⊂ "earrings" or "fitness rings" in descriptions.
 */
export function productMatchesSearch(
  product: Product,
  rawQuery: string
): boolean {
  const terms = rawQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (!terms.length) return true;

  const primary = normalizeHaystack(
    [product.title, product.brand, product.category, product.slug]
      .filter(Boolean)
      .join(" ")
  );

  return terms.every((term) => {
    const re = new RegExp(`\\b${escapeRegex(term)}\\b`, "i");
    if (re.test(primary)) return true;
    // light plural/singular: rings ↔ ring
    if (term.endsWith("s") && term.length > 3) {
      const singular = term.slice(0, -1);
      return new RegExp(`\\b${escapeRegex(singular)}\\b`, "i").test(primary);
    }
    if (!term.endsWith("s")) {
      return new RegExp(`\\b${escapeRegex(term)}s\\b`, "i").test(primary);
    }
    return false;
  });
}

/** Mongo-safe word-boundary regex source for a single search term. */
export function searchTermToRegexSource(rawQuery: string): string {
  const terms = rawQuery
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(escapeRegex);
  if (!terms.length) return "";
  // Match any term as a whole word (OR); multi-word AND is applied in JS filter when needed
  return terms.map((t) => `\\b${t}\\b`).join("|");
}

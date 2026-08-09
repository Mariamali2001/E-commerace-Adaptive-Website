// components/shared/Price.tsx
import { cn } from "@/lib/utils";

/**
 * Adaptive price display modes from guidelines:
 * - With Savings Highlighted → compare + prominent discount badge
 * - Strike-through Original → compare struck through
 * - Bold / Large → larger sale price
 * - Minimal / Simple / Price only → sale price alone
 * - Comparison → show both prices
 */
export function Price({
  price,
  compareAt,
  mode,
  className,
}: {
  price: number;
  compareAt?: number;
  /** Guideline price_display variant id / label */
  mode?: string;
  className?: string;
}) {
  const id = (mode ?? "").toLowerCase();
  const onSale =
    typeof compareAt === "number" && compareAt > price && compareAt > 0;
  const discountPct = onSale
    ? Math.round(((compareAt - price) / compareAt) * 100)
    : 0;

  const minimal =
    id.includes("minimal") ||
    id.includes("simple") ||
    id.includes("price_only") ||
    id.includes("sale_only");
  const showStrike =
    onSale &&
    !minimal &&
    (id.includes("strike") ||
      id.includes("comparison") ||
      id.includes("savings") ||
      id.includes("discount") ||
      id.includes("highlighted") ||
      id.includes("bold") ||
      id.includes("large") ||
      !id);
  const emphasizeSavings =
    onSale &&
    (id.includes("savings") ||
      id.includes("discount") ||
      id.includes("highlighted"));
  const bold =
    id.includes("bold") || id.includes("large") || emphasizeSavings;

  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline gap-2",
        bold && "text-base",
        className
      )}
      data-price-mode={mode || "default"}
    >
      <span className={cn("font-extrabold", bold && "text-lg")}>${price}</span>
      {showStrike && <s className="text-neutral-400">${compareAt}</s>}
      {emphasizeSavings && discountPct > 0 && (
        <span className="rounded-md bg-red-500/10 px-1.5 py-0.5 text-xs font-bold text-red-600">
          Save {discountPct}%
        </span>
      )}
      {!emphasizeSavings && showStrike && discountPct > 0 && (
        <span className="text-xs text-red-500">-{discountPct}%</span>
      )}
    </div>
  );
}

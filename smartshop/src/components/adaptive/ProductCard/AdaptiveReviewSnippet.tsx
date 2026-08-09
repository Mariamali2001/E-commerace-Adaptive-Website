"use client";

import type { ReactNode } from "react";
import { RatingStars } from "@/components/shared/RatingStars";

/**
 * Compact social proof on product cards.
 * Driven by `social_proof_display` (not PDP `review_display` layout).
 * Intensity is scaled by html[data-social-proof-influence] CSS.
 */
export function AdaptiveReviewSnippet({
  rating,
  mode,
  compact = false,
}: {
  rating: number;
  mode: string;
  compact?: boolean;
}) {
  const id = mode.toLowerCase();

  if (id.includes("none") || id.includes("hide") || id.includes("off")) {
    return null;
  }

  const wrap = (node: ReactNode) => (
    <div className="adaptive-social-proof" data-social-proof={mode}>
      {node}
    </div>
  );

  // Bestseller Badges
  if (id.includes("badge") || id.includes("bestseller") || id.includes("popular")) {
    return wrap(
      <div className="flex flex-wrap items-center gap-1.5">
        {rating >= 4.2 ? (
          <span
            className={[
              "rounded-full bg-amber-400 font-bold uppercase text-neutral-900",
              compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]",
            ].join(" ")}
          >
            Bestseller
          </span>
        ) : (
          <span
            className={[
              "rounded-full bg-neutral-200 font-semibold text-neutral-700",
              compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]",
            ].join(" ")}
          >
            Popular
          </span>
        )}
        <RatingStars rating={rating} small={compact} />
      </div>
    );
  }

  // User Photos — cue that customer photos are available
  if (id.includes("photo") || id.includes("image") || id.includes("user_photo")) {
    return wrap(
      <div className="flex items-center gap-1.5">
        <RatingStars rating={rating} small={compact} />
        <span
          className={[
            "text-neutral-500",
            compact ? "text-[10px]" : "text-xs",
          ].join(" ")}
        >
          Photos
        </span>
      </div>
    );
  }

  // Ratings Only — stars, no review-count fluff
  if (
    id.includes("ratings_only") ||
    (id.includes("rating") && !id.includes("review") && !id.includes("customer"))
  ) {
    return wrap(<RatingStars rating={rating} small={compact} />);
  }

  // Customer Reviews (default) — stars + approximate review count
  const approx = Math.max(3, Math.round(rating * 17));
  return wrap(
    <div className="flex items-center gap-1.5">
      <RatingStars rating={rating} small={compact} />
      <span
        className={[
          "text-neutral-500",
          compact ? "text-[10px]" : "text-xs",
        ].join(" ")}
      >
        ({approx})
      </span>
    </div>
  );
}

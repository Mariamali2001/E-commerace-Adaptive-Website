// components/product/Reviews.tsx
"use client";
import { useState, useMemo, useEffect } from "react";
import { Review } from "@/types/review";
import { RatingStars } from "../shared/RatingStars";
import { WriteReviewModal } from "./WriteReviewModal";
import { cn } from "@/lib/utils";

const INITIAL_DISPLAY_COUNT = 4;
const LOAD_MORE_INCREMENT = 4;

function parseDate(dateString: string): Date {
  return new Date(dateString);
}

function formatDate(dateString: string): string {
  if (dateString.includes(",") && !dateString.includes("T")) {
    return dateString;
  }
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

function sortReviewsByLatest(reviews: Review[]): Review[] {
  return [...reviews].sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    return dateB.getTime() - dateA.getTime();
  });
}

function ratingBreakdown(reviews: Review[]): number[] {
  const counts = [0, 0, 0, 0, 0];
  for (const r of reviews) {
    const idx = Math.min(5, Math.max(1, Math.round(r.rating))) - 1;
    counts[idx] += 1;
  }
  return counts;
}

function averageRating(reviews: Review[]): number {
  if (!reviews.length) return 0;
  const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function resolveReviewMode(mode?: string) {
  const id = (mode ?? "all_paginated").toLowerCase();
  if (id.includes("summary")) return "summary_only" as const;
  if (id.includes("ratings_bar") || id.includes("bar_only")) {
    return "ratings_bar_only" as const;
  }
  if (id.includes("recent")) return "recent" as const;
  if (id.includes("collapsible")) return "collapsible" as const;
  return "all_paginated" as const;
}

function resolveSocialProofMode(mode?: string) {
  const id = (mode ?? "customer_reviews").toLowerCase();
  if (id.includes("badge") || id.includes("bestseller") || id.includes("popular")) {
    return "badges" as const;
  }
  if (id.includes("photo") || id.includes("image")) {
    return "user_photos" as const;
  }
  if (
    id.includes("ratings_only") ||
    (id.includes("rating") && !id.includes("review") && !id.includes("customer"))
  ) {
    return "ratings_only" as const;
  }
  return "customer_reviews" as const;
}

export function ReviewsList({
  reviews: initialReviews,
  productSlug,
  displayMode,
  socialProofMode,
}: {
  reviews: Review[];
  productSlug: string;
  /** From Adaptive Engine review_display token (layout) */
  displayMode?: string;
  /** From Adaptive Engine social_proof_display token (proof type) */
  socialProofMode?: string;
}) {
  const mode = resolveReviewMode(displayMode);
  const proof = resolveSocialProofMode(socialProofMode);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [visibleCount, setVisibleCount] = useState(
    mode === "recent" ? 5 : INITIAL_DISPLAY_COUNT
  );
  const [sortByLatest, setSortByLatest] = useState(mode === "recent");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [expanded, setExpanded] = useState(mode !== "collapsible");

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  useEffect(() => {
    if (mode === "recent") {
      setSortByLatest(true);
      setVisibleCount(5);
    } else if (mode === "all_paginated") {
      setVisibleCount(INITIAL_DISPLAY_COUNT);
    }
    setExpanded(mode !== "collapsible");
  }, [mode]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/products/${productSlug}/reviews`);
      if (response.ok) {
        const payload = await response.json();
        setReviews(payload.data || []);
        setVisibleCount(INITIAL_DISPLAY_COUNT);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  const sortedReviews = useMemo(() => {
    let list = sortByLatest ? sortReviewsByLatest(reviews) : [...reviews];
    // User Photos: prioritize reviews that include customer images
    if (proof === "user_photos") {
      list = [...list].sort((a, b) => {
        const ai = a.images?.length ? 1 : 0;
        const bi = b.images?.length ? 1 : 0;
        return bi - ai;
      });
    }
    return list;
  }, [reviews, sortByLatest, proof]);

  const breakdown = useMemo(() => ratingBreakdown(reviews), [reviews]);
  const avg = useMemo(() => averageRating(reviews), [reviews]);

  // Ratings Only proof: no written review cards — summary / bars only
  const proofBlocksList = proof === "ratings_only";

  const listCap =
    proofBlocksList || mode === "summary_only" || mode === "ratings_bar_only"
      ? 0
      : mode === "recent"
        ? Math.min(5, sortedReviews.length)
        : visibleCount;
  const visibleReviews = sortedReviews.slice(0, listCap);
  const hasMore =
    !proofBlocksList &&
    mode === "all_paginated" &&
    sortedReviews.length > visibleCount;
  const remainingCount = sortedReviews.length - visibleCount;
  const showList =
    expanded &&
    !proofBlocksList &&
    mode !== "summary_only" &&
    mode !== "ratings_bar_only" &&
    visibleReviews.length > 0;
  const showBars =
    proof === "ratings_only" ||
    (mode !== "summary_only" &&
      (mode === "ratings_bar_only" ||
        mode === "all_paginated" ||
        mode === "collapsible" ||
        mode === "recent"));

  const handleLoadMore = () => {
    setVisibleCount((prev) =>
      Math.min(prev + LOAD_MORE_INCREMENT, sortedReviews.length)
    );
  };

  const handleToggleLatest = () => {
    setSortByLatest((prev) => !prev);
    setVisibleCount(INITIAL_DISPLAY_COUNT);
  };

  return (
    <div
      className="space-y-4"
      data-review-display={mode}
      data-social-proof={proof}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-600">
          {proof === "ratings_only"
            ? `Customer ratings (${reviews.length})`
            : mode === "summary_only"
              ? `Ratings summary (${reviews.length})`
              : mode === "ratings_bar_only"
                ? `Rating breakdown (${reviews.length})`
                : mode === "recent"
                  ? `Recent reviews (${Math.min(5, reviews.length)} of ${reviews.length})`
                  : proof === "user_photos"
                    ? `Customer photos & reviews (${reviews.length})`
                    : `All Reviews (${reviews.length})`}
        </p>
        <div className="flex items-center gap-2 text-sm">
          {mode === "all_paginated" || mode === "collapsible" ? (
            <button
              type="button"
              onClick={handleToggleLatest}
              className={cn(
                "rounded-md border px-2 py-1 transition-colors",
                sortByLatest
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300"
              )}
            >
              Latest
            </button>
          ) : null}
          {mode === "collapsible" ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-neutral-900 hover:border-neutral-300"
            >
              {expanded ? "Hide reviews" : "Show reviews"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-neutral-900 hover:border-neutral-300"
          >
            Write a Review
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ring-1 ring-neutral-200">
            <span className="text-2xl font-extrabold tracking-tight text-neutral-950">
              {reviews.length ? avg.toFixed(1) : "—"}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
              / 5
            </span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <RatingStars rating={avg || 0} />
              <span className="text-sm font-semibold text-neutral-900">
                {reviews.length
                  ? `${reviews.length} review${reviews.length === 1 ? "" : "s"}`
                  : "No reviews yet"}
              </span>
              {proof === "badges" && reviews.length > 0 && avg >= 4.2 ? (
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-900">
                  Bestseller
                </span>
              ) : null}
              {proof === "badges" && reviews.length > 0 && avg < 4.2 ? (
                <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold text-neutral-700">
                  Most Popular
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-neutral-600">
              {reviews.length
                ? proof === "ratings_only"
                  ? "Star ratings from customers"
                  : proof === "user_photos"
                    ? "Highlights reviews with customer photos"
                    : proof === "badges"
                      ? "Social proof badges based on ratings"
                      : "Based on customer feedback"
                : "Be the first to share your experience"}
            </p>
          </div>
        </div>

        {reviews.length > 0 && showBars && (
          <div className="mt-5 space-y-1.5 border-t border-neutral-200/80 pt-4">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = breakdown[stars - 1];
              const pct = Math.round((count / reviews.length) * 100);
              return (
                <div
                  key={stars}
                  className="grid grid-cols-[2.75rem_1fr_1.75rem] items-center gap-2 text-xs text-neutral-600"
                >
                  <span>{stars} ★</span>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-right tabular-nums text-neutral-500">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showList ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {visibleReviews.map((r) => (
              <article
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedReview(r)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedReview(r);
                  }
                }}
                className="cursor-pointer rounded-xl border border-neutral-200 p-4 text-left transition hover:border-neutral-300"
              >
                <RatingStars rating={r.rating} />
                <h4 className="mt-2 font-semibold text-neutral-900">
                  {r.author}
                </h4>
                {proof !== "user_photos" || !r.images?.length ? (
                  <p className="mt-2 line-clamp-3 text-sm text-neutral-700">
                    {r.comment}
                  </p>
                ) : (
                  <p className="mt-2 line-clamp-2 text-sm text-neutral-700">
                    {r.comment}
                  </p>
                )}
                {r.images && r.images.length > 0 ? (
                  <div
                    className={cn(
                      "mt-3 flex flex-wrap gap-2",
                      proof === "user_photos" && "gap-2.5"
                    )}
                  >
                    {r.images
                      .slice(0, proof === "user_photos" ? 4 : 3)
                      .map((src, i) => (
                        <div
                          key={`${r.id}-img-${i}`}
                          className={cn(
                            "overflow-hidden rounded-lg border border-neutral-200 bg-white",
                            proof === "user_photos"
                              ? "h-20 w-20"
                              : "h-16 w-16"
                          )}
                        >
                          <img
                            src={src}
                            alt={`Review photo ${i + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                  </div>
                ) : proof === "user_photos" ? (
                  <p className="mt-2 text-xs text-neutral-400">No photos</p>
                ) : null}
                <p className="mt-3 text-xs text-neutral-500">
                  Posted on {formatDate(r.date)}
                  <span className="ml-2 text-neutral-400">· View details</span>
                </p>
              </article>
            ))}
          </div>

          {hasMore && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                className="btn border border-neutral-200 bg-white text-neutral-900 hover:opacity-90"
              >
                Load More Reviews ({remainingCount} remaining)
              </button>
            </div>
          )}
        </>
      ) : null}

      {/* Detail popup — good for photos + longer text */}
      {selectedReview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedReview(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-neutral-200 bg-neutral-50 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-neutral-950">
                  {selectedReview.author}
                </h3>
                <p className="mt-1 text-xs text-neutral-500">
                  Posted on {formatDate(selectedReview.date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="rounded-full p-1 text-neutral-400 hover:bg-white hover:text-neutral-900"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <RatingStars rating={selectedReview.rating} />
            <p className="mt-4 text-sm leading-relaxed text-neutral-800">
              {selectedReview.comment}
            </p>
            {selectedReview.images && selectedReview.images.length > 0 ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {selectedReview.images.map((src, i) => (
                  <a
                    key={`detail-img-${i}`}
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-white"
                  >
                    <img
                      src={src}
                      alt={`Review photo ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

      <WriteReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchReviews}
        productSlug={productSlug}
      />
    </div>
  );
}

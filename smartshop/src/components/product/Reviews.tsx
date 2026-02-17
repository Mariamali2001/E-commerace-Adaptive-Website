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
  // If already formatted (contains month name), return as-is
  if (dateString.includes(",") && !dateString.includes("T")) {
    return dateString;
  }
  // Otherwise, format ISO date string
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
    return dateB.getTime() - dateA.getTime(); // Newest first
  });
}

export function ReviewsList({ reviews: initialReviews, productSlug }: { reviews: Review[]; productSlug: string }) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [visibleCount, setVisibleCount] = useState(INITIAL_DISPLAY_COUNT);
  const [sortByLatest, setSortByLatest] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Update reviews when initialReviews prop changes
  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/products/${productSlug}/reviews`);
      if (response.ok) {
        const payload = await response.json();
        setReviews(payload.data || []);
        setVisibleCount(INITIAL_DISPLAY_COUNT); // Reset visible count
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  const sortedReviews = useMemo(() => {
    return sortByLatest ? sortReviewsByLatest(reviews) : reviews;
  }, [reviews, sortByLatest]);

  const visibleReviews = sortedReviews.slice(0, visibleCount);
  const hasMore = sortedReviews.length > visibleCount;
  const remainingCount = sortedReviews.length - visibleCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => Math.min(prev + LOAD_MORE_INCREMENT, sortedReviews.length));
  };

  const handleToggleLatest = () => {
    setSortByLatest((prev) => !prev);
    setVisibleCount(INITIAL_DISPLAY_COUNT); // Reset to initial count when sorting changes
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-600">All Reviews ({reviews.length})</p>
        <div className="flex items-center gap-2 text-sm">
          <button 
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
          <button 
            onClick={() => setIsModalOpen(true)}
            className="rounded-md border px-2 py-1 border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300"
          >
            Write a Review
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {visibleReviews.map((r) => (
          <article key={r.id} className="rounded-xl border border-neutral-200 p-4">
            <RatingStars rating={r.rating} />
            <h4 className="mt-2 font-semibold">{r.author}</h4>
            <p className="mt-2 text-sm text-neutral-700">{r.comment}</p>
            <p className="mt-3 text-xs text-neutral-500">Posted on {formatDate(r.date)}</p>
          </article>
        ))}
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <button 
            onClick={handleLoadMore}
            className="btn border border-neutral-200 bg-white text-neutral-900 hover:opacity-90"
          >
            Load More Reviews ({remainingCount} remaining)
          </button>
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

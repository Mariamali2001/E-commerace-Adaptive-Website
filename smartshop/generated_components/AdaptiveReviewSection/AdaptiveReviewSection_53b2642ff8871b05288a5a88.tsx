import { useMemo, useState } from "react";

export type CustomerReview = {
  id: string | number;
  author: string;
  rating: number;
  title?: string;
  content: string;
  date?: string;
};

export type ReviewSectionProps = {
  reviews: CustomerReview[];
};

const REVIEWS_PER_PAGE = 5;

function Rating({ value }: { value: number }) {
  const rating = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={index < rating ? "text-amber-500" : "text-slate-300"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export function CustomerReviewsReviewSection({ reviews }: ReviewSectionProps) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(reviews.length / REVIEWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  const visibleReviews = useMemo(() => {
    const start = (currentPage - 1) * REVIEWS_PER_PAGE;
    return reviews.slice(start, start + REVIEWS_PER_PAGE);
  }, [currentPage, reviews]);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return (
    <section aria-labelledby="customer-reviews-heading" className="w-full">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="customer-reviews-heading"
              className="text-xl font-semibold tracking-tight text-slate-900"
            >
              Customer Reviews
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </p>
          </div>

          {reviews.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="font-medium">{averageRating.toFixed(1)}</span>
              <Rating value={averageRating} />
            </div>
          )}
        </div>

        {visibleReviews.length > 0 ? (
          <div className="divide-y divide-slate-200">
            {visibleReviews.map((review) => (
              <article key={review.id} className="py-5 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Rating value={review.rating} />
                      <span className="text-sm font-medium text-slate-900">
                        {review.author}
                      </span>
                    </div>
                    {review.title && (
                      <h3 className="mt-2 text-sm font-semibold text-slate-900">
                        {review.title}
                      </h3>
                    )}
                  </div>
                  {review.date && (
                    <time className="text-xs text-slate-500">{review.date}</time>
                  )}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{review.content}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-600">No reviews yet.</p>
        )}

        {totalPages > 1 && (
          <nav
            aria-label="Review pagination"
            className="mt-6 flex items-center justify-center gap-2 border-t border-slate-200 pt-5"
          >
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={currentPage === 1}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="px-2 text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={currentPage === totalPages}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}
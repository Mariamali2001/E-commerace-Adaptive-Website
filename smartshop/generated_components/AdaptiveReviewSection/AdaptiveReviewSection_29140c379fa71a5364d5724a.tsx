import { useMemo, useState } from "react";

export type Review = {
  id: string | number;
  author: string;
  rating: number;
  body: string;
  title?: string;
  date?: string;
  verified?: boolean;
};

export type ReviewSectionProps = {
  reviews: Review[];
};

const REVIEWS_PER_PAGE = 6;

function Rating({ value }: { value: number }) {
  const rating = Math.max(0, Math.min(5, Math.round(value)));

  return (
    <span
      className="inline-flex items-center gap-0.5 text-sm text-amber-500"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} aria-hidden="true">
          {index < rating ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}

export function CustomerReviewsReviewSection({
  reviews,
}: ReviewSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(reviews.length / REVIEWS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);

  const visibleReviews = useMemo(() => {
    const start = (page - 1) * REVIEWS_PER_PAGE;
    return reviews.slice(start, start + REVIEWS_PER_PAGE);
  }, [page, reviews]);

  const goToPage = (nextPage: number) => {
    setCurrentPage(Math.min(Math.max(nextPage, 1), totalPages));
  };

  return (
    <section aria-labelledby="customer-reviews-heading" className="w-full">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="customer-reviews-heading"
              className="text-2xl font-semibold tracking-tight text-slate-900"
            >
              Customer Reviews
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>

        {visibleReviews.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2">
            {visibleReviews.map((review) => (
              <article
                key={review.id}
                className="rounded-lg border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <Rating value={review.rating} />
                  {review.verified && (
                    <span className="text-xs font-medium text-emerald-700">
                      Verified purchase
                    </span>
                  )}
                </div>

                {review.title && (
                  <h3 className="mt-3 font-semibold text-slate-900">
                    {review.title}
                  </h3>
                )}

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {review.body}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                  <span className="font-medium text-slate-700">
                    {review.author}
                  </span>
                  {review.date && (
                    <>
                      <span aria-hidden="true">·</span>
                      <time>{review.date}</time>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-slate-200 px-5 py-8 text-center text-sm text-slate-600">
            No reviews yet.
          </p>
        )}

        {totalPages > 1 && (
          <nav
            aria-label="Customer reviews pagination"
            className="mt-8 flex items-center justify-center gap-2"
          >
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1;
                const isCurrent = pageNumber === page;

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    aria-current={isCurrent ? "page" : undefined}
                    onClick={() => goToPage(pageNumber)}
                    className={`min-w-9 rounded-md px-3 py-2 text-sm font-medium transition ${
                      isCurrent
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}
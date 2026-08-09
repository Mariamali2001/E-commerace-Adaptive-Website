import { useMemo, useState } from "react";

type CustomerReview = {
  id: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  date: string;
};

export interface ReviewSectionProps {
  reviews: CustomerReview[];
}

export function CustomerReviewsReviewSection({
  reviews,
}: ReviewSectionProps) {
  const pageSize = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(reviews.length / pageSize));
  const activePage = Math.min(currentPage, pageCount);

  const visibleReviews = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return reviews.slice(start, start + pageSize);
  }, [activePage, reviews]);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) /
        reviews.length
      : 0;

  const formatRating = (rating: number) => rating.toFixed(1);

  return (
    <section
      aria-labelledby="customer-reviews-heading"
      className="w-full border-y border-slate-200 bg-white py-12"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Customer Reviews
            </p>
            <h2
              id="customer-reviews-heading"
              className="mt-2 text-3xl font-bold tracking-tight text-slate-950"
            >
              What our customers say
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Written reviews from verified customers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              aria-label={`${formatRating(averageRating)} out of 5 stars`}
              className="text-xl tracking-wide text-amber-500"
            >
              ★★★★★
            </span>
            <div>
              <p className="font-semibold text-slate-950">
                {formatRating(averageRating)} out of 5
              </p>
              <p className="text-sm text-slate-500">
                {reviews.length} review{reviews.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {visibleReviews.length > 0 ? (
            visibleReviews.map((review) => (
              <article key={review.id} className="py-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span
                        aria-label={`${review.rating} out of 5 stars`}
                        className="text-lg tracking-wide text-amber-500"
                      >
                        {"★".repeat(Math.max(0, Math.min(5, review.rating)))}
                        <span className="text-slate-200">
                          {"★".repeat(
                            5 - Math.max(0, Math.min(5, review.rating)),
                          )}
                        </span>
                      </span>
                      <span className="text-sm font-medium text-slate-700">
                        {review.rating} / 5
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-slate-950">
                      {review.title}
                    </h3>
                  </div>

                  <time
                    dateTime={review.date}
                    className="text-sm text-slate-500"
                  >
                    {review.date}
                  </time>
                </div>

                <p className="mt-3 max-w-3xl leading-7 text-slate-700">
                  {review.body}
                </p>

                <p className="mt-4 text-sm font-medium text-slate-900">
                  {review.author}
                </p>
              </article>
            ))
          ) : (
            <p className="py-10 text-center text-slate-600">
              No customer reviews are available yet.
            </p>
          )}
        </div>

        {pageCount > 1 && (
          <nav
            aria-label="Customer review pages"
            className="mt-8 flex items-center justify-center gap-2"
          >
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={activePage === 1}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            {Array.from({ length: pageCount }, (_, index) => index + 1).map(
              (page) => (
                <button
                  key={page}
                  type="button"
                  aria-current={activePage === page ? "page" : undefined}
                  onClick={() => setCurrentPage(page)}
                  className={`h-10 min-w-10 rounded-md px-3 text-sm font-semibold transition ${
                    activePage === page
                      ? "bg-slate-950 text-white"
                      : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(pageCount, page + 1))
              }
              disabled={activePage === pageCount}
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
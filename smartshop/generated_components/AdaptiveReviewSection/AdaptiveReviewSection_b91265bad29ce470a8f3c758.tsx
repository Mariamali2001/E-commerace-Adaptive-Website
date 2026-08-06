import { useState } from "react";

export type Review = {
  id?: string | number;
  author: string;
  rating: number;
  text: string;
  date?: string;
};

export type ReviewSectionProps = {
  reviews: Review[];
};

const PAGE_SIZE = 6;

export function CustomerReviewsReviewSection({
  reviews,
}: ReviewSectionProps) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleReviews = reviews.slice(startIndex, startIndex + PAGE_SIZE);

  const goToPage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), pageCount));
  };

  return (
    <section aria-labelledby="customer-reviews-heading" className="w-full">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2
            id="customer-reviews-heading"
            className="text-2xl font-semibold tracking-tight text-gray-900"
          >
            Customer Reviews
          </h2>
        </div>

        {visibleReviews.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {visibleReviews.map((review, index) => (
              <article
                key={review.id ?? `${review.author}-${startIndex + index}`}
                className="rounded-lg border border-gray-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{review.author}</p>
                    {review.date ? (
                      <p className="mt-1 text-sm text-gray-500">{review.date}</p>
                    ) : null}
                  </div>
                  <div
                    aria-label={`${review.rating} out of 5 stars`}
                    className="shrink-0 text-sm tracking-wide text-amber-500"
                  >
                    {"★".repeat(Math.max(0, Math.min(5, review.rating)))}
                    <span className="text-gray-300">
                      {"★".repeat(5 - Math.max(0, Math.min(5, review.rating)))}
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-700">
                  {review.text}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
            No customer reviews yet.
          </p>
        )}

        {reviews.length > PAGE_SIZE ? (
          <nav
            aria-label="Customer reviews pagination"
            className="mt-8 flex items-center justify-center gap-2"
          >
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: pageCount }, (_, index) => {
                const pageNumber = index + 1;
                const isCurrent = pageNumber === currentPage;

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => goToPage(pageNumber)}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`h-9 min-w-9 rounded-md px-2 text-sm font-medium ${
                      isCurrent
                        ? "bg-gray-900 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === pageCount}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        ) : null}
      </div>
    </section>
  );
}
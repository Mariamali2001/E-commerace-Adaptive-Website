type Review = {
  id: string | number;
  author: string;
  rating: number;
  body: string;
  title?: string;
  date?: string;
  verified?: boolean;
  photos?: string[];
};

type UserPhotosReviewSectionProps = {
  reviews: Review[];
  currentPage?: number;
  pageCount?: number;
  totalReviewCount?: number;
  onPageChange?: (page: number) => void;
};

export function UserPhotosReviewSection({
  reviews,
  currentPage = 1,
  pageCount = 1,
  totalReviewCount,
  onPageChange,
}: UserPhotosReviewSectionProps) {
  const reviewCount = totalReviewCount ?? reviews.length;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= pageCount && page !== currentPage) {
      onPageChange?.(page);
    }
  };

  return (
    <section aria-labelledby="reviews-heading" className="w-full">
      <div className="mb-8 flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="reviews-heading" className="text-2xl font-semibold tracking-tight text-gray-900">
            Customer reviews
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
          </p>
        </div>
        <p className="text-sm font-medium text-gray-700">User photos</p>
      </div>

      <div className="divide-y divide-gray-200">
        {reviews.length > 0 ? (
          reviews.map((review) => {
            const rating = Math.max(0, Math.min(5, Math.round(review.rating)));

            return (
              <article key={review.id} className="py-7 first:pt-0">
                <div className="flex flex-col gap-5 lg:flex-row lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <div
                        className="flex items-center gap-0.5 text-sm text-gray-900"
                        aria-label={`${rating} out of 5 stars`}
                      >
                        {Array.from({ length: 5 }, (_, index) => (
                          <span
                            key={index}
                            aria-hidden="true"
                            className={index < rating ? "text-amber-500" : "text-gray-300"}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      {review.verified && (
                        <span className="text-xs font-medium text-green-700">
                          Verified purchase
                        </span>
                      )}
                    </div>

                    {review.title && (
                      <h3 className="mt-3 text-base font-semibold text-gray-900">{review.title}</h3>
                    )}

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">
                      {review.body}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{review.author}</span>
                      {review.date && (
                        <>
                          <span aria-hidden="true">•</span>
                          <time>{review.date}</time>
                        </>
                      )}
                    </div>
                  </div>

                  {review.photos && review.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:w-72 lg:grid-cols-3">
                      {review.photos.map((photo, index) => (
                        <img
                          key={`${review.id}-photo-${index}`}
                          src={photo}
                          alt={`Photo shared by ${review.author}, ${index + 1}`}
                          className="aspect-square w-full rounded-md object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <p className="py-10 text-center text-sm text-gray-600">No reviews yet.</p>
        )}
      </div>

      {pageCount > 1 && (
        <nav
          aria-label="Reviews pagination"
          className="mt-8 flex items-center justify-center gap-2 border-t border-gray-200 pt-6"
        >
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <div className="flex items-center gap-1" aria-label={`Page ${currentPage} of ${pageCount}`}>
            {Array.from({ length: pageCount }, (_, index) => {
              const page = index + 1;
              const isCurrent = page === currentPage;

              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`min-w-9 rounded-md px-3 py-2 text-sm font-medium ${
                    isCurrent
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= pageCount}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
}
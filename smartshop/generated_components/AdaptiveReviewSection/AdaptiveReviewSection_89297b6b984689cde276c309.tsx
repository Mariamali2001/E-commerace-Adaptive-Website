type ReviewSectionReview = {
  id: string;
  customerName: string;
  rating: number;
  title?: string;
  body: string;
  date?: string;
  verified?: boolean;
  photos?: Array<{
    id: string;
    src: string;
    alt?: string;
  }>;
};

type ReviewSectionProps = {
  reviews: ReviewSectionReview[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function UserPhotosReviewSection({
  reviews,
  currentPage,
  totalPages,
  onPageChange,
}: ReviewSectionProps) {
  return (
    <section aria-labelledby="reviews-heading" className="w-full border-t border-gray-200 py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="reviews-heading" className="text-2xl font-semibold tracking-tight text-gray-950">
              Customer reviews
            </h2>
            <p className="mt-1 text-sm text-gray-600">Photos uploaded by customers</p>
          </div>
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </p>
        </div>

        <div className="space-y-6">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-5 sm:flex-row sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <div
                      className="flex items-center gap-0.5 text-amber-500"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      {Array.from({ length: 5 }, (_, index) => (
                        <span key={index} aria-hidden="true" className="text-base">
                          {index < review.rating ? "★" : "☆"}
                        </span>
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{review.customerName}</span>
                    {review.verified && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        Verified purchase
                      </span>
                    )}
                  </div>

                  {review.title && (
                    <h3 className="mt-3 text-base font-semibold text-gray-950">{review.title}</h3>
                  )}

                  <p className="mt-2 text-sm leading-6 text-gray-700">{review.body}</p>

                  {review.date && <p className="mt-4 text-xs text-gray-500">{review.date}</p>}
                </div>

                {review.photos && review.photos.length > 0 && (
                  <div className="grid w-full grid-cols-3 gap-2 sm:w-56 sm:shrink-0">
                    {review.photos.map((photo) => (
                      <img
                        key={photo.id}
                        src={photo.src}
                        alt={photo.alt || `Photo shared by ${review.customerName}`}
                        loading="lazy"
                        className="aspect-square w-full rounded-lg object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}

          {reviews.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-12 text-center">
              <p className="text-sm text-gray-600">No reviews to display.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <nav aria-label="Reviews pagination" className="mt-8 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => onPageChange(page)}
                  aria-current={page === currentPage ? "page" : undefined}
                  className={`min-w-9 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    page === currentPage
                      ? "bg-gray-950 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}
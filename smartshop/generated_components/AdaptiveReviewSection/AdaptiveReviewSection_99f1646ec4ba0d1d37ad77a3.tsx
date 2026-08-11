import { useState } from "react";

type Review = {
  id: string;
  author: string;
  rating: number;
  title?: string;
  content: string;
  date?: string;
  verified?: boolean;
  photos?: string[];
};

type ReviewSectionProps = {
  reviews: Review[];
};

const REVIEWS_PER_PAGE = 6;

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <svg
          key={index}
          aria-hidden="true"
          className={`h-4 w-4 ${
            index < rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"
          }`}
          viewBox="0 0 20 20"
        >
          <path d="M10 1.5l2.63 5.33 5.88.85-4.25 4.14 1 5.85L10 14.91l-5.26 2.76 1-5.85L1.5 7.68l5.87-.85L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

export function UserPhotosReviewSection({ reviews }: ReviewSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const customerPhotos = reviews.flatMap((review) =>
    (review.photos ?? []).map((src, index) => ({
      src,
      author: review.author,
      reviewId: review.id,
      index,
    })),
  );

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
      : 0;

  const totalPages = Math.max(1, Math.ceil(reviews.length / REVIEWS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const visibleReviews = reviews.slice(
    (page - 1) * REVIEWS_PER_PAGE,
    page * REVIEWS_PER_PAGE,
  );

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8" aria-labelledby="reviews-heading">
      <div className="border-b border-gray-200 pb-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="reviews-heading" className="text-2xl font-semibold tracking-tight text-gray-900">
              Customer reviews
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-3xl font-semibold text-gray-900">
                {averageRating > 0 ? averageRating.toFixed(1) : "—"}
              </span>
              <div>
                <StarRating rating={Math.round(averageRating)} />
                <p className="mt-1 text-sm text-gray-600">
                  {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </p>
              </div>
            </div>
          </div>
          <p className="max-w-sm text-sm leading-6 text-gray-600">
            See what customers are saying about their experience.
          </p>
        </div>
      </div>

      {customerPhotos.length > 0 && (
        <div className="border-b border-gray-200 py-8">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Photos from customers</h3>
            <span className="text-sm text-gray-500">{customerPhotos.length} photos</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {customerPhotos.map((photo) => (
              <img
                key={`${photo.reviewId}-${photo.index}`}
                src={photo.src}
                alt={`Photo shared by ${photo.author}`}
                className="aspect-square w-full rounded-lg object-cover"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {visibleReviews.map((review) => (
          <article key={review.id} className="py-7 first:pt-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="font-medium text-gray-900">{review.author}</h3>
                  {review.verified && (
                    <span className="text-xs font-medium text-green-700">Verified purchase</span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <StarRating rating={review.rating} />
                  {review.date && <time className="text-sm text-gray-500">{review.date}</time>}
                </div>
              </div>
            </div>

            {review.title && <h4 className="mt-4 font-medium text-gray-900">{review.title}</h4>}
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-700">{review.content}</p>

            {review.photos && review.photos.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-3">
                {review.photos.map((photo, index) => (
                  <img
                    key={`${review.id}-photo-${index}`}
                    src={photo}
                    alt={`Photo shared by ${review.author}`}
                    className="h-24 w-24 rounded-lg object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </article>
        ))}
      </div>

      {reviews.length === 0 && (
        <p className="py-10 text-center text-sm text-gray-600">No reviews yet.</p>
      )}

      {reviews.length > REVIEWS_PER_PAGE && (
        <nav className="flex items-center justify-center gap-2 border-t border-gray-200 pt-7" aria-label="Reviews pagination">
          <button
            type="button"
            onClick={() => setCurrentPage((value) => Math.max(1, value - 1))}
            disabled={page === 1}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <div className="flex items-center gap-1" aria-label={`Page ${page} of ${totalPages}`}>
            {Array.from({ length: totalPages }, (_, index) => {
              const pageNumber = index + 1;
              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  aria-current={pageNumber === page ? "page" : undefined}
                  className={`h-9 min-w-9 rounded-md px-2 text-sm font-medium ${
                    pageNumber === page
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
            onClick={() => setCurrentPage((value) => Math.min(totalPages, value + 1))}
            disabled={page === totalPages}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}
    </section>
  );
}
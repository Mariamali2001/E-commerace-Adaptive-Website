type ReviewSectionPhoto = {
  id: string;
  src: string;
  alt: string;
};

type ReviewSectionReview = {
  id: string;
  author: string;
  rating: number;
  text: string;
  date?: string;
  avatarUrl?: string;
};

export interface ReviewSectionProps {
  photos: ReviewSectionPhoto[];
  reviews: ReviewSectionReview[];
}

export function UserPhotosReviewSection({
  photos,
  reviews,
}: ReviewSectionProps) {
  const recentReviews = reviews.slice(0, 5);

  return (
    <section aria-labelledby="customer-reviews" className="w-full">
      <div className="space-y-8">
        {photos.length > 0 && (
          <div className="space-y-4">
            <h2
              id="customer-reviews"
              className="text-lg font-semibold tracking-tight text-gray-900"
            >
              Customer photos
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {photos.map((photo) => (
                <figure
                  key={photo.id}
                  className="aspect-square overflow-hidden rounded-lg bg-gray-100"
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </figure>
              ))}
            </div>
          </div>
        )}

        {recentReviews.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">
              Recent reviews
            </h2>

            <div className="divide-y divide-gray-200 border-y border-gray-200">
              {recentReviews.map((review) => (
                <article key={review.id} className="space-y-3 py-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {review.avatarUrl ? (
                        <img
                          src={review.avatarUrl}
                          alt=""
                          aria-hidden="true"
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="h-9 w-9 rounded-full bg-gray-100"
                        />
                      )}

                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {review.author}
                        </p>
                        {review.date && (
                          <p className="text-xs text-gray-500">{review.date}</p>
                        )}
                      </div>
                    </div>

                    <div
                      aria-label={`${review.rating} out of 5 stars`}
                      className="flex shrink-0 gap-0.5 text-sm text-gray-900"
                    >
                      {Array.from({ length: 5 }, (_, index) => (
                        <span key={index} aria-hidden="true">
                          {index < review.rating ? "★" : "☆"}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-gray-700">
                    {review.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
type Review = {
  id: string;
  author: string;
  rating: number;
  title?: string;
  body: string;
  date?: string;
  photos?: string[];
};

type ReviewSectionProps = {
  reviews: Review[];
  customerPhotos?: string[];
};

export function UserPhotosReviewSection({
  reviews,
  customerPhotos = [],
}: ReviewSectionProps) {
  const reviewPhotos = reviews.flatMap((review) => review.photos ?? []);
  const photos = [...customerPhotos, ...reviewPhotos];

  return (
    <section className="border-t border-neutral-200 py-6" aria-label="Customer reviews">
      <div className="space-y-6">
        {photos.length > 0 && (
          <div>
            <h2 className="text-base font-medium text-neutral-900">Customer photos</h2>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {photos.map((photo, index) => (
                <img
                  key={`${photo}-${index}`}
                  src={photo}
                  alt="Photo uploaded by a customer"
                  className="aspect-square w-full rounded-md object-cover"
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-base font-medium text-neutral-900">Reviews</h2>
          <div className="mt-3 divide-y divide-neutral-200 border-y border-neutral-200">
            {reviews.map((review) => (
              <details key={review.id} className="group py-4">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm tracking-wide text-neutral-900" aria-label={`${review.rating} out of 5 stars`}>
                        {"★".repeat(Math.max(0, Math.min(5, review.rating)))}
                      </span>
                      <span className="text-sm text-neutral-500">{review.author}</span>
                    </div>
                    {review.title && (
                      <p className="mt-1 text-sm font-medium text-neutral-900">{review.title}</p>
                    )}
                  </div>
                  <span className="mt-1 text-lg leading-none text-neutral-500 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>

                <div className="mt-3 max-w-2xl space-y-3 text-sm text-neutral-600">
                  <p>{review.body}</p>
                  {review.date && <p className="text-xs text-neutral-500">{review.date}</p>}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
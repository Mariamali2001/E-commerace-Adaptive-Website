// components/product/Reviews.tsx
import { Review } from "@/types/review";
import { RatingStars } from "../shared/RatingStars";

export function ReviewsList({ reviews }: { reviews: Review[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-600">All Reviews ({reviews.length})</p>
        <div className="flex items-center gap-2 text-sm">
          <button className="rounded-md border px-2 py-1">Latest</button>
          <button className="rounded-md border px-2 py-1">Write a Review</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reviews.map((r) => (
          <article key={r.id} className="rounded-xl border border-neutral-200 p-4">
            <RatingStars rating={r.rating} />
            <h4 className="mt-2 font-semibold">{r.author}</h4>
            <p className="mt-2 text-sm text-neutral-700">{r.comment}</p>
            <p className="mt-3 text-xs text-neutral-500">Posted on {r.date}</p>
          </article>
        ))}
      </div>

      {reviews.length > 4 && (
        <div className="mt-4 text-center">
          <button className="btn border border-neutral-200 bg-white text-neutral-900">Load More Reviews</button>
        </div>
      )}
    </div>
  );
}

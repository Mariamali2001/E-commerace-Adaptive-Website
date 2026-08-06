type ReviewSectionProps = {
  className?: string;
};

type RatingRow = {
  stars: number;
  percentage: number;
  count: number;
};

const ratingRows: RatingRow[] = [
  { stars: 5, percentage: 78, count: 973 },
  { stars: 4, percentage: 14, count: 175 },
  { stars: 3, percentage: 5, count: 62 },
  { stars: 2, percentage: 2, count: 25 },
  { stars: 1, percentage: 1, count: 13 },
];

export function CustomerReviewsReviewSection({
  className = "",
}: ReviewSectionProps) {
  return (
    <section
      aria-labelledby="customer-reviews-heading"
      className={`w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            Customer Reviews
          </p>
          <h2
            id="customer-reviews-heading"
            className="mt-1 text-2xl font-semibold tracking-tight text-slate-900"
          >
            What customers are saying
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Ratings from verified customer reviews
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            aria-label="4.8 out of 5 stars"
            className="text-3xl font-semibold leading-none text-slate-900"
          >
            4.8
          </div>
          <div>
            <div
              aria-hidden="true"
              className="flex gap-0.5 text-lg leading-none text-amber-400"
            >
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span className="text-slate-300">★</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">1,248 reviews</p>
          </div>
        </div>
      </div>

      <div className="mt-7 space-y-3">
        {ratingRows.map((row) => (
          <div
            key={row.stars}
            className="grid grid-cols-[3.5rem_1fr_3rem] items-center gap-3 text-sm"
          >
            <div className="flex items-center gap-1 text-slate-600">
              <span>{row.stars}</span>
              <span aria-hidden="true" className="text-amber-400">
                ★
              </span>
            </div>
            <div
              aria-label={`${row.percentage}% of reviews`}
              className="h-2 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={row.percentage}
            >
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${row.percentage}%` }}
              />
            </div>
            <span className="text-right text-slate-500">
              {row.percentage}%
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
        <span className="text-slate-500">Total ratings</span>
        <span className="font-medium text-slate-900">1,248</span>
      </div>
    </section>
  );
}
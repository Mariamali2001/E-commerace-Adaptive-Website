type RecommendationSectionProps = {
  className?: string;
};

export function DealsRecommendationSection({
  className = "",
}: RecommendationSectionProps) {
  return (
    <section
      aria-labelledby="deals-recommendation-heading"
      data-recommendation="Deals (Products on sale or special offers)"
      data-recommendation-strength="-1"
      data-social-proof="+2"
      className={`rounded-2xl border border-amber-200 bg-amber-50 p-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-amber-700">Special offers</p>
          <h2
            id="deals-recommendation-heading"
            className="mt-1 text-2xl font-semibold tracking-tight text-gray-900"
          >
            Deals
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-gray-600">
            Products on sale or special offers
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-sm ring-1 ring-inset ring-amber-200">
          Popular choice
        </span>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-inset ring-amber-100">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m9 14 2-2m0 0 2-2m-2 2 2 2m-2-2-2-2m9-5.5V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2h3.172a2 2 0 0 0 1.414-.586l.828-.828a2 2 0 0 1 2.828 0l.828.828A2 2 0 0 0 16.485 5H18a2 2 0 0 1 2 2.5Z"
            />
          </svg>
        </span>
        <p className="text-sm text-gray-700">
          See what shoppers are saving on right now.
        </p>
      </div>
    </section>
  );
}
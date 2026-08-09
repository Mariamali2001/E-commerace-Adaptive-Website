export interface RecommendationSectionProps {
  className?: string;
}

export function DealsRecommendationSection({
  className = "",
}: RecommendationSectionProps) {
  return (
    <section
      aria-labelledby="deals-recommendation-heading"
      data-recommendation="Deals"
      data-recommendation-strength="-1"
      data-social-proof="+1"
      className={`rounded-xl border border-amber-200 bg-amber-50/60 p-5 ${className}`.trim()}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Recommendation
          </p>
          <h2
            id="deals-recommendation-heading"
            className="mt-1 text-lg font-semibold text-gray-900"
          >
            Deals
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Products on sale or special offers
          </p>
        </div>

        <span
          aria-label="Social proof plus one"
          className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-white px-2 text-sm font-semibold text-amber-700 shadow-sm ring-1 ring-amber-200"
        >
          +1
        </span>
      </div>
    </section>
  );
}
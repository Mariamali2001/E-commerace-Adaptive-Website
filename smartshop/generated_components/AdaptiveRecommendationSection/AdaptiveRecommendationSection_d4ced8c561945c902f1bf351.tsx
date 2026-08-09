type RecommendationSectionProps = {
  className?: string;
};

export function DealsRecommendationSection({
  className = "",
}: RecommendationSectionProps) {
  return (
    <section
      aria-labelledby="deals-recommendation-heading"
      className={`rounded-xl border border-slate-200 bg-white p-5 ${className}`}
    >
      <div className="space-y-1">
        <h2
          id="deals-recommendation-heading"
          className="text-lg font-semibold text-slate-900"
        >
          Deals
        </h2>
        <p className="text-sm text-slate-600">
          Products on sale or special offers
        </p>
      </div>
    </section>
  );
}
import type { ReactNode } from "react";

type RecommendationSectionProps = {
  children?: ReactNode;
  className?: string;
};

export function DealsRecommendationSection({
  children,
  className = "",
}: RecommendationSectionProps) {
  return (
    <section
      aria-labelledby="deals-recommendation-heading"
      className={`rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm ${className}`}
    >
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
          Special offers
        </p>
        <h2
          id="deals-recommendation-heading"
          className="mt-1 text-2xl font-bold tracking-tight text-slate-900"
        >
          Deals
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Products on sale or special offers
        </p>
      </div>

      {children && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>}
    </section>
  );
}
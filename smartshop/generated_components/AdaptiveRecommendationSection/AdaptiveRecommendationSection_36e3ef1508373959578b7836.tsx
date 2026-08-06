import type { ReactNode } from "react";

export type RecommendationSectionProps = {
  children?: ReactNode;
};

export function DealsRecommendationSection({
  children,
}: RecommendationSectionProps) {
  return (
    <section
      aria-labelledby="deals-recommendation-heading"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2
          id="deals-recommendation-heading"
          className="text-xl font-semibold tracking-tight text-slate-900"
        >
          Deals
        </h2>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          Popular
        </span>
      </div>
      {children}
    </section>
  );
}
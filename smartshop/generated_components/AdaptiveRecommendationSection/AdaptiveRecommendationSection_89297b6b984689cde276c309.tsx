import type { ReactNode } from "react";

export interface RecommendationSectionProps {
  children?: ReactNode;
}

export function TrendingRecommendationSection({
  children,
}: RecommendationSectionProps) {
  return (
    <section
      aria-labelledby="trending-recommendations-heading"
      className="w-full rounded-2xl border border-slate-200 bg-white p-5"
    >
      <div className="mb-4">
        <h2
          id="trending-recommendations-heading"
          className="text-lg font-semibold text-slate-900"
        >
          Trending
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          What&apos;s popular right now
        </p>
      </div>
      {children}
    </section>
  );
}
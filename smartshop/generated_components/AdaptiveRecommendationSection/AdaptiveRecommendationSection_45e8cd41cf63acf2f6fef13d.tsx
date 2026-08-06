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
      className="w-full"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2
            id="trending-recommendations-heading"
            className="text-xl font-semibold text-slate-900"
          >
            Trending
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            What&apos;s popular right now
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          +2
        </span>
      </div>

      {children}
    </section>
  );
}
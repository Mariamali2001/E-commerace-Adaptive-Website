"use client";

import { Suspense } from "react";
import { ExperimentBrowseBanner } from "./ExperimentBrowseBanner";

export function ExperimentBrowseBannerHost() {
  return (
    <Suspense fallback={null}>
      <ExperimentBrowseBanner />
    </Suspense>
  );
}

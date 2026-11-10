"use client";

import { Suspense } from "react";
import { EvaluationSurveyButton } from "./EvaluationSurveyButton";

export function EvaluationSurveyButtonHost() {
  return (
    <Suspense fallback={null}>
      <EvaluationSurveyButton />
    </Suspense>
  );
}

import { Suspense } from "react";
import { ExperimentMoodFlow } from "@/components/experiment/ExperimentMoodFlow";
import { MoodDevNotes } from "@/components/mood/MoodDevNotes";

export const metadata = {
  title: "Mood check | SmartShop",
  description: "Optional mood check before your personalized shop experience",
};

export default function MoodCameraPage() {
  return (
    <div className="container py-10 md:py-14">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Quick mood check
        </h1>
        <p className="mt-2 text-neutral-600">
          Allow camera access for a short scan, or pick how you feel using the
          buttons below. You can skip this step anytime.
        </p>

        <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <Suspense
            fallback={<p className="text-sm text-neutral-500">Loading…</p>}
          >
            <ExperimentMoodFlow />
          </Suspense>
        </div>

        <MoodDevNotes />
      </div>
    </div>
  );
}

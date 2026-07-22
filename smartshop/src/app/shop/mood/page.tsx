import { Suspense } from "react";
import { ExperimentMoodFlow } from "@/components/experiment/ExperimentMoodFlow";

export const metadata = {
  title: "Mood Camera | SmartShop",
  description: "Webcam mood detection using the Egyptian fine-tuned model",
};

export default function MoodCameraPage() {
  return (
    <div className="container py-10 md:py-14">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Mood camera
        </h1>
        <p className="mt-2 text-neutral-600">
          Start the camera, then detect your mood with{" "}
          <code className="text-sm">best_model_egypt_ft.h5</code>. Keep the local
          Mood API running in another terminal.
        </p>

        <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <Suspense fallback={<p className="text-sm text-neutral-500">Loading…</p>}>
            <ExperimentMoodFlow />
          </Suspense>
        </div>

        <div className="mt-4 space-y-1 text-xs text-neutral-500">
          <p>
            Tip: use <strong>http://localhost:3000/shop/mood</strong> and allow
            camera access.
          </p>
          <p>
            API:{" "}
            <code>cd smartshop/mood_model && python3 mood_api.py</code>
          </p>
        </div>
      </div>
    </div>
  );
}

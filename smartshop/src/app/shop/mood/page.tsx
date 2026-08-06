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

        <div className="mt-4 space-y-2 text-xs text-neutral-500">
          <p>
            <strong>Desktop:</strong>{" "}
            <code>http://localhost:3000/shop/mood</code> (camera works on
            localhost).
          </p>
          <p>
            <strong>iPhone / mobile camera:</strong> Safari only allows the
            camera on <strong>HTTPS</strong> (or localhost). On your computer run{" "}
            <code>npm run dev:https</code>, then on the phone open the{" "}
            <em>Network</em> URL with <code>https://</code> (example:{" "}
            <code>https://192.168.x.x:3000</code>). If Safari warns about the
            certificate, tap <em>Advanced → Continue</em>, allow camera, then
            Detect mood.
          </p>
          <p>
            Do <strong>not</strong> type <code>localhost</code> on the phone —
            that points at the phone itself. Stay on the same Wi‑Fi as the
            computer. Mood API stays on the computer:{" "}
            <code>cd mood_model && python3 mood_api.py</code>
          </p>
        </div>
      </div>
    </div>
  );
}

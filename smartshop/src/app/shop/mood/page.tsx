import { WebcamCapture } from "@/components/mood/WebcamCapture";

export const metadata = {
  title: "Mood Camera | SmartShop",
  description: "Webcam preview for emotion detection (model integration coming soon)",
};

export default function MoodCameraPage() {
  return (
    <div className="container py-10 md:py-14">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Mood camera
        </h1>
        <p className="mt-2 text-neutral-600">
          Test your webcam here. Emotion detection will be connected later using
          your trained model.
        </p>

        <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <WebcamCapture />
        </div>

        <p className="mt-4 text-xs text-neutral-500">
          Tip: use <strong>http://localhost:3000</strong> and allow camera access
          when your browser asks.
        </p>
      </div>
    </div>
  );
}

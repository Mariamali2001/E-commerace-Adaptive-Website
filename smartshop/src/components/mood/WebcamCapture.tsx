"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/shared/Button";
import { canvasToVitJpegBlob } from "@/lib/mood/vitFramePrep";

type CameraStatus = "idle" | "starting" | "active" | "error";

type MoodPrediction = {
  face_detected: boolean;
  mood: string | null;
  confidence: number | null;
  probabilities: Record<string, number> | null;
  model?: string;
  /** How many frames were averaged (multi-frame detect) */
  frames_used?: number;
};

type ApiError = { error?: string };

/** Capture this many frames and average probabilities before choosing mood. */
const DETECT_FRAME_COUNT = 1;
const DETECT_FRAME_GAP_MS = 280;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function averageProbabilities(
  preds: MoodPrediction[]
): Record<string, number> | null {
  const withFace = preds.filter(
    (p) => p.face_detected && p.probabilities && Object.keys(p.probabilities).length
  );
  if (!withFace.length) return null;

  const sums: Record<string, number> = {};
  for (const p of withFace) {
    for (const [name, value] of Object.entries(p.probabilities!)) {
      sums[name] = (sums[name] ?? 0) + Number(value);
    }
  }
  const n = withFace.length;
  const avg: Record<string, number> = {};
  for (const [name, sum] of Object.entries(sums)) {
    avg[name] = sum / n;
  }
  return avg;
}

function pickTopMood(probabilities: Record<string, number>): {
  mood: string;
  confidence: number;
} {
  let mood = "";
  let confidence = -1;
  for (const [name, value] of Object.entries(probabilities)) {
    if (value > confidence) {
      mood = name;
      confidence = value;
    }
  }
  return { mood, confidence };
}

type WebcamCaptureProps = {
  onMoodDetected?: (payload: {
    mood: string;
    confidence: number | null;
    /** JPEG base64 without data: prefix — for validation feedback / fine-tune */
    imageBase64: string | null;
    /** Which remote model produced this detection */
    moodBackend: "efficientnet" | "vit";
  }) => void;
  /** When true, skip new predictions (e.g. while user confirms mood). */
  detectionLocked?: boolean;
};

export function WebcamCapture({
  onMoodDetected,
  detectionLocked = false,
}: WebcamCaptureProps = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiReady, setApiReady] = useState<boolean | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<MoodPrediction | null>(null);
  const [autoDetect, setAutoDetect] = useState(false);
  const [moodBackend, setMoodBackend] = useState<"efficientnet" | "vit">("vit");
  const vitWarmupStarted = useRef(false);

  const warmupVit = useCallback(() => {
    if (vitWarmupStarted.current) return;
    vitWarmupStarted.current = true;
    void fetch("/api/mood/vit-warmup", {
      method: "POST",
      cache: "no-store",
    }).catch(() => {
      /* non-blocking */
    });
  }, []);

  const releaseStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    releaseStream();
    setStatus("idle");
    setErrorMessage(null);
    setAutoDetect(false);
  }, [releaseStream]);

  const startCamera = useCallback(async () => {
    const host =
      typeof window !== "undefined" ? window.location.hostname : "";
    const isLocalhost = host === "localhost" || host === "127.0.0.1";
    const isSecure =
      typeof window !== "undefined" &&
      (window.isSecureContext || isLocalhost);

    if (!isSecure) {
      setStatus("error");
      setErrorMessage(
        "iPhone/Safari blocks the camera on plain HTTP. On your computer run: npm run dev:https — then open the https://192.168…:3000 link on your iPhone (tap Advanced → Continue if warned). Manual mood buttons remain as backup."
      );
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setErrorMessage(
        "This browser cannot open the camera. On mobile over Wi‑Fi IP, use the manual mood buttons below."
      );
      return;
    }

    setStatus("starting");
    setErrorMessage(null);

    try {
      releaseStream();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // iOS Safari needs playsInline + explicit play
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
      }

      setStatus("active");
      if (moodBackend === "vit") warmupVit();
    } catch (err) {
      setStatus("error");
      const message =
        err instanceof Error ? err.message : "Could not access the webcam.";
      const lower = message.toLowerCase();
      if (lower.includes("permission") || lower.includes("notallowed")) {
        setErrorMessage(
          "Camera permission denied. Allow camera access in browser settings, or pick a mood manually below."
        );
      } else if (lower.includes("notfound") || lower.includes("devices not found")) {
        setErrorMessage("No camera found on this device. Use manual mood below.");
      } else if (
        lower.includes("secure") ||
        lower.includes("ssl") ||
        lower.includes("https")
      ) {
        setErrorMessage(
          "Camera blocked on non-HTTPS. Use localhost on your computer, or pick mood manually on the phone."
        );
      } else {
        setErrorMessage(`${message} — you can still pick a mood manually below.`);
      }
    }
  }, [releaseStream, moodBackend, warmupVit]);

  const captureBlob = useCallback(
    async (opts?: { forVit?: boolean }): Promise<Blob | null> => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.videoWidth === 0) return null;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Match CSS mirror + local smoke test (selfie view)
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      ctx.restore();

      if (opts?.forVit) {
        return canvasToVitJpegBlob(canvas);
      }

      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
      });
    },
    []
  );

  const blobToBase64 = useCallback(async (blob: Blob): Promise<string> => {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary);
  }, []);

  const detectMood = useCallback(async () => {
    if (status !== "active" || predicting || detectionLocked) return;

    setPredicting(true);
    setErrorMessage(null);

    try {
      const frameBlobs: Blob[] = [];
      const predictions: MoodPrediction[] = [];

      // Capture frame(s); ViT gets a smaller face-centered JPEG
      for (let i = 0; i < DETECT_FRAME_COUNT; i += 1) {
        if (i > 0) await sleep(DETECT_FRAME_GAP_MS);
        const blob = await captureBlob({ forVit: moodBackend === "vit" });
        if (!blob) continue;

        const form = new FormData();
        form.append("image", blob, `frame_${i}.jpg`);
        form.append("backend", moodBackend);

        const res = await fetch(
          `/api/mood/predict?backend=${encodeURIComponent(moodBackend)}`,
          {
            method: "POST",
            body: form,
          }
        );
        const data = (await res.json()) as MoodPrediction & ApiError;

        if (!res.ok) {
          setErrorMessage(data.error || "Prediction failed.");
          setApiReady(false);
          return;
        }

        frameBlobs.push(blob);
        predictions.push(data);
      }

      if (!predictions.length) {
        setErrorMessage("Could not capture frames from the camera.");
        return;
      }

      setApiReady(true);

      const avgProbs = averageProbabilities(predictions);
      const framesWithFace = predictions.filter((p) => p.face_detected && p.mood);

      if (!avgProbs || !framesWithFace.length) {
        setPrediction({
          face_detected: false,
          mood: null,
          confidence: null,
          probabilities: null,
          frames_used: predictions.length,
        });
        return;
      }

      const { mood, confidence } = pickTopMood(avgProbs);
      const bestSingle = [...framesWithFace].sort(
        (a, b) => (b.confidence ?? 0) - (a.confidence ?? 0)
      )[0]!;
      const bestIdx = predictions.indexOf(bestSingle);
      const feedbackBlob =
        (bestIdx >= 0 ? frameBlobs[bestIdx] : null) ??
        frameBlobs[Math.floor(frameBlobs.length / 2)] ??
        frameBlobs[0]!;

      const aggregated: MoodPrediction = {
        face_detected: true,
        mood,
        confidence,
        probabilities: avgProbs,
        model: bestSingle.model,
        frames_used: framesWithFace.length,
      };

      setPrediction(aggregated);
      setAutoDetect(false);

      let imageBase64: string | null = null;
      try {
        imageBase64 = await blobToBase64(feedbackBlob);
      } catch {
        imageBase64 = null;
      }

      onMoodDetected?.({
        mood,
        confidence,
        imageBase64,
        moodBackend,
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Prediction request failed."
      );
      setApiReady(false);
    } finally {
      setPredicting(false);
    }
  }, [
    blobToBase64,
    captureBlob,
    detectionLocked,
    moodBackend,
    predicting,
    status,
    onMoodDetected,
  ]);

  useEffect(() => {
    if (moodBackend === "vit") {
      vitWarmupStarted.current = false;
      warmupVit();
    }
  }, [moodBackend, warmupVit]);

  useEffect(() => {
    let cancelled = false;
    setApiReady(null);
    (async () => {
      try {
        const res = await fetch(
          `/api/mood/predict?backend=${encodeURIComponent(moodBackend)}`,
          { cache: "no-store" }
        );
        if (!cancelled) setApiReady(res.ok);
      } catch {
        if (!cancelled) setApiReady(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [moodBackend]);

  useEffect(() => {
    if (!autoDetect || status !== "active" || detectionLocked) return;
    // Multi-frame detect is slower — avoid overlapping requests
    const id = window.setInterval(() => {
      void detectMood();
    }, 4500);
    return () => window.clearInterval(id);
  }, [autoDetect, detectMood, detectionLocked, status]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const topProbs = prediction?.probabilities
    ? Object.entries(prediction.probabilities)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
    : [];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-900">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`aspect-video w-full object-cover ${
            status === "active" ? "block scale-x-[-1]" : "hidden"
          }`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {status !== "active" && (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-neutral-100 text-neutral-600">
            <span className="text-4xl" aria-hidden>
              📷
            </span>
            <p className="text-sm">
              {status === "starting"
                ? "Starting camera..."
                : "Camera preview will appear here"}
            </p>
          </div>
        )}

        {status === "active" && predicting && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/45 backdrop-blur-[1px]"
            role="status"
            aria-live="polite"
          >
            <div
              className="h-11 w-11 animate-spin rounded-full border-[3px] border-white/30 border-t-white"
              aria-hidden
            />
            <p className="px-4 text-center text-sm font-medium text-white">
              Detecting your mood…
            </p>
            <p className="max-w-[16rem] px-4 text-center text-xs text-white/80">
              Please look at the camera and wait — this can take a few seconds.
            </p>
          </div>
        )}

        {status === "active" &&
          !predicting &&
          prediction?.face_detected &&
          prediction.mood && (
          <div className="absolute bottom-3 left-3 rounded-xl bg-black/70 px-3 py-2 text-sm text-white">
            <span className="font-semibold capitalize">{prediction.mood}</span>
            {prediction.confidence != null && (
              <span className="ml-2 text-white/80">
                {(prediction.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="mood-backend" className="font-medium text-neutral-800">
            Detection model
          </label>
          <select
            id="mood-backend"
            value={moodBackend}
            disabled={predicting || detectionLocked}
            onChange={(e) => {
              const v = e.target.value === "vit" ? "vit" : "efficientnet";
              setMoodBackend(v);
              setPrediction(null);
            }}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 disabled:opacity-50"
          >
            <option value="efficientnet">EfficientNet (Railway)</option>
            <option value="vit">ViT (Modal)</option>
          </select>
        </div>
        <p>
          Mood API ({moodBackend === "vit" ? "ViT / Modal" : "EfficientNet / Railway"}
          ):{" "}
          {apiReady === null && <span className="font-medium">Checking…</span>}
          {apiReady === true && (
            <span className="font-medium text-emerald-700">Connected</span>
          )}
          {apiReady === false && moodBackend === "efficientnet" && (
            <span className="font-medium text-amber-700">
              Offline — locally run{" "}
              <code className="text-xs">npm run mood-api</code>. On Vercel set{" "}
              <code className="text-xs">MOOD_API_URL</code>.
            </span>
          )}
          {apiReady === false && moodBackend === "vit" && (
            <span className="font-medium text-amber-700">
              Offline — set <code className="text-xs">VIT_MOOD_API_URL</code> on
              Vercel to your Modal predict URL, then redeploy.
            </span>
          )}
          {apiReady === true && moodBackend === "vit" && (
            <span className="block text-xs text-neutral-500">
              Warming Modal in the background; first Detect may still be slower.
            </span>
          )}
        </p>
      </div>

      {errorMessage && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={startCamera}
          disabled={status === "starting" || status === "active"}
        >
          {status === "starting" ? "Starting..." : "Start camera"}
        </Button>
        <button
          type="button"
          onClick={stopCamera}
          disabled={status !== "active"}
          className="btn rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Stop camera
        </button>
        <Button
          type="button"
          onClick={() => void detectMood()}
          disabled={status !== "active" || predicting || detectionLocked}
          className="bg-emerald-700 hover:opacity-90"
        >
          {predicting ? "Detecting…" : "Detect mood"}
        </Button>
        <button
          type="button"
          onClick={() => setAutoDetect((v) => !v)}
          disabled={status !== "active" || detectionLocked}
          className="btn rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {autoDetect ? "Auto: ON" : "Auto: OFF"}
        </button>
      </div>

      {prediction && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          {!prediction.face_detected ? (
            <p className="text-sm text-neutral-600">
              No face detected — center your face and try again.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-lg font-semibold capitalize text-neutral-900">
                {prediction.mood}{" "}
                <span className="text-base font-normal text-neutral-500">
                  ({((prediction.confidence ?? 0) * 100).toFixed(1)}%)
                </span>
              </p>
              <ul className="space-y-1 text-sm text-neutral-600">
                {topProbs.map(([name, p]) => (
                  <li key={name} className="flex justify-between gap-4">
                    <span className="capitalize">{name}</span>
                    <span>{(p * 100).toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
              {prediction.frames_used != null && (
                <p className="text-xs text-neutral-500">
                  Averaged from {prediction.frames_used} frame
                  {prediction.frames_used === 1 ? "" : "s"}
                </p>
              )}
              {prediction.model && (
                <p className="text-xs text-neutral-400">
                  Model: {prediction.model}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-sm text-neutral-500">
        Status:{" "}
        <span className="font-medium text-neutral-800">
          {status === "idle" && "Ready"}
          {status === "starting" && "Starting"}
          {status === "active" && "Camera active"}
          {status === "error" && "Error"}
        </span>
      </p>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/shared/Button";

type CameraStatus = "idle" | "starting" | "active" | "error";

export function WebcamCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
  }, [releaseStream]);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setErrorMessage(
        "Your browser does not support camera access. Try Chrome or Safari on localhost."
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
        await videoRef.current.play();
      }

      setStatus("active");
    } catch (err) {
      setStatus("error");
      const message =
        err instanceof Error ? err.message : "Could not access the webcam.";
      if (message.toLowerCase().includes("permission")) {
        setErrorMessage(
          "Camera permission denied. Allow camera access in your browser settings and try again."
        );
      } else if (message.toLowerCase().includes("notfound")) {
        setErrorMessage("No camera found on this device.");
      } else {
        setErrorMessage(message);
      }
    }
  }, [releaseStream]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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
      </div>

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

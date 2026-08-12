"""Smoke-test Egypt EfficientNet mood model on the MacBook webcam.

Pipeline:
  OpenCV webcam → Haar face crop → resize 96x96 → Keras model → emotion + confidence

Usage (from smartshop/mood_model):
  python webcam_test_h5.py
  python webcam_test_h5.py --model artifacts/models/best_model_efficientnet_egypt_ft_v4.h5

Keys:
  q / Esc — quit
  s — print current prediction to terminal
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

import cv2
import numpy as np

# Must match training notebook class order (image_dataset_from_directory alphabetical)
CLASS_NAMES = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
IMAGE_SIZE = 96

ROOT = Path(__file__).resolve().parent
# DEFAULT_MODEL = ROOT / "artifacts" / "models" / "best_model.h5"
DEFAULT_MODEL_EGYPT = ROOT / "artifacts" / "models" / "best_model_efficientnet_egypt_ft_v4.h5"


def load_model(model_path: Path):
    import tensorflow as tf

    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")

    print(f"Loading model: {model_path}")
    model = tf.keras.models.load_model(str(model_path), compile=False)
    print("Model loaded.")
    return model


def get_face_cascade() -> cv2.CascadeClassifier:
    cascade_path = Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml"
    cascade = cv2.CascadeClassifier(str(cascade_path))
    if cascade.empty():
        raise RuntimeError(f"Could not load Haar cascade from {cascade_path}")
    return cascade


def crop_face(frame_bgr: np.ndarray, cascade: cv2.CascadeClassifier, pad: float = 0.25):
    """Return largest face crop (BGR) or None if no face found."""
    gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))
    if len(faces) == 0:
        return None, None

    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    pad_x = int(w * pad)
    pad_y = int(h * pad)
    x1 = max(0, x - pad_x)
    y1 = max(0, y - pad_y)
    x2 = min(frame_bgr.shape[1], x + w + pad_x)
    y2 = min(frame_bgr.shape[0], y + h + pad_y)
    return frame_bgr[y1:y2, x1:x2], (x1, y1, x2, y2)


def preprocess_face(face_bgr: np.ndarray) -> np.ndarray:
    """Match training: RGB float32 in [0, 255], shape (1, 96, 96, 3)."""
    face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
    face_resized = cv2.resize(face_rgb, (IMAGE_SIZE, IMAGE_SIZE), interpolation=cv2.INTER_AREA)
    batch = face_resized.astype(np.float32)[None, ...]
    return batch


def predict_emotion(model, face_bgr: np.ndarray) -> tuple[str, float, np.ndarray]:
    batch = preprocess_face(face_bgr)
    probs = model.predict(batch, verbose=0)[0]
    idx = int(np.argmax(probs))
    return CLASS_NAMES[idx], float(probs[idx]), probs


def draw_overlay(
    frame: np.ndarray,
    box: tuple[int, int, int, int] | None,
    label: str | None,
    confidence: float | None,
    fps: float,
) -> None:
    h, _ = frame.shape[:2]
    cv2.putText(
        frame,
        f"FPS: {fps:.1f} | q=quit  s=print",
        (10, 28),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        (220, 220, 220),
        2,
        cv2.LINE_AA,
    )

    if box is None:
        cv2.putText(
            frame,
            "No face detected — center your face",
            (10, h - 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (40, 40, 220),
            2,
            cv2.LINE_AA,
        )
        return

    x1, y1, x2, y2 = box
    cv2.rectangle(frame, (x1, y1), (x2, y2), (80, 200, 80), 2)
    if label is not None and confidence is not None:
        text = f"{label}  {confidence:.2f}"
        cv2.putText(
            frame,
            text,
            (x1, max(30, y1 - 10)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (40, 220, 40),
            2,
            cv2.LINE_AA,
        )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Webcam smoke test for best_model.h5")
    parser.add_argument(
        "--model",
        type=Path,
        default=DEFAULT_MODEL_EGYPT,
        help="Path to Keras .h5 checkpoint",
    )
    parser.add_argument("--camera", type=int, default=0, help="Camera index (default 0)")
    parser.add_argument(
        "--every",
        type=int,
        default=3,
        help="Run model every N frames (default 3) for smoother FPS",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    model = load_model(args.model)
    cascade = get_face_cascade()

    cap = cv2.VideoCapture(args.camera)
    if not cap.isOpened():
        print(
            "Could not open webcam. On macOS: System Settings → Privacy & Security → Camera "
            "→ allow Terminal / your IDE.",
            file=sys.stderr,
        )
        return 1

    print("Webcam open. Press q to quit, s to print prediction.")
    print("Classes:", CLASS_NAMES)

    label: str | None = None
    confidence: float | None = None
    probs: np.ndarray | None = None
    box = None
    frame_i = 0
    t0 = time.time()
    fps = 0.0

    while True:
        ok, frame = cap.read()
        if not ok:
            print("Failed to read frame from camera.", file=sys.stderr)
            break

        frame = cv2.flip(frame, 1)  # mirror for natural selfie view
        face, box = crop_face(frame, cascade)

        if face is not None and frame_i % max(1, args.every) == 0:
            label, confidence, probs = predict_emotion(model, face)

        frame_i += 1
        if frame_i % 15 == 0:
            now = time.time()
            fps = 15.0 / max(1e-6, now - t0)
            t0 = now

        draw_overlay(frame, box, label, confidence, fps)
        cv2.imshow("Mood smoke test (EfficientNet-B0)", frame)

        key = cv2.waitKey(1) & 0xFF
        if key in (ord("q"), 27):
            break
        if key == ord("s") and label is not None and confidence is not None and probs is not None:
            print(f"\nPrediction: {label}  confidence={confidence:.3f}")
            for name, p in sorted(zip(CLASS_NAMES, probs), key=lambda x: -x[1]):
                print(f"  {name:10s} {p:.3f}")

    cap.release()
    cv2.destroyAllWindows()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

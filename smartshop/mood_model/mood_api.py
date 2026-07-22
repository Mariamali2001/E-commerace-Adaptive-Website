"""Local mood inference API for SmartShop.

Loads best_model_egypt_ft.h5 and exposes:
  GET  /health
  POST /predict   (multipart field: image)

Run from smartshop/mood_model:
  python mood_api.py
  # or: uvicorn mood_api:app --host 127.0.0.1 --port 8001
"""

from __future__ import annotations

import io
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

CLASS_NAMES = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
IMAGE_SIZE = 96
ROOT = Path(__file__).resolve().parent
DEFAULT_MODEL = ROOT / "artifacts" / "models" / "best_model_egypt_ft.h5"

app = FastAPI(title="SmartShop Mood API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_model = None
_cascade: cv2.CascadeClassifier | None = None


def get_cascade() -> cv2.CascadeClassifier:
    global _cascade
    if _cascade is None:
        path = Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml"
        _cascade = cv2.CascadeClassifier(str(path))
        if _cascade.empty():
            raise RuntimeError(f"Could not load Haar cascade from {path}")
    return _cascade


def get_model():
    global _model
    if _model is None:
        import tensorflow as tf

        if not DEFAULT_MODEL.exists():
            raise FileNotFoundError(f"Model not found: {DEFAULT_MODEL}")
        _model = tf.keras.models.load_model(str(DEFAULT_MODEL), compile=False)
    return _model


def crop_face(frame_bgr: np.ndarray, pad: float = 0.25):
    cascade = get_cascade()
    gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
    faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))
    if len(faces) == 0:
        return None
    x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
    pad_x = int(w * pad)
    pad_y = int(h * pad)
    x1 = max(0, x - pad_x)
    y1 = max(0, y - pad_y)
    x2 = min(frame_bgr.shape[1], x + w + pad_x)
    y2 = min(frame_bgr.shape[0], y + h + pad_y)
    return frame_bgr[y1:y2, x1:x2]


def preprocess_face(face_bgr: np.ndarray) -> np.ndarray:
    face_rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB)
    face_resized = cv2.resize(face_rgb, (IMAGE_SIZE, IMAGE_SIZE), interpolation=cv2.INTER_AREA)
    return face_resized.astype(np.float32)[None, ...]


@app.on_event("startup")
def startup() -> None:
    get_cascade()
    get_model()
    print(f"Mood API ready — model: {DEFAULT_MODEL}")


@app.get("/health")
def health():
    return {
        "ok": True,
        "model": str(DEFAULT_MODEL.name),
        "classes": CLASS_NAMES,
        "image_size": IMAGE_SIZE,
    }


@app.post("/predict")
async def predict(image: UploadFile = File(...)):
    raw = await image.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty image")

    arr = np.frombuffer(raw, dtype=np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode image")

    face = crop_face(frame)
    if face is None:
        return {
            "face_detected": False,
            "mood": None,
            "confidence": None,
            "probabilities": None,
        }

    try:
        model = get_model()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model load failed: {e}") from e

    probs = model.predict(preprocess_face(face), verbose=0)[0]
    idx = int(np.argmax(probs))
    return {
        "face_detected": True,
        "mood": CLASS_NAMES[idx],
        "confidence": float(probs[idx]),
        "probabilities": {name: float(p) for name, p in zip(CLASS_NAMES, probs)},
        "model": DEFAULT_MODEL.name,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("mood_api:app", host="127.0.0.1", port=8001, reload=False)

"""Mood inference API for SmartShop.

Loads best_model_egypt_ft.h5 and exposes:
  GET  /health
  POST /predict   (multipart field: image)

Local:
  python mood_api.py

Deploy (Railway / Render / HF Spaces / Fly):
  set PORT, optional MODEL_URL / MODEL_PATH
  uvicorn mood_api:app --host 0.0.0.0 --port $PORT
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

import cv2
import numpy as np
import requests
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

CLASS_NAMES = ["angry", "disgust", "fear", "happy", "neutral", "sad", "surprise"]
IMAGE_SIZE = 96
ROOT = Path(__file__).resolve().parent
DEFAULT_MODEL = Path(
    os.environ.get(
        "MODEL_PATH",
        str(ROOT / "artifacts" / "models" / "best_model_egypt_ft.h5"),
    )
)
_model = None
_cascade: cv2.CascadeClassifier | None = None


def get_model_url() -> str:
    # Read at call-time so Railway Variables always apply after redeploy.
    return (
        os.environ.get("MODEL_URL")
        or os.environ.get("MODEL_DOWNLOAD_URL")
        or ""
    ).strip()


def download_model(url: str, dest: Path) -> None:
    """Download weights with redirect + certifi SSL (macOS-safe)."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".download")
    print(f"Downloading mood model from MODEL_URL → {dest}")
    with requests.get(url, stream=True, timeout=600, allow_redirects=True) as res:
        res.raise_for_status()
        total = int(res.headers.get("content-length") or 0)
        done = 0
        with open(tmp, "wb") as out:
            for chunk in res.iter_content(chunk_size=1024 * 1024):
                if not chunk:
                    continue
                out.write(chunk)
                done += len(chunk)
                if total:
                    pct = done * 100 // total
                    print(f"  downloaded {done // (1024 * 1024)}MB ({pct}%)", end="\r")
        print()
    if not dest.exists() and tmp.exists():
        tmp.replace(dest)
    elif tmp.exists():
        tmp.replace(dest)


def ensure_model_file() -> Path:
    """Use local weights, or download once from MODEL_URL when missing."""
    path = Path(
        os.environ.get(
            "MODEL_PATH",
            str(ROOT / "artifacts" / "models" / "best_model_egypt_ft.h5"),
        )
    )
    if path.exists() and path.stat().st_size > 1_000_000:
        return path

    model_url = get_model_url()
    if not model_url:
        raise FileNotFoundError(
            f"Model not found at {path}. "
            "In Railway → Variables, set MODEL_URL to your Hugging Face resolve link, then Redeploy. "
            "Example: https://huggingface.co/MariamBashandy/smartshop-mood-egypt/resolve/main/best_model_egypt_ft.h5"
        )

    download_model(model_url, path)
    if not path.exists() or path.stat().st_size < 1_000_000:
        raise FileNotFoundError(f"Download finished but model missing/invalid at {path}")
    return path


def get_cascade() -> cv2.CascadeClassifier:
    global _cascade
    if _cascade is None:
        cascade_path = Path(cv2.data.haarcascades) / "haarcascade_frontalface_default.xml"
        _cascade = cv2.CascadeClassifier(str(cascade_path))
        if _cascade.empty():
            raise RuntimeError(f"Could not load Haar cascade from {cascade_path}")
    return _cascade


def get_model():
    global _model
    if _model is None:
        import tensorflow as tf

        model_path = ensure_model_file()
        _model = tf.keras.models.load_model(str(model_path), compile=False)
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


@asynccontextmanager
async def lifespan(_app: FastAPI):
    get_cascade()
    get_model()
    print(f"Mood API ready — model: {DEFAULT_MODEL}")
    yield


app = FastAPI(title="SmartShop Mood API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "service": "smartshop-mood-api",
        "health": "/health",
        "predict": "POST /predict (multipart field: image)",
    }


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

    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8001"))
    uvicorn.run("mood_api:app", host=host, port=port, reload=False)

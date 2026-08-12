/**
 * Prepare a smaller face-centered JPEG for ViT (Modal) to cut upload time.
 * Uses FaceDetector when available; otherwise an upper-center square crop.
 */

export const VIT_OUT_SIZE = 256;
export const VIT_JPEG_QUALITY = 0.75;

type FaceBox = { x: number; y: number; width: number; height: number };

async function detectFaceBox(
  source: HTMLCanvasElement
): Promise<FaceBox | null> {
  try {
    const FD = (
      globalThis as unknown as {
        FaceDetector?: new (opts?: {
          fastMode?: boolean;
          maxDetectedFaces?: number;
        }) => {
          detect: (
            input: ImageBitmapSource
          ) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
        };
      }
    ).FaceDetector;

    if (!FD) return null;
    const detector = new FD({ fastMode: true, maxDetectedFaces: 1 });
    const faces = await detector.detect(source);
    const face = faces[0];
    if (!face) return null;
    const b = face.boundingBox;
    return { x: b.x, y: b.y, width: b.width, height: b.height };
  } catch {
    return null;
  }
}

/** Upper-center square — typical selfie face region when FaceDetector is missing. */
function upperCenterSquare(w: number, h: number): FaceBox {
  const side = Math.min(w, h) * 0.88;
  const x = (w - side) / 2;
  const y = Math.max(0, h * 0.12);
  return {
    x,
    y: Math.min(y, h - side),
    width: side,
    height: Math.min(side, h - y),
  };
}

function padBox(box: FaceBox, w: number, h: number, pad = 0.28): FaceBox {
  const px = box.width * pad;
  const py = box.height * pad;
  const x1 = Math.max(0, box.x - px);
  const y1 = Math.max(0, box.y - py);
  const x2 = Math.min(w, box.x + box.width + px);
  const y2 = Math.min(h, box.y + box.height + py);
  return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

/**
 * From a mirrored full frame already drawn on `source`, crop face (or upper center)
 * and resize to VIT_OUT_SIZE JPEG.
 */
export async function canvasToVitJpegBlob(
  source: HTMLCanvasElement
): Promise<Blob | null> {
  const w = source.width;
  const h = source.height;
  if (!w || !h) return null;

  const detected = await detectFaceBox(source);
  const box = padBox(detected ?? upperCenterSquare(w, h), w, h);

  const out = document.createElement("canvas");
  out.width = VIT_OUT_SIZE;
  out.height = VIT_OUT_SIZE;
  const ctx = out.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(
    source,
    box.x,
    box.y,
    box.width,
    box.height,
    0,
    0,
    VIT_OUT_SIZE,
    VIT_OUT_SIZE
  );

  return new Promise((resolve) => {
    out.toBlob((blob) => resolve(blob), "image/jpeg", VIT_JPEG_QUALITY);
  });
}

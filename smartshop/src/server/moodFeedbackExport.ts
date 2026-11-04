import "server-only";

import JSZip from "jszip";
import connectDB from "@/lib/mongodb";
import MoodFeedbackModel from "@/models/MoodFeedback";
import { rowsToCsv } from "@/server/experiment";

export type MoodFeedbackExportRow = {
  id: string;
  email: string;
  user_id: string;
  predicted_raw: string;
  predicted_guideline: string;
  confirmed_guideline: string;
  was_correct: string;
  confidence: string;
  mood_backend: string;
  has_image: string;
  filename: string;
  created_at: string;
};

function sanitizePart(value: string | null | undefined, fallback: string): string {
  const s = (value ?? "").trim().replace(/[^a-zA-Z0-9_-]+/g, "_");
  return s || fallback;
}

function jpegBuffer(imageBase64: unknown): Buffer | null {
  if (typeof imageBase64 !== "string") return null;
  const bare = imageBase64.includes(",")
    ? imageBase64.slice(imageBase64.indexOf(",") + 1)
    : imageBase64.trim();
  if (bare.length < 100) return null;
  try {
    const buf = Buffer.from(bare, "base64");
    return buf.length > 50 ? buf : null;
  } catch {
    return null;
  }
}

export async function listMoodFeedbackForExport() {
  await connectDB();
  return MoodFeedbackModel.find({})
    .sort({ createdAt: 1 })
    .select(
      "userId email predictedRaw predictedGuideline confirmedGuideline wasCorrect confidence moodBackend mimeType imageBase64 createdAt"
    )
    .lean();
}

export function moodFeedbackToCsvRows(
  docs: Awaited<ReturnType<typeof listMoodFeedbackForExport>>
): MoodFeedbackExportRow[] {
  return docs.map((r) => {
    const id = String(r._id);
    const predicted = sanitizePart(r.predictedGuideline, "unknown");
    const confirmed = sanitizePart(r.confirmedGuideline, "Unlabeled");
    const yesNo = r.wasCorrect ? "yes" : "no";
    const buf = jpegBuffer(r.imageBase64);
    const filename = buf
      ? `${confirmed}/${id}_pred-${predicted}_${yesNo}.jpg`
      : "";
    return {
      id,
      email: r.email ?? "",
      user_id: r.userId ?? "",
      predicted_raw: r.predictedRaw ?? "",
      predicted_guideline: r.predictedGuideline ?? "",
      confirmed_guideline: r.confirmedGuideline ?? "",
      was_correct: r.wasCorrect ? "yes" : "no",
      confidence:
        r.confidence != null && Number.isFinite(Number(r.confidence))
          ? String(r.confidence)
          : "",
      mood_backend: r.moodBackend ?? "",
      has_image: buf ? "yes" : "no",
      filename,
      created_at: r.createdAt ? new Date(r.createdAt).toISOString() : "",
    };
  });
}

export function moodFeedbackCsv(
  docs: Awaited<ReturnType<typeof listMoodFeedbackForExport>>
): string {
  return rowsToCsv(moodFeedbackToCsvRows(docs));
}

export async function moodFeedbackZip(
  docs: Awaited<ReturnType<typeof listMoodFeedbackForExport>>
): Promise<Buffer> {
  const stamp = new Date().toISOString().slice(0, 10);
  const rootName = `mood_feedback_${stamp}`;
  const zip = new JSZip();
  const root = zip.folder(rootName);
  if (!root) throw new Error("Could not create zip folder");

  const rows = moodFeedbackToCsvRows(docs);
  root.file("manifest.csv", moodFeedbackCsv(docs));

  docs.forEach((r, i) => {
    const buf = jpegBuffer(r.imageBase64);
    const rel = rows[i]?.filename;
    if (!buf || !rel) return;
    root.file(rel, buf);
  });

  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
}

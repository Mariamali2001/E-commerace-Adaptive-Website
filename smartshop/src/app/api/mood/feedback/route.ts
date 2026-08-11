import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import MoodFeedbackModel from "@/models/MoodFeedback";
import { getCurrentUser } from "@/server/session";

const MAX_BASE64_CHARS = 2_500_000; // ~1.8MB binary

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();

    const predictedGuideline =
      typeof body.predictedGuideline === "string"
        ? body.predictedGuideline.trim()
        : "";
    const confirmedGuideline =
      typeof body.confirmedGuideline === "string"
        ? body.confirmedGuideline.trim()
        : "";
    const imageBase64 =
      typeof body.imageBase64 === "string" ? body.imageBase64.trim() : "";

    if (!predictedGuideline || !confirmedGuideline || !imageBase64) {
      return NextResponse.json(
        {
          error:
            "predictedGuideline, confirmedGuideline, and imageBase64 are required",
        },
        { status: 400 }
      );
    }

    if (imageBase64.length > MAX_BASE64_CHARS) {
      return NextResponse.json(
        { error: "Image too large for feedback storage" },
        { status: 413 }
      );
    }

    // Strip data-URL prefix if the client sent one
    const bare = imageBase64.includes(",")
      ? imageBase64.slice(imageBase64.indexOf(",") + 1)
      : imageBase64;

    await connectDB();
    const doc = await MoodFeedbackModel.create({
      userId: user?.id ?? null,
      email: user?.email ?? null,
      predictedRaw:
        typeof body.predictedRaw === "string" ? body.predictedRaw : null,
      predictedGuideline,
      confirmedGuideline,
      wasCorrect: Boolean(body.wasCorrect),
      confidence:
        body.confidence != null && Number.isFinite(Number(body.confidence))
          ? Number(body.confidence)
          : null,
      imageBase64: bare,
      mimeType: "image/jpeg",
    });

    return NextResponse.json({
      data: { id: doc._id.toString(), wasCorrect: doc.wasCorrect },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to save mood feedback",
      },
      { status: 500 }
    );
  }
}

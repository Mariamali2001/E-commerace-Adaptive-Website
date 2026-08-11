import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import MoodFeedbackModel from "@/models/MoodFeedback";
import { getCurrentUser } from "@/server/session";
import { isAdminEmail, ADMIN_EMAIL } from "@/server/admin";

/** Admin: verify mood validation frames were saved for later fine-tune. */
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: `Admin only. Log in as ${ADMIN_EMAIL}`,
        },
        { status: 403 }
      );
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const includePreview = searchParams.get("preview") === "1";

    const [total, correct, incorrect, withImage] = await Promise.all([
      MoodFeedbackModel.countDocuments({}),
      MoodFeedbackModel.countDocuments({ wasCorrect: true }),
      MoodFeedbackModel.countDocuments({ wasCorrect: false }),
      MoodFeedbackModel.countDocuments({
        imageBase64: { $exists: true, $type: "string", $ne: "" },
      }),
    ]);

    const recent = await MoodFeedbackModel.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "userId email predictedRaw predictedGuideline confirmedGuideline wasCorrect confidence mimeType imageBase64 createdAt"
      )
      .lean();

    const rows = recent.map((r) => {
      const img = typeof r.imageBase64 === "string" ? r.imageBase64 : "";
      const base: Record<string, unknown> = {
        id: String(r._id),
        email: r.email ?? "",
        predictedRaw: r.predictedRaw ?? "",
        predictedGuideline: r.predictedGuideline,
        confirmedGuideline: r.confirmedGuideline,
        wasCorrect: r.wasCorrect ? "yes" : "no",
        confidence: r.confidence ?? "",
        imageBytesApprox: img ? Math.round((img.length * 3) / 4) : 0,
        hasImage: img.length > 100 ? "yes" : "no",
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
      };
      if (includePreview && img.length > 100) {
        const mime = r.mimeType || "image/jpeg";
        base.imageDataUrl = `data:${mime};base64,${img}`;
      }
      return base;
    });

    return NextResponse.json({
      summary: {
        total,
        withImage,
        correct,
        incorrect,
        ok: total > 0 && withImage === total,
      },
      recent: rows,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to load mood feedback",
      },
      { status: 500 }
    );
  }
}

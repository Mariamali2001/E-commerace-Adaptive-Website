import { NextResponse } from "next/server";
import { requireUser } from "@/server/session";
import { saveExperimentResult } from "@/server/experiment";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    if (!body?.answers || typeof body.answers !== "object") {
      return NextResponse.json(
        { error: "answers object is required" },
        { status: 400 }
      );
    }

    // Prefer explicit body (from signup via mood flow), then user record.
    // Questionnaire no longer collects age/gender.
    const ageNum =
      body.age != null && body.age !== ""
        ? Number(body.age)
        : Number(user.age);
    const gender =
      typeof body.gender === "string" && body.gender.trim()
        ? body.gender.trim()
        : typeof user.gender === "string"
          ? user.gender
          : null;

    const doc = await saveExperimentResult({
      userId: user.id,
      device: body.device ?? null,
      answers: body.answers,
      surveyPersona: body.surveyPersona ?? null,
      guidelinePersona: body.guidelinePersona ?? null,
      traitScores: body.traitScores ?? {},
      traitLevels: body.traitLevels ?? {},
      selfReportedMood: body.selfReportedMood ?? null,
      detectedMood: body.detectedMood ?? null,
      detectedConfidence: body.detectedConfidence ?? null,
      predictedGuidelineMood: body.predictedGuidelineMood ?? null,
      confirmedMood: body.confirmedMood ?? null,
      moodWasCorrect:
        typeof body.moodWasCorrect === "boolean" ? body.moodWasCorrect : null,
      moodSource:
        body.moodSource === "camera" || body.moodSource === "manual"
          ? body.moodSource
          : null,
      moodBackend:
        body.moodBackend === "vit" || body.moodBackend === "efficientnet"
          ? body.moodBackend
          : null,
      guidelineMood: body.guidelineMood ?? null,
      uiElements: body.uiElements ?? {},
      guidelinesPipeline: body.guidelinesPipeline ?? [],
      age: Number.isFinite(ageNum) ? ageNum : null,
      gender,
    });

    return NextResponse.json({
      data: {
        id: doc._id.toString(),
        userId: doc.userId,
        age: doc.age,
        gender: doc.gender,
        completedAt: doc.completedAt,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

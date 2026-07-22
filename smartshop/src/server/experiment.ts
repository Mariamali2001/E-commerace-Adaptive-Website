import "server-only";

import connectDB from "@/lib/mongodb";
import ExperimentResultModel from "@/models/ExperimentResult";
import UserModel from "@/models/User";
import { deriveProfileFromAnswers } from "@/lib/experiment/questions";

export type SaveExperimentInput = {
  userId: string;
  device?: string | null;
  answers: Record<string, string>;
  surveyPersona?: string | null;
  guidelinePersona?: string | null;
  traitScores?: Record<string, number>;
  traitLevels?: Record<string, string>;
  selfReportedMood?: string | null;
  detectedMood?: string | null;
  detectedConfidence?: number | null;
  guidelineMood?: string | null;
  uiElements?: Record<string, string>;
  guidelinesPipeline?: string[];
  /** Optional demographics (fills gaps + updates User) */
  age?: number | null;
  gender?: string | null;
};

export async function saveExperimentResult(input: SaveExperimentInput) {
  await connectDB();

  const user = await UserModel.findById(input.userId);
  if (!user) throw new Error("User not found");

  // Demographics: prefer explicit payload, then answers, then existing user fields
  const ageFromAnswers = Number(input.answers?.age);
  const genderFromAnswers = input.answers?.gender?.trim() || null;
  const age =
    input.age ??
    (Number.isFinite(ageFromAnswers) ? ageFromAnswers : null) ??
    user.age ??
    null;
  const gender =
    input.gender ?? genderFromAnswers ?? user.gender ?? null;

  if ((age != null && user.age !== age) || (gender && user.gender !== gender)) {
    if (age != null) user.age = age;
    if (gender) user.gender = gender;
    await user.save();
  }

  // Prefer client-computed scores; recompute from answers as safety net
  const derived = deriveProfileFromAnswers(input.answers ?? {});
  const traitScores = {
    ...derived.traitScores,
    ...(input.traitScores ?? {}),
  };
  const traitLevels = {
    ...derived.traits,
    ...(input.traitLevels ?? {}),
  };

  const uiElements = input.uiElements ?? {};

  const doc = await ExperimentResultModel.findOneAndUpdate(
    { userId: input.userId },
    {
      userId: input.userId,
      email: user.email,
      name: user.name,
      age,
      gender,
      device: input.device ?? null,
      surveyPersona: input.surveyPersona ?? derived.surveyPersona,
      guidelinePersona: input.guidelinePersona ?? derived.persona,
      traitScores,
      traitLevels,
      answers: input.answers ?? {},
      selfReportedMood:
        input.selfReportedMood ?? derived.selfReportedMood ?? null,
      detectedMood: input.detectedMood ?? null,
      detectedConfidence: input.detectedConfidence ?? null,
      guidelineMood: input.guidelineMood ?? null,
      uiElements,
      guidelinesPipeline: input.guidelinesPipeline ?? [],
      completedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return doc;
}

export async function listExperimentResults() {
  await connectDB();
  return ExperimentResultModel.find({}).sort({ updatedAt: -1 }).lean();
}

/** TIPI reverse on 1–5: (6 - score) */
function rev5(n: number) {
  return 6 - n;
}

function parseItem(answers: Record<string, string> | undefined, id: string) {
  const v = Number(answers?.[id]);
  return Number.isFinite(v) ? v : "";
}

/**
 * Build Excel-friendly rows. Trait scores use TIPI pair averages on 1–5 scale:
 * E=(outgoing+rev(reserved))/2, A=(trusting+rev(fault))/2,
 * C=(thorough+rev(lazy))/2, N=(nervous+rev(relaxed))/2,
 * O=(imagination+rev(few_artistic))/2
 */
export function experimentResultsToRows(results: any[]) {
  return results.map((r) => {
    const a = (r.answers ?? {}) as Record<string, string>;
    const scores = r.traitScores ?? {};
    const ui = r.uiElements ?? {};

    // Recompute from raw items when present (authoritative for Excel)
    const reserved = Number(a.tipi_reserved);
    const trusting = Number(a.tipi_trusting);
    const lazy = Number(a.tipi_lazy);
    const relaxed = Number(a.tipi_relaxed);
    const fewArtistic = Number(a.tipi_few_artistic);
    const outgoing = Number(a.tipi_outgoing);
    const fault = Number(a.tipi_fault);
    const thorough = Number(a.tipi_thorough);
    const nervous = Number(a.tipi_nervous);
    const imagination = Number(a.tipi_imagination);

    const tipI = {
      Extraversion:
        Number.isFinite(outgoing) && Number.isFinite(reserved)
          ? (outgoing + rev5(reserved)) / 2
          : scores.Extraversion ?? "",
      Agreeableness:
        Number.isFinite(trusting) && Number.isFinite(fault)
          ? (trusting + rev5(fault)) / 2
          : scores.Agreeableness ?? "",
      Conscientiousness:
        Number.isFinite(thorough) && Number.isFinite(lazy)
          ? (thorough + rev5(lazy)) / 2
          : scores.Conscientiousness ?? "",
      Neuroticism:
        Number.isFinite(nervous) && Number.isFinite(relaxed)
          ? (nervous + rev5(relaxed)) / 2
          : scores.Neuroticism ?? "",
      Openness:
        Number.isFinite(imagination) && Number.isFinite(fewArtistic)
          ? (imagination + rev5(fewArtistic)) / 2
          : scores.Openness ?? "",
    };

    const round = (v: number | string) =>
      typeof v === "number" ? Math.round(v * 100) / 100 : v;

    return {
      user_id: r.userId,
      email: r.email,
      name: r.name,
      age: r.age ?? "",
      gender: r.gender ?? "",
      device: r.device ?? "",
      survey_persona: r.surveyPersona ?? "",
      guideline_persona: r.guidelinePersona ?? "",
      // TIPI item raw (1–5)
      tipi_1_reserved: parseItem(a, "tipi_reserved"),
      tipi_2_trusting: parseItem(a, "tipi_trusting"),
      tipi_3_lazy: parseItem(a, "tipi_lazy"),
      tipi_4_relaxed: parseItem(a, "tipi_relaxed"),
      tipi_5_few_artistic: parseItem(a, "tipi_few_artistic"),
      tipi_6_outgoing: parseItem(a, "tipi_outgoing"),
      tipi_7_fault: parseItem(a, "tipi_fault"),
      tipi_8_thorough: parseItem(a, "tipi_thorough"),
      tipi_9_nervous: parseItem(a, "tipi_nervous"),
      tipi_10_imagination: parseItem(a, "tipi_imagination"),
      // TIPI scored traits (1–5)
      score_extraversion: round(tipI.Extraversion),
      score_agreeableness: round(tipI.Agreeableness),
      score_conscientiousness: round(tipI.Conscientiousness),
      score_neuroticism: round(tipI.Neuroticism),
      score_openness: round(tipI.Openness),
      level_extraversion: r.traitLevels?.Extraversion ?? "",
      level_agreeableness: r.traitLevels?.Agreeableness ?? "",
      level_conscientiousness: r.traitLevels?.Conscientiousness ?? "",
      level_neuroticism: r.traitLevels?.Neuroticism ?? "",
      level_openness: r.traitLevels?.Openness ?? "",
      self_reported_mood: r.selfReportedMood ?? a.self_mood ?? "",
      model_detected_mood: r.detectedMood ?? "",
      model_confidence: r.detectedConfidence ?? "",
      guideline_mood: r.guidelineMood ?? "",
      // UI adaptation placeholders (filled later)
      ui_color_theme: ui.color_theme_pref ?? "",
      ui_font_style: ui.font_style_pref ?? "",
      ui_font_size: ui.font_size_pref ?? "",
      ui_accent_color: ui.accent_color_pref ?? "",
      ui_urgency: ui.urgency_pref ?? "",
      ui_recommendation_type: ui.recommendation_type ?? "",
      ui_elements_json: Object.keys(ui).length ? JSON.stringify(ui) : "",
      completed_at: r.completedAt
        ? new Date(r.completedAt).toISOString()
        : "",
      updated_at: r.updatedAt ? new Date(r.updatedAt).toISOString() : "",
    };
  });
}

export function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];
  // BOM so Excel opens UTF-8 correctly
  return `\uFEFF${lines.join("\n")}`;
}

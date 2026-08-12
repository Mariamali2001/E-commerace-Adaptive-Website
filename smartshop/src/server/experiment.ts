import "server-only";

import connectDB from "@/lib/mongodb";
import ExperimentResultModel from "@/models/ExperimentResult";
import UserModel from "@/models/User";
import { deriveProfileFromAnswers } from "@/lib/experiment/questions";
import {
  hasExactMasterCombination,
  listMasterCombinations,
} from "@/lib/adaptiveEngine/masterRules";
import type { DeviceKind } from "@/lib/guidelines/types";

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
  predictedGuidelineMood?: string | null;
  confirmedMood?: string | null;
  moodWasCorrect?: boolean | null;
  moodSource?: "camera" | "manual" | null;
  moodBackend?: "efficientnet" | "vit" | null;
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
      predictedGuidelineMood: input.predictedGuidelineMood ?? null,
      confirmedMood: input.confirmedMood ?? null,
      moodWasCorrect:
        typeof input.moodWasCorrect === "boolean"
          ? input.moodWasCorrect
          : null,
      moodSource: input.moodSource ?? null,
      moodBackend: input.moodBackend ?? null,
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
 * Stable Final UI token columns (master_adaptive_ui_rules keys).
 * Each becomes `ui_<key>` in the CSV, plus full `ui_elements_json`.
 */
export const UI_ELEMENT_COLUMN_KEYS = [
  "color_theme_pref",
  "accent_color_pref",
  "background_pref",
  "font_style_pref",
  "font_size_pref",
  "whitespace_pref",
  "button_style_pref",
  "form_field_style",
  "hero_banner_size",
  "product_desc_length",
  "recommendation_type",
  "urgency_pref",
  "checkout_style",
  "social_proof_display",
  "desktop_navigation",
  "desktop_search_visibility",
  "desktop_category_display",
  "desktop_filter_location",
  "desktop_persistent_filters",
  "desktop_grid_pref",
  "desktop_product_card",
  "desktop_price_display",
  "desktop_review_display",
  "desktop_info_density",
  "desktop_image_text_ratio",
  "desktop_quick_view",
  "desktop_whitespace",
  "mobile_navigation",
  "mobile_search_visibility",
  "mobile_category_display",
  "mobile_filter_location",
  "mobile_grid_pref",
  "mobile_product_card",
  "mobile_price_display",
  "mobile_review_display",
  "mobile_info_density",
  "mobile_image_text_ratio",
  "mobile_quick_view",
  "mobile_whitespace",
  "mobile_sticky_header",
  "mobile_touch_size",
] as const;

function uiColumnName(tokenKey: string) {
  return `ui_${tokenKey}`;
}

function shortUiValue(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  // Prefer the short label before "(" for Excel readability
  const before = s.split("(")[0]?.trim();
  return before || s;
}

/**
 * Build Excel-friendly rows. Trait scores use TIPI pair averages on 1–5 scale:
 * E=(outgoing+rev(reserved))/2, A=(trusting+rev(fault))/2,
 * C=(thorough+rev(lazy))/2, N=(nervous+rev(relaxed))/2,
 * O=(imagination+rev(few_artistic))/2
 */
type ExperimentRowSource = {
  userId?: string;
  email?: string;
  name?: string;
  age?: number | string | null;
  gender?: string | null;
  device?: string | null;
  surveyPersona?: string | null;
  guidelinePersona?: string | null;
  uiElements?: Record<string, string> | null;
  answers?: Record<string, string> | null;
  traitScores?: Record<string, number> | null;
  traitLevels?: Record<string, string> | null;
  selfReportedMood?: string | null;
  detectedMood?: string | null;
  detectedConfidence?: number | string | null;
  predictedGuidelineMood?: string | null;
  confirmedMood?: string | null;
  moodWasCorrect?: boolean | null;
  moodSource?: string | null;
  moodBackend?: string | null;
  guidelineMood?: string | null;
  guidelinesPipeline?: string[] | null;
  createdAt?: Date | string | null;
  completedAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export function experimentResultsToRows(results: ExperimentRowSource[]) {
  // Include any extra token keys present in saved results (forward-compatible)
  const extraUiKeys = new Set<string>();
  for (const r of results) {
    for (const k of Object.keys(r.uiElements ?? {})) {
      if (
        !(UI_ELEMENT_COLUMN_KEYS as readonly string[]).includes(k) &&
        k.trim()
      ) {
        extraUiKeys.add(k);
      }
    }
  }
  const allUiKeys = [
    ...UI_ELEMENT_COLUMN_KEYS,
    ...[...extraUiKeys].sort(),
  ];

  return results.map((r) => {
    const a = (r.answers ?? {}) as Record<string, string>;
    const scores = r.traitScores ?? {};
    const ui = (r.uiElements ?? {}) as Record<string, string>;

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

    const uiColumns: Record<string, string> = {};
    for (const key of allUiKeys) {
      uiColumns[uiColumnName(key)] = shortUiValue(ui[key]);
    }

    return {
      user_id: r.userId,
      email: r.email,
      name: r.name,
      age: r.age ?? "",
      gender: r.gender ?? "",
      device: r.device ?? "",
      study_chapter: isNewChapterResult(r) ? "new" : "legacy",
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
      predicted_guideline_mood: r.predictedGuidelineMood ?? "",
      confirmed_mood: r.confirmedMood ?? "",
      mood_was_correct:
        typeof r.moodWasCorrect === "boolean"
          ? r.moodWasCorrect
            ? "yes"
            : "no"
          : "",
      mood_source: r.moodSource ?? "",
      mood_backend: r.moodBackend ?? "",
      guideline_mood: r.guidelineMood ?? "",
      in_master_rules: (() => {
        const persona = normalizePersonaLabel(
          r.guidelinePersona || r.surveyPersona || ""
        );
        const device = normalizeDeviceKind(r.device);
        const mood = r.confirmedMood || r.guidelineMood || "";
        if (!persona || !device || !mood) return "";
        return hasExactMasterCombination(persona, device, mood) ? "yes" : "no";
      })(),
      guidelines_pipeline: Array.isArray(r.guidelinesPipeline)
        ? r.guidelinesPipeline.join(" → ")
        : "",
      // Fallback flags derived from pipeline steps (for Results chapter metrics)
      used_mood_fallback: Array.isArray(r.guidelinesPipeline)
        ? r.guidelinesPipeline.includes("mood_fallback")
          ? "yes"
          : "no"
        : "",
      used_device_fallback: Array.isArray(r.guidelinesPipeline)
        ? r.guidelinesPipeline.includes("device_fallback")
          ? "yes"
          : "no"
        : "",
      used_persona_fallback: Array.isArray(r.guidelinesPipeline)
        ? r.guidelinesPipeline.includes("persona_fallback")
          ? "yes"
          : "no"
        : "",
      used_global_fill: Array.isArray(r.guidelinesPipeline)
        ? r.guidelinesPipeline.includes("global_defaults_fill")
          ? "yes"
          : "no"
        : "",
      // Final UI options — one column per token + full JSON
      ...uiColumns,
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
  // Union headers so every UI column appears even if first row is sparse
  const headerSet = new Set<string>();
  for (const row of rows) {
    for (const k of Object.keys(row)) headerSet.add(k);
  }
  const headers = [...headerSet];
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

function normalizeDeviceKind(device: string | null | undefined): DeviceKind | null {
  if (!device) return null;
  const d = device.trim().toLowerCase();
  if (d === "mobile" || d === "smartphone") return "mobile";
  if (d === "desktop" || d === "laptop" || d === "laptop/desktop") return "desktop";
  return null;
}

/** Align saved persona labels with master short names (drop leading "The "). */
function normalizePersonaLabel(persona: string | null | undefined): string {
  if (!persona?.trim()) return "";
  let p = persona.trim();
  // Drop long survey parenthetical if present
  p = p.split("(")[0]?.trim() ?? p;
  p = p.replace(/^The\s+/i, "").trim();
  return p;
}

function combinationKey(persona: string, device: string, mood: string) {
  return `${normalizePersonaLabel(persona).toLowerCase()}|${device.trim().toLowerCase()}|${mood.trim().toLowerCase()}`;
}

/**
 * New-chapter runs = after mood validation update.
 * Legacy (e.g. first 32) have no mood_source / confirmed_mood.
 */
export function isNewChapterResult(r: ExperimentRowSource): boolean {
  const source =
    typeof r.moodSource === "string" ? r.moodSource.trim().toLowerCase() : "";
  if (source === "camera" || source === "manual") return true;
  if (typeof r.confirmedMood === "string" && r.confirmedMood.trim()) return true;
  return false;
}

export function filterNewChapterResults<T extends ExperimentRowSource>(
  results: T[]
): T[] {
  return results.filter(isNewChapterResult);
}

/**
 * Coverage table for the 67 designed master cells + fallback participant counts.
 */
export function buildCombinationCoverage(results: ExperimentRowSource[]) {
  const master = listMasterCombinations();
  const counts = new Map<string, number>();

  let fallbackParticipants = 0;
  let exactParticipants = 0;

  for (const r of results) {
    const persona = normalizePersonaLabel(
      r.guidelinePersona || r.surveyPersona || ""
    );
    const deviceKind = normalizeDeviceKind(r.device);
    const mood = (r.confirmedMood || r.guidelineMood || "").trim();
    if (!persona || !deviceKind || !mood) {
      fallbackParticipants += 1;
      continue;
    }

    const exact = hasExactMasterCombination(persona, deviceKind, mood);
    if (exact) {
      exactParticipants += 1;
      const key = combinationKey(persona, deviceKind, mood);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    } else {
      fallbackParticipants += 1;
    }
  }

  const rows = master.map((c) => {
    const key = combinationKey(c.persona, c.device, c.mood);
    const n = counts.get(key) ?? 0;
    return {
      persona: c.persona,
      device: c.device,
      device_label: c.deviceLabel,
      mood: c.mood,
      n,
      in_master_rules: "yes",
      has_participants: n > 0 ? "yes" : "no",
    };
  });

  const filled = rows.filter((r) => r.n > 0).length;

  return {
    rows,
    summary: {
      master_combinations: master.length,
      combinations_with_participants: filled,
      combinations_empty: master.length - filled,
      participants_exact_match: exactParticipants,
      participants_fallback_or_incomplete: fallbackParticipants,
      participants_total: results.length,
    },
  };
}

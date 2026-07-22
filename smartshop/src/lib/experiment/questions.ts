import type {
  GuidelineMood,
  PersonaId,
  TraitLevel,
  TraitName,
} from "@/lib/guidelines/types";

export type QuestionOption = {
  label: string;
  value: string;
};

export type ExperimentQuestion = {
  id: string;
  text: string;
  options: QuestionOption[];
  kind: "likert5" | "choice";
  mapsTo:
    | { type: "persona" }
    | { type: "tipi" }
    | { type: "self_mood" }
    | { type: "note" };
};

/** Survey persona labels (stored as answered). */
export type SurveyPersona =
  | "Deal Hunter"
  | "Researcher"
  | "Need-based"
  | "Entertainment"
  | "Gift Buying"
  | "Minimalist";

/**
 * Map survey personas → guideline JSON personas (existing lookup keys).
 * Need-based / Entertainment / Gift Buying are bridged until guideline files include them.
 */
export const SURVEY_PERSONA_TO_GUIDELINE: Record<SurveyPersona, PersonaId> = {
  "Deal Hunter": "Deal Hunter",
  Researcher: "Researcher",
  Minimalist: "Minimalist",
  "Need-based": "Browser",
  Entertainment: "Impulsive Buyer",
  "Gift Buying": "Loyal Customer",
};

export const LIKERT_5: QuestionOption[] = [
  { label: "1 — Disagree strongly", value: "1" },
  { label: "2 — Disagree a little", value: "2" },
  { label: "3 — Neither agree nor disagree", value: "3" },
  { label: "4 — Agree a little", value: "4" },
  { label: "5 — Agree strongly", value: "5" },
];

/**
 * TIPI-style items (1–5). Scoring uses reverse-coded pairs.
 * Order matches the list you provided.
 */
export const EXPERIMENT_QUESTIONS: ExperimentQuestion[] = [
  {
    id: "age",
    text: "What is your age?",
    kind: "choice",
    mapsTo: { type: "note" },
    options: Array.from({ length: 48 }, (_, i) => {
      const n = i + 18;
      return { label: String(n), value: String(n) };
    }),
  },
  {
    id: "gender",
    text: "What is your gender?",
    kind: "choice",
    mapsTo: { type: "note" },
    options: [
      { label: "Female", value: "Female" },
      { label: "Male", value: "Male" },
      { label: "Non-binary", value: "Non-binary" },
      { label: "Prefer not to say", value: "Prefer not to say" },
      { label: "Other", value: "Other" },
    ],
  },
  {
    id: "tipi_reserved",
    text: "I see myself as someone who is reserved.",
    kind: "likert5",
    mapsTo: { type: "tipi" },
    options: LIKERT_5,
  },
  {
    id: "tipi_trusting",
    text: "I see myself as someone who is generally trusting.",
    kind: "likert5",
    mapsTo: { type: "tipi" },
    options: LIKERT_5,
  },
  {
    id: "tipi_lazy",
    text: "I see myself as someone who tends to be lazy.",
    kind: "likert5",
    mapsTo: { type: "tipi" },
    options: LIKERT_5,
  },
  {
    id: "tipi_relaxed",
    text: "I see myself as someone who is relaxed and handles stress well.",
    kind: "likert5",
    mapsTo: { type: "tipi" },
    options: LIKERT_5,
  },
  {
    id: "tipi_few_artistic",
    text: "I see myself as someone who has few artistic interests.",
    kind: "likert5",
    mapsTo: { type: "tipi" },
    options: LIKERT_5,
  },
  {
    id: "tipi_outgoing",
    text: "I see myself as someone who is outgoing and sociable.",
    kind: "likert5",
    mapsTo: { type: "tipi" },
    options: LIKERT_5,
  },
  {
    id: "tipi_fault",
    text: "I see myself as someone who tends to find fault with others.",
    kind: "likert5",
    mapsTo: { type: "tipi" },
    options: LIKERT_5,
  },
  {
    id: "tipi_thorough",
    text: "I see myself as someone who does a thorough job.",
    kind: "likert5",
    mapsTo: { type: "tipi" },
    options: LIKERT_5,
  },
  {
    id: "tipi_nervous",
    text: "I see myself as someone who gets nervous easily.",
    kind: "likert5",
    mapsTo: { type: "tipi" },
    options: LIKERT_5,
  },
  {
    id: "tipi_imagination",
    text: "I see myself as someone who has an active imagination.",
    kind: "likert5",
    mapsTo: { type: "tipi" },
    options: LIKERT_5,
  },
  {
    id: "persona",
    text: "Primary Persona: Which of the following best describes you?",
    kind: "choice",
    mapsTo: { type: "persona" },
    options: [
      { label: "Deal Hunter", value: "Deal Hunter" },
      { label: "Researcher", value: "Researcher" },
      { label: "Need-based", value: "Need-based" },
      { label: "Entertainment", value: "Entertainment" },
      { label: "Gift Buying", value: "Gift Buying" },
      { label: "Minimalist", value: "Minimalist" },
    ],
  },
  {
    id: "self_mood",
    text: "How would you describe your emotional state RIGHT NOW?",
    kind: "choice",
    mapsTo: { type: "self_mood" },
    options: [
      { label: "Bored", value: "Bored" },
      { label: "Excited", value: "Excited" },
      { label: "Frustrated", value: "Frustrated" },
      { label: "Happy", value: "Happy" },
      { label: "Neutral", value: "Neutral" },
      { label: "Relaxed", value: "Relaxed" },
      { label: "Sad", value: "Sad" },
      { label: "Stressed", value: "Stressed" },
    ],
  },
];

function rev5(score: number): number {
  return 6 - score;
}

function num(answers: Record<string, string>, id: string): number | null {
  const v = Number(answers[id]);
  return Number.isFinite(v) && v >= 1 && v <= 5 ? v : null;
}

function levelFromScore(score: number): TraitLevel {
  return score > 3 ? "High" : "Low";
}

export type DerivedProfile = {
  surveyPersona: SurveyPersona | null;
  persona: PersonaId | null;
  traits: Partial<Record<TraitName, TraitLevel>>;
  traitScores: Partial<Record<TraitName, number>>;
  selfReportedMood: GuidelineMood | null;
};

export function deriveProfileFromAnswers(
  answers: Record<string, string>
): DerivedProfile {
  const reserved = num(answers, "tipi_reserved");
  const trusting = num(answers, "tipi_trusting");
  const lazy = num(answers, "tipi_lazy");
  const relaxed = num(answers, "tipi_relaxed");
  const fewArtistic = num(answers, "tipi_few_artistic");
  const outgoing = num(answers, "tipi_outgoing");
  const fault = num(answers, "tipi_fault");
  const thorough = num(answers, "tipi_thorough");
  const nervous = num(answers, "tipi_nervous");
  const imagination = num(answers, "tipi_imagination");

  const traitScores: Partial<Record<TraitName, number>> = {};
  const traits: Partial<Record<TraitName, TraitLevel>> = {};

  if (outgoing != null && reserved != null) {
    traitScores.Extraversion = (outgoing + rev5(reserved)) / 2;
    traits.Extraversion = levelFromScore(traitScores.Extraversion);
  }
  if (trusting != null && fault != null) {
    traitScores.Agreeableness = (trusting + rev5(fault)) / 2;
    traits.Agreeableness = levelFromScore(traitScores.Agreeableness);
  }
  if (thorough != null && lazy != null) {
    traitScores.Conscientiousness = (thorough + rev5(lazy)) / 2;
    traits.Conscientiousness = levelFromScore(traitScores.Conscientiousness);
  }
  if (nervous != null && relaxed != null) {
    traitScores.Neuroticism = (nervous + rev5(relaxed)) / 2;
    traits.Neuroticism = levelFromScore(traitScores.Neuroticism);
  }
  if (imagination != null && fewArtistic != null) {
    traitScores.Openness = (imagination + rev5(fewArtistic)) / 2;
    traits.Openness = levelFromScore(traitScores.Openness);
  }

  const surveyRaw = answers.persona as SurveyPersona | undefined;
  const surveyPersona =
    surveyRaw && surveyRaw in SURVEY_PERSONA_TO_GUIDELINE
      ? (surveyRaw as SurveyPersona)
      : null;
  const persona = surveyPersona
    ? SURVEY_PERSONA_TO_GUIDELINE[surveyPersona]
    : null;

  const selfMoodRaw = answers.self_mood;
  const selfReportedMood =
    selfMoodRaw &&
    [
      "Bored",
      "Excited",
      "Frustrated",
      "Happy",
      "Neutral",
      "Relaxed",
      "Sad",
      "Stressed",
    ].includes(selfMoodRaw)
      ? (selfMoodRaw as GuidelineMood)
      : null;

  return {
    surveyPersona,
    persona,
    traits,
    traitScores,
    selfReportedMood,
  };
}

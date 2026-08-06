/**
 * LLM provider selection.
 * Thesis default: OpenAI when LLM_PROVIDER=openai + OPENAI_API_KEY are set.
 */

export type LlmProvider = "gemini" | "openai";

export function resolveLlmProvider(
  override?: LlmProvider
): LlmProvider {
  if (override) return override;
  const fromEnv = (process.env.LLM_PROVIDER ?? "").toLowerCase().trim();
  if (fromEnv === "openai" || fromEnv === "gemini") return fromEnv;

  // Auto: prefer whichever key is present
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  if (process.env.GEMINI_API_KEY?.trim()) return "gemini";
  return "openai";
}

export function resolveModel(provider: LlmProvider, override?: string): string {
  if (override) return override.trim();
  if (provider === "openai") {
    return process.env.OPENAI_MODEL?.trim() || "gpt-5.6-luna";
  }
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
}

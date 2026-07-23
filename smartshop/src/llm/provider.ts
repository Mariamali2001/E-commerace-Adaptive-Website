/**
 * Offline LLM provider selection.
 * Default: Gemini for testing. Switch to OpenAI later with LLM_PROVIDER=openai.
 */

export type LlmProvider = "gemini" | "openai";

export function resolveLlmProvider(
  override?: LlmProvider
): LlmProvider {
  if (override) return override;
  const fromEnv = (process.env.LLM_PROVIDER ?? "").toLowerCase().trim();
  if (fromEnv === "openai" || fromEnv === "gemini") return fromEnv;

  // Auto: prefer whichever key is present; default intent = Gemini
  if (process.env.GEMINI_API_KEY?.trim()) return "gemini";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  return "gemini";
}

export function resolveModel(provider: LlmProvider, override?: string): string {
  if (override) return override;
  if (provider === "openai") {
    return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  }
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
}

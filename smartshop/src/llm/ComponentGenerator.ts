import { buildVariantPrompt } from "./PromptBuilder";
import { validateGeneratedCode } from "./ComponentValidator";
import { estimateCostUsd } from "./cost";
import {
  resolveLlmProvider,
  resolveModel,
  type LlmProvider,
} from "./provider";
import type { GenerationResult, VariantRequest } from "./LLMTypes";

type OpenAIChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
};

export type GenerateOpts = {
  provider?: LlmProvider;
  model?: string;
  apiKey?: string;
};

/**
 * Offline-only: generate ONE component variant via Gemini or OpenAI.
 * Never used on the live shop render path.
 */
export async function generateVariantWithLLM(
  request: VariantRequest,
  opts?: GenerateOpts
): Promise<Omit<GenerationResult, "cacheHit" | "source"> & { raw?: string }> {
  const provider = resolveLlmProvider(opts?.provider);
  const model = resolveModel(provider, opts?.model);
  const { system, user } = buildVariantPrompt(request);
  const started = Date.now();

  const raw =
    provider === "openai"
      ? await callOpenAI({ system, user, model, apiKey: opts?.apiKey })
      : await callGemini({ system, user, model, apiKey: opts?.apiKey });

  const validated = validateGeneratedCode(raw.text);
  if (!validated.ok) {
    throw new Error(`Validation failed: ${validated.errors.join("; ")}`);
  }

  return {
    componentName: request.componentName,
    variantId: request.variantId,
    code: validated.code,
    model: raw.model ?? `${provider}:${model}`,
    promptTokens: raw.promptTokens,
    completionTokens: raw.completionTokens,
    totalTokens: raw.totalTokens,
    durationMs: Date.now() - started,
  };
}

async function callGemini(input: {
  system: string;
  user: string;
  model: string;
  apiKey?: string;
}): Promise<{
  text: string;
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
}> {
  const apiKey = input.apiKey ?? process.env.GEMINI_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local (Google AI Studio). Live shop does not need this key."
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(input.model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: input.system }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: input.user }],
        },
      ],
      generationConfig: {
        temperature: 0,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini error ${res.status}: ${text.slice(0, 400)}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ??
    "";

  return {
    text,
    model: `gemini:${input.model}`,
    promptTokens: data.usageMetadata?.promptTokenCount ?? null,
    completionTokens: data.usageMetadata?.candidatesTokenCount ?? null,
    totalTokens: data.usageMetadata?.totalTokenCount ?? null,
  };
}

async function callOpenAI(input: {
  system: string;
  user: string;
  model: string;
  apiKey?: string;
}): Promise<{
  text: string;
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
}> {
  const apiKey = input.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error(
      "OPENAI_API_KEY is not set. Switch LLM_PROVIDER=openai only after adding the key."
    );
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      temperature: 0,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${text.slice(0, 400)}`);
  }

  const data = (await res.json()) as OpenAIChatResponse;
  return {
    text: data.choices?.[0]?.message?.content ?? "",
    model: data.model ?? `openai:${input.model}`,
    promptTokens: data.usage?.prompt_tokens ?? null,
    completionTokens: data.usage?.completion_tokens ?? null,
    totalTokens: data.usage?.total_tokens ?? null,
  };
}

export function costFromResult(result: {
  model: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
}): number | null {
  if (result.promptTokens == null || result.completionTokens == null) return null;
  return estimateCostUsd({
    model: result.model,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
  });
}

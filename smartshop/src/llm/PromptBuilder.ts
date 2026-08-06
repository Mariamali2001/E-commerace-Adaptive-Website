import type { SupportedComponent, VariantRequest } from "./LLMTypes";
import { ADAPTIVE_COMPONENT_NAMES } from "./componentNames";

const SYSTEM_PROMPT = `You are an expert React/TypeScript implementer.

The Adaptive Engine has already finalized every UI decision.
Implement the supplied configuration exactly — do not redesign, recommend, infer, or invent UI.
Do not use personality, mood, persona, or device (already processed upstream).

Output only valid React TypeScript (Tailwind utilities; next/link OK).
No markdown, no explanations.`;

/**
 * Deterministic prompt from ImplementationSpec decisions only.
 * Never pass FinalUIConfiguration, persona, mood, or device here.
 */
export function buildVariantPrompt(request: VariantRequest): {
  system: string;
  user: string;
} {
  const adaptiveName = ADAPTIVE_COMPONENT_NAMES[request.componentName];
  const namedExport = exportName(request.componentName, request.variantId);
  // Compact JSON — fewer prompt tokens than pretty-printed decisions
  const decisionJson = JSON.stringify(request.decisions);

  const user = `Generate ONLY ${adaptiveName}.tsx
Family: ${request.componentName}
Variant: ${request.variantId}
Decisions (implement exactly — each value is the full survey option; honor the text in parentheses as the visual spec): ${decisionJson}

- Export named function: ${namedExport}
- Minimal typed props for ${request.componentName}
- No imports from @/llm, @/lib/adaptiveEngine, or @/lib/context
- No mood/persona/traits/device; no markdown or explanations`;

  return { system: SYSTEM_PROMPT, user };
}

export function exportName(
  componentName: SupportedComponent,
  variantId: string
): string {
  const parts = variantId.split("_").filter(Boolean);
  const pascal = parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  return `${pascal}${componentName}`;
}

export { SYSTEM_PROMPT };

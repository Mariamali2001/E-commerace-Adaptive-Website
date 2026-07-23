import type { SupportedComponent, VariantRequest } from "./LLMTypes";

const SYSTEM_PROMPT = `You are an expert React and TypeScript developer.

The adaptive interface has already been designed by a rule-based Adaptive Engine.
Every UI decision has been validated from survey guidelines.

Do NOT redesign anything.
Do NOT recommend anything.
Do NOT invent new UI decisions, colors, layouts, or components.
Do NOT mention mood, persona, traits, or survey data.

Implement the supplied configuration exactly as a single React TypeScript component variant.
Use Tailwind CSS utility classes.
Use existing project patterns: "use client" only if needed, lucide-react sparingly, next/link when linking.
Return ONLY valid TypeScript/TSX code — no markdown fences, no explanations.`;

/**
 * Build a deterministic prompt for offline variant generation.
 * Input is ImplementationSpec decisions only — never raw context.
 */
export function buildVariantPrompt(request: VariantRequest): {
  system: string;
  user: string;
} {
  const decisionJson = JSON.stringify(request.decisions, null, 2);

  const user = `Generate ONE React TypeScript variant component.

Component family: ${request.componentName}
Variant id: ${request.variantId}

Implementation decisions (already finalized — implement exactly):
${decisionJson}

Requirements:
- Export a named function component: ${exportName(request.componentName, request.variantId)}
- Props: use a minimal typed props interface appropriate for ${request.componentName}
- Do not import from @/llm or adaptive engine modules
- Do not hardcode mood/persona
- Realize ONLY the decisions above (e.g. button_style Rounded → rounded classes)
- No markdown, no comments that suggest alternative designs`;

  return { system: SYSTEM_PROMPT, user };
}

export function exportName(componentName: SupportedComponent, variantId: string): string {
  const parts = variantId.split("_").filter(Boolean);
  const pascal = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
  return `${pascal}${componentName}`;
}

export { SYSTEM_PROMPT };

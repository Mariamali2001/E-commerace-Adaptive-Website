import type { ValidationResult } from "./LLMTypes";

const FORBIDDEN_IMPORT_SNIPPETS = [
  "@/lib/adaptiveEngine",
  "@/lib/context",
  "@/guidelines/",
  "openai",
  "fs",
  "child_process",
  "eval(",
  "Function(",
  "dangerouslySetInnerHTML",
];

const FORBIDDEN_CONTENT = [
  "persona",
  "mood:",
  "Big Five",
  "TIPI",
  "survey",
  "I recommend",
  "you should",
  "consider using",
];

/**
 * Strip markdown fences and validate that output looks like code-only TSX.
 * Does not run tsc — structural safety for offline generation.
 */
export function validateGeneratedCode(raw: string): ValidationResult {
  const errors: string[] = [];
  let code = raw.trim();

  if (!code) {
    return { ok: false, errors: ["Empty response"] };
  }

  // Strip accidental markdown fences
  if (code.startsWith("```")) {
    code = code.replace(/^```(?:tsx|ts|jsx|javascript|typescript)?\s*/i, "");
    code = code.replace(/\s*```$/i, "").trim();
  }

  if (/^#{1,6}\s|^\*\*|here(?:'s| is) the/i.test(code)) {
    errors.push("Response looks like explanation/markdown, not code-only");
  }

  if (!/\bexport\s+(default\s+)?(function|const|class)\b/.test(code)) {
    errors.push("Missing exported React component");
  }

  if (!(/return\s*\(|return\s+</.test(code) || /=>\s*\(/.test(code))) {
    errors.push("No JSX return detected");
  }

  const lower = code.toLowerCase();
  for (const snippet of FORBIDDEN_IMPORT_SNIPPETS) {
    if (code.includes(snippet)) {
      errors.push(`Forbidden import/API: ${snippet}`);
    }
  }

  for (const word of FORBIDDEN_CONTENT) {
    if (lower.includes(word.toLowerCase())) {
      // Allow CSS class names that accidentally contain substrings — only flag as soft?
      // persona in comments is bad; skip very short matches in identifiers by requiring word-ish
      if (word.length <= 4) continue;
      errors.push(`Forbidden design/context content: ${word}`);
    }
  }

  // Unbalanced braces (rough)
  const opens = (code.match(/{/g) || []).length;
  const closes = (code.match(/}/g) || []).length;
  if (opens !== closes) {
    errors.push("Unbalanced braces");
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, code };
}

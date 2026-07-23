import fs from "fs";
import path from "path";
import type { LLMLogEntry } from "./LLMTypes";

const memoryLogs: LLMLogEntry[] = [];

function logFile(): string {
  return path.join(process.cwd(), ".llm-cache", "llm-generation.log.jsonl");
}

/**
 * Persist offline generation metrics (tokens, time, cache hit/miss, cost).
 */
export class LLMLogger {
  log(entry: LLMLogEntry): void {
    memoryLogs.push(entry);
    try {
      const dir = path.dirname(logFile());
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(logFile(), `${JSON.stringify(entry)}\n`, "utf8");
    } catch (err) {
      console.warn("[LLMLogger] write skipped:", err);
    }
  }

  recent(limit = 50): LLMLogEntry[] {
    return memoryLogs.slice(-limit);
  }
}

export const llmLogger = new LLMLogger();

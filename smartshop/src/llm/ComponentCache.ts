import { createHash } from "crypto";
import fs from "fs";
import path from "path";

type CacheRecord = {
  key: string;
  componentName: string;
  variantId: string;
  code: string;
  createdAt: string;
};

const memory = new Map<string, CacheRecord>();

function cacheDir(): string {
  return path.join(process.cwd(), ".llm-cache");
}

function filePathFor(key: string): string {
  const safe = createHash("sha256").update(key).digest("hex").slice(0, 32);
  return path.join(cacheDir(), `${safe}.json`);
}

/**
 * Disk + memory cache for generated variant source.
 * Same FinalUIConfiguration / variant → reuse, never re-call LLM.
 */
export class ComponentCache {
  get(key: string): CacheRecord | null {
    const mem = memory.get(key);
    if (mem) return mem;
    try {
      const fp = filePathFor(key);
      if (!fs.existsSync(fp)) return null;
      const raw = fs.readFileSync(fp, "utf8");
      const parsed = JSON.parse(raw) as CacheRecord;
      memory.set(key, parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  set(entry: Omit<CacheRecord, "createdAt"> & { createdAt?: string }): CacheRecord {
    const record: CacheRecord = {
      ...entry,
      createdAt: entry.createdAt ?? new Date().toISOString(),
    };
    memory.set(entry.key, record);
    try {
      const dir = cacheDir();
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePathFor(entry.key), JSON.stringify(record, null, 2), "utf8");
    } catch (err) {
      console.warn("[ComponentCache] disk write skipped:", err);
    }
    return record;
  }

  has(key: string): boolean {
    return this.get(key) != null;
  }
}

export const componentCache = new ComponentCache();

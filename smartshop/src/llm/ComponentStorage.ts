import fs from "fs";
import path from "path";
import type { SupportedComponent } from "./LLMTypes";
import { ADAPTIVE_COMPONENT_NAMES, adaptiveFileName } from "./componentNames";

export type StoredComponentRecord = {
  configurationHash: string;
  componentName: SupportedComponent;
  adaptiveName: string;
  variantId: string;
  relativePath: string;
  code: string;
  source: "catalog" | "cache" | "llm" | "mongo";
  model: string | null;
  createdAt: string;
  modulePath?: string | null;
};

type RegistryFile = {
  version: 1;
  components: Record<string, StoredComponentRecord>;
};

function rootDir(): string {
  return path.join(process.cwd(), "generated_components");
}

function registryPath(): string {
  return path.join(rootDir(), "registry.json");
}

function registryKey(
  componentName: SupportedComponent,
  configurationHash: string
): string {
  return `${componentName}:${configurationHash}`;
}

function readRegistry(): RegistryFile {
  try {
    const fp = registryPath();
    if (!fs.existsSync(fp)) return { version: 1, components: {} };
    const raw = JSON.parse(fs.readFileSync(fp, "utf8")) as RegistryFile;
    return {
      version: 1,
      components: raw.components ?? {},
    };
  } catch {
    return { version: 1, components: {} };
  }
}

function writeRegistry(reg: RegistryFile) {
  const dir = rootDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(registryPath(), JSON.stringify(reg, null, 2), "utf8");
}

/**
 * Persist generated React/TSX under generated_components/<AdaptiveName>/
 */
export class ComponentStorage {
  get(
    componentName: SupportedComponent,
    configurationHash: string
  ): StoredComponentRecord | null {
    const reg = readRegistry();
    const key = registryKey(componentName, configurationHash);
    const entry = reg.components[key];
    if (!entry) return null;

    const abs = path.join(process.cwd(), entry.relativePath);
    if (!fs.existsSync(abs)) return entry;

    try {
      const code = fs.readFileSync(abs, "utf8");
      return { ...entry, code };
    } catch {
      return entry;
    }
  }

  has(componentName: SupportedComponent, configurationHash: string): boolean {
    return this.get(componentName, configurationHash) != null;
  }

  save(input: {
    configurationHash: string;
    componentName: SupportedComponent;
    variantId: string;
    code: string;
    source: StoredComponentRecord["source"];
    model?: string | null;
    modulePath?: string | null;
  }): StoredComponentRecord {
    const adaptiveName = ADAPTIVE_COMPONENT_NAMES[input.componentName];
    const fileName = adaptiveFileName(
      input.componentName,
      input.configurationHash
    );
    const folder = path.join(rootDir(), adaptiveName);
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

    const abs = path.join(folder, fileName);
    fs.writeFileSync(abs, input.code, "utf8");

    const relativePath = path
      .join("generated_components", adaptiveName, fileName)
      .replace(/\\/g, "/");

    const record: StoredComponentRecord = {
      configurationHash: input.configurationHash,
      componentName: input.componentName,
      adaptiveName,
      variantId: input.variantId,
      relativePath,
      code: input.code,
      source: input.source,
      model: input.model ?? null,
      createdAt: new Date().toISOString(),
      modulePath: input.modulePath ?? null,
    };

    const reg = readRegistry();
    reg.components[registryKey(input.componentName, input.configurationHash)] =
      record;
    writeRegistry(reg);
    return record;
  }

  listForHash(configurationHash: string): StoredComponentRecord[] {
    const reg = readRegistry();
    return Object.values(reg.components).filter(
      (c) => c.configurationHash === configurationHash
    );
  }
}

export const componentStorage = new ComponentStorage();

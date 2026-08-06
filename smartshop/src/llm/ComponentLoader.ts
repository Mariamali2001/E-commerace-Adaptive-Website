import type { SupportedComponent } from "./LLMTypes";
import {
  componentStorage,
  type StoredComponentRecord,
} from "./ComponentStorage";
import { getCatalogModulePath } from "./variantCatalog";

export type LoadedComponent = {
  componentName: SupportedComponent;
  configurationHash: string;
  variantId: string;
  relativePath: string | null;
  modulePath: string | null;
  code: string | null;
  source: StoredComponentRecord["source"] | "missing";
  cacheHit: boolean;
};

/**
 * Load a previously generated (or catalog-registered) component by
 * configuration hash. Does not call the LLM.
 */
export function loadGeneratedComponent(
  componentName: SupportedComponent,
  configurationHash: string,
  variantId?: string
): LoadedComponent {
  const stored = componentStorage.get(componentName, configurationHash);
  if (stored) {
    return {
      componentName,
      configurationHash,
      variantId: stored.variantId,
      relativePath: stored.relativePath,
      modulePath: stored.modulePath ?? null,
      code: stored.code,
      source: stored.source,
      cacheHit: true,
    };
  }

  if (variantId) {
    const modulePath = getCatalogModulePath(componentName, variantId);
    if (modulePath) {
      return {
        componentName,
        configurationHash,
        variantId,
        relativePath: null,
        modulePath,
        code: null,
        source: "catalog",
        cacheHit: true,
      };
    }
  }

  return {
    componentName,
    configurationHash,
    variantId: variantId ?? "default",
    relativePath: null,
    modulePath: null,
    code: null,
    source: "missing",
    cacheHit: false,
  };
}

export function loadComponentsForConfiguration(
  configurationHash: string,
  componentNames: SupportedComponent[]
): LoadedComponent[] {
  return componentNames.map((name) =>
    loadGeneratedComponent(name, configurationHash)
  );
}

export { componentStorage };

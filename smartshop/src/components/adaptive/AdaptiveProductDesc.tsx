"use client";

import { useState } from "react";
import { useExperimentStore } from "@/store/experiment";
import { resolveVariants } from "@/lib/uiAdapter";
import { useAdaptiveAllowed } from "@/lib/experiment/useAdaptiveAllowed";
import { cn } from "@/lib/utils";

type Mode = "brief" | "moderate" | "expandable" | "detailed";

function resolveDescMode(variant: string | undefined): Mode {
  const id = (variant ?? "moderate").toLowerCase();
  if (id.includes("brief")) return "brief";
  if (id.includes("expandable") || id.includes("collapsible")) return "expandable";
  if (id.includes("detailed") || id.includes("full")) return "detailed";
  return "moderate";
}

/**
 * product_desc_length from Adaptive Engine → how much product copy is shown.
 */
export function AdaptiveProductDesc({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const { ready, allowed } = useAdaptiveAllowed();
  const uiConfig = useExperimentStore((s) => s.uiConfig);
  const [open, setOpen] = useState(false);

  const mode: Mode =
    ready && allowed && uiConfig
      ? resolveDescMode(resolveVariants(uiConfig).productDesc)
      : "moderate";

  const body = text?.trim() || "No description available.";

  if (mode === "detailed") {
    return (
      <p className={cn("max-w-prose text-sm text-neutral-600", className)} data-product-desc="detailed">
        {body}
      </p>
    );
  }

  if (mode === "brief") {
    const brief =
      body.length > 120 ? `${body.slice(0, 120).trimEnd()}…` : body;
    return (
      <p className={cn("max-w-prose text-sm text-neutral-600", className)} data-product-desc="brief">
        {brief}
      </p>
    );
  }

  if (mode === "expandable") {
    const preview =
      body.length > 160 ? `${body.slice(0, 160).trimEnd()}…` : body;
    return (
      <div className={cn("max-w-prose text-sm text-neutral-600", className)} data-product-desc="expandable">
        <p>{open ? body : preview}</p>
        {body.length > 160 && (
          <button
            type="button"
            className="mt-1 text-xs font-semibold underline"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Show less" : "Show more"}
          </button>
        )}
      </div>
    );
  }

  // moderate — key details + expand if long
  const preview =
    body.length > 220 ? `${body.slice(0, 220).trimEnd()}…` : body;
  return (
    <div className={cn("max-w-prose text-sm text-neutral-600", className)} data-product-desc="moderate">
      <p>{open ? body : preview}</p>
      {body.length > 220 && (
        <button
          type="button"
          className="mt-1 text-xs font-semibold underline"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

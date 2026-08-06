"use client";

import { useState, type ReactNode } from "react";
import { useExperimentStore } from "@/store/experiment";
import { resolveVariants } from "@/lib/uiAdapter";
import { useAdaptiveAllowed } from "@/lib/experiment/useAdaptiveAllowed";
import { cn } from "@/lib/utils";

export type FilterPlacement =
  | "sidebar"
  | "top"
  | "modal"
  | "drawer"
  | "bottom_sheet"
  | "fullscreen";

export function resolveFilterPlacement(
  filtersVariant: string | undefined,
  persistentVariant?: string
): FilterPlacement {
  const id = (filtersVariant ?? "sidebar_left").toLowerCase();
  const persistent = (persistentVariant ?? "yes").toLowerCase();

  let placement: FilterPlacement = "sidebar";
  if (id.includes("top")) placement = "top";
  else if (id.includes("bottom")) placement = "bottom_sheet";
  else if (id.includes("full")) placement = "fullscreen";
  else if (id.includes("drawer")) placement = "drawer";
  else if (id.includes("modal")) placement = "modal";
  else placement = "sidebar";

  // persistent_filters = No → don't keep a permanent left sidebar
  if (placement === "sidebar" && (persistent.includes("no") || persistent === "0")) {
    return "drawer";
  }
  return placement;
}

function FilterOverlayShell({
  placement,
  open,
  onClose,
  children,
}: {
  placement: Exclude<FilterPlacement, "sidebar" | "top">;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  const panelClass =
    placement === "bottom_sheet"
      ? "absolute bottom-0 left-0 right-0 z-10 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl"
      : placement === "fullscreen"
        ? "absolute inset-0 z-10 overflow-y-auto bg-white p-5"
        : placement === "modal"
          ? "absolute left-1/2 top-1/2 z-10 max-h-[90vh] w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
          : "absolute right-0 top-0 z-10 h-full w-full max-w-sm overflow-y-auto bg-white p-5 shadow-xl"; // drawer

  return (
    <div
      className="fixed inset-0 z-50"
      data-filters-overlay={placement}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close filters"
        onClick={onClose}
      />
      <div className={panelClass}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Filters</h2>
          <button
            type="button"
            className="text-sm text-neutral-500"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/**
 * Shop chrome from filter_location + persistent_filters.
 * Desktop: sidebar / top / modal
 * Mobile: drawer / bottom sheet / fullscreen
 */
export function AdaptiveShopLayout({
  filters,
  grid,
}: {
  filters: ReactNode;
  grid: ReactNode;
}) {
  const { ready, allowed } = useAdaptiveAllowed();
  const uiConfig = useExperimentStore((s) => s.uiConfig);
  const [open, setOpen] = useState(false);

  const variants =
    ready && allowed && uiConfig ? resolveVariants(uiConfig) : null;
  const placement: FilterPlacement = variants
    ? resolveFilterPlacement(variants.filters, variants.persistentFilters)
    : "sidebar";

  if (placement === "top") {
    return (
      <div className="flex flex-col gap-5" data-filters-placement="top">
        {filters}
        {grid}
      </div>
    );
  }

  if (
    placement === "drawer" ||
    placement === "bottom_sheet" ||
    placement === "fullscreen" ||
    placement === "modal"
  ) {
    return (
      <div className="relative" data-filters-placement={placement}>
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            className="btn border border-neutral-200 bg-white text-neutral-900"
            onClick={() => setOpen(true)}
          >
            Filters
          </button>
        </div>
        {grid}
        <FilterOverlayShell
          placement={placement}
          open={open}
          onClose={() => setOpen(false)}
        >
          {filters}
        </FilterOverlayShell>
      </div>
    );
  }

  // Permanent sidebar (persistent Yes + sidebar location)
  return (
    <div
      className="flex flex-col gap-8 lg:flex-row lg:items-start"
      data-filters-placement="sidebar"
      data-persistent-filters="yes"
    >
      {filters}
      {grid}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useExperimentStore } from "@/store/experiment";
import { resolveVariants } from "@/lib/uiAdapter";
import { useAdaptiveAllowed } from "@/lib/experiment/useAdaptiveAllowed";
import { cn } from "@/lib/utils";

type CategoryMode = "visual_grid" | "text_list" | "dropdown" | "mega_menu";

function resolveCategoryMode(variant: string | undefined): CategoryMode {
  const id = (variant ?? "visual_grid").toLowerCase();
  if (id.includes("mega")) return "mega_menu";
  if (id.includes("dropdown")) return "dropdown";
  if (id.includes("text") || id.includes("list")) return "text_list";
  return "visual_grid";
}

const CATEGORIES = [
  {
    label: "Shop all",
    href: "/shop",
    image: "/images/prod1.jpg",
    subs: [
      { label: "New in", href: "/shop?new=week" },
      { label: "Trending", href: "/shop?filter=trending" },
    ],
  },
  {
    label: "On Sale",
    href: "/shop?sale=50",
    image: "/images/prod2.jpg",
    subs: [
      { label: "Up to 50% off", href: "/shop?sale=50" },
      { label: "Clearance", href: "/shop?sale=clearance" },
    ],
  },
  {
    label: "Bags",
    href: "/shop?category=bags",
    image: "/images/prod3.jpg",
    subs: [
      { label: "Tote", href: "/shop?category=tote" },
      { label: "Crossbody", href: "/shop?category=crossbody" },
    ],
  },
  {
    label: "Jewellery",
    href: "/shop?category=jewellery",
    image: "/images/prod4.jpg",
    subs: [
      { label: "Earrings", href: "/shop?category=earrings" },
      { label: "Necklaces", href: "/shop?category=necklaces" },
    ],
  },
  {
    label: "Accessories",
    href: "/shop?category=accessories",
    image: "/images/prod5.jpg",
    subs: [
      { label: "Hats", href: "/shop?category=hats" },
      { label: "Belts", href: "/shop?category=belts" },
    ],
  },
  {
    label: "Brands",
    href: "/shop?brand=nike",
    image: "/images/prod6.jpg",
    subs: [
      { label: "Nike", href: "/shop?brand=nike" },
      { label: "Adidas", href: "/shop?brand=adidas" },
    ],
  },
];

/**
 * Home category strip from Adaptive Engine category_display token.
 * Visual Grid / Text List / Dropdown / Mega Menu with Images.
 */
export function AdaptiveCategoryStrip() {
  const { ready, allowed } = useAdaptiveAllowed();
  const uiConfig = useExperimentStore((s) => s.uiConfig);
  const [open, setOpen] = useState(false);

  if (!ready || !allowed || !uiConfig) return null;

  const mode = resolveCategoryMode(resolveVariants(uiConfig).categories);

  if (mode === "text_list") {
    return (
      <section
        className="container py-6"
        data-categories="text_list"
      >
        <h2 className="mb-3 text-lg font-bold">Shop by category</h2>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {CATEGORIES.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                className="font-medium text-neutral-800 underline-offset-4 hover:underline"
              >
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (mode === "dropdown") {
    return (
      <section className="container py-6" data-categories="dropdown">
        <h2 className="mb-3 text-lg font-bold">Shop by category</h2>
        <label className="block max-w-sm text-sm">
          <span className="mb-1.5 block font-medium text-neutral-700">
            Categories
          </span>
          <select
            className="adaptive-field w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) window.location.href = e.target.value;
            }}
          >
            <option value="" disabled>
              Choose a category…
            </option>
            {CATEGORIES.map((c) => (
              <option key={c.href} value={c.href}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </section>
    );
  }

  if (mode === "mega_menu") {
    return (
      <section className="container py-6" data-categories="mega_menu">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Shop by category</h2>
          <button
            type="button"
            className="btn border border-neutral-200 bg-white text-sm text-neutral-900"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Hide categories" : "Browse categories"}
          </button>
        </div>
        {open && (
          <div className="mt-4 grid gap-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <div key={c.href} className="overflow-hidden rounded-xl border border-neutral-100">
                <Link href={c.href} className="block">
                  <div className="aspect-[16/9] overflow-hidden bg-neutral-100">
                    <img
                      src={c.image}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="px-3 pt-2 text-sm font-semibold">{c.label}</p>
                </Link>
                <ul className="space-y-1 px-3 pb-3 pt-1">
                  {c.subs.map((s) => (
                    <li key={s.href}>
                      <Link
                        href={s.href}
                        className="text-xs text-neutral-600 hover:text-neutral-900"
                      >
                        {s.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  // visual_grid (default)
  return (
    <section className="container py-6" data-categories="visual_grid">
      <h2 className="mb-4 text-lg font-bold">Shop by category</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {CATEGORIES.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className={cn(
              "group overflow-hidden rounded-xl border border-neutral-100 bg-white",
              "transition hover:border-neutral-300 hover:shadow-sm"
            )}
          >
            <div className="aspect-square overflow-hidden bg-neutral-100">
              <img
                src={c.image}
                alt=""
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            </div>
            <p className="px-2 py-2 text-center text-xs font-semibold text-neutral-900">
              {c.label}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

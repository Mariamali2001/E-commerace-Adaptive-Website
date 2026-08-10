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
    label: "Electronics",
    href: "/shop?category=electronics",
    image:
      "https://i.3dmodels.org/uploads/Apple/516_Apple_MacBook_Pro_2021_14_inch_Space_Gray/Apple_MacBook_Pro_2021_14_inch_Space_Gray_1000_0001.jpg",
    imageClass: "object-cover",
    subs: [
      { label: "Laptops", href: "/shop?category=electronics&search=macbook" },
      { label: "Phones", href: "/shop?category=electronics&search=iphone" },
    ],
  },
  {
    label: "Fashion",
    href: "/shop?category=fashion",
    image:
      "https://mediahub.coastfashion.com/bkk18061_beige_xl?qlt=70&w=549&ssz=true&dpr=2",
    imageClass: "object-cover",
    subs: [
      { label: "Blazers", href: "/shop?category=fashion&search=blazer" },
      { label: "Sneakers", href: "/shop?category=fashion&search=sneakers" },
    ],
  },
  {
    label: "Accessories",
    href: "/shop?category=accessories",
    image:
      "https://xcdn.next.co.uk/common/items/default/default/itemimages/3_4Ratio/product/lge/767397s6.jpg?im=Resize,width=750",
    imageClass: "object-cover",
    subs: [
      { label: "Bags", href: "/shop?category=accessories&search=bag" },
      { label: "Jewellery", href: "/shop?category=accessories&search=necklace" },
    ],
  },
  {
    label: "Beauty",
    href: "/shop?category=beauty",
    image:
      "https://i0.wp.com/ordinaryeg.com/wp-content/uploads/2023/09/rdn-ascorbyl-glucoside-solution-12pct-30ml-1.webp?fit=800%2C800&ssl=1",
    imageClass: "object-cover",
    subs: [
      { label: "Fragrance", href: "/shop?category=beauty&search=chanel" },
      { label: "Skincare", href: "/shop?category=beauty&search=serum" },
    ],
  },
  {
    label: "Home",
    href: "/shop?category=home",
    image:
      "https://www.ikea.com/ca/en/images/products/blidvaeder-table-lamp-off-white-ceramic-beige__1059592_pe849717_s5.jpg?f=s",
    imageClass: "object-cover",
    subs: [
      { label: "Lighting", href: "/shop?category=home&search=lamp" },
      { label: "Textiles", href: "/shop?category=home&search=blanket" },
    ],
  },
  {
    label: "Caps",
    href: "/shop?category=caps",
    image:
      "https://watchesprime.com/wp-content/uploads/2022/08/baseball-nike-cap-black-cotton-hat-size-heritage86.jpg",
    imageClass: "object-cover",
    subs: [
      { label: "Nike cap", href: "/shop?category=caps&search=nike" },
      { label: "All caps", href: "/shop?category=caps&view=all" },
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
      <section
        className="border-b border-neutral-200/60 bg-transparent py-10"
        data-categories="dropdown"
      >
        <div className="container">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 rounded-2xl border border-neutral-200/80 bg-white px-6 py-6 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:gap-10 sm:px-8">
            <div className="shrink-0 sm:max-w-[16rem]">
              <h2 className="whitespace-nowrap text-lg font-bold tracking-tight text-neutral-900">
                Shop by category
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Jump straight to a department
              </p>
            </div>
            <label className="block w-full text-sm sm:max-w-xs sm:flex-1">
              <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-500">
                Categories
              </span>
              <select
                className="adaptive-field w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm shadow-sm outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
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
          </div>
        </div>
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
                      className={cn("h-full w-full", c.imageClass)}
                    />
                  </div>
                  <p className="px-3 pt-2 text-sm font-semibold">{c.label}</p>
                </Link>
                <ul className="space-y-1 px-3 pb-3 pt-1">
                  {c.subs.map((s) => (
                    <li key={`${c.label}-${s.label}-${s.href}`}>
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
                className={cn(
                  "h-full w-full transition group-hover:scale-105",
                  c.imageClass
                )}
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

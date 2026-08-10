"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: (active: boolean) => ReactNode;
};

function iconClass(active: boolean) {
  return active ? "stroke-neutral-900" : "stroke-neutral-500";
}

const ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5.5h-5V21H5a1 1 0 0 1-1-1v-9.5Z"
          className={iconClass(active)}
          strokeWidth="1.75"
          strokeLinejoin="round"
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.12 : 0}
        />
      </svg>
    ),
  },
  {
    label: "Shop",
    href: "/shop",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4.5 8.5h15l-1.2 11.2a1.5 1.5 0 0 1-1.5 1.3H7.2a1.5 1.5 0 0 1-1.5-1.3L4.5 8.5Z"
          className={iconClass(active)}
          strokeWidth="1.75"
          strokeLinejoin="round"
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.12 : 0}
        />
        <path
          d="M8.5 8.5V7a3.5 3.5 0 0 1 7 0v1.5"
          className={iconClass(active)}
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Sale",
    href: "/shop?sale=50",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12.8 4.4 19.6 11.2a1.5 1.5 0 0 1 0 2.1l-6.4 6.4a1.5 1.5 0 0 1-2.1 0L4.3 12.9a1.5 1.5 0 0 1-.4-1V5.9A1.5 1.5 0 0 1 5.4 4.4h5.9c.4 0 .8.16 1.1.46Z"
          className={iconClass(active)}
          strokeWidth="1.75"
          strokeLinejoin="round"
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.12 : 0}
        />
        <circle
          cx="9"
          cy="9"
          r="1.15"
          className={active ? "fill-neutral-900" : "fill-neutral-500"}
        />
      </svg>
    ),
  },
  {
    label: "Mood",
    href: "/shop/mood",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect
          x="3.5"
          y="6.5"
          width="17"
          height="13"
          rx="2.5"
          className={iconClass(active)}
          strokeWidth="1.75"
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.12 : 0}
        />
        <path
          d="M8 6.5 9.2 4.5h5.6L16 6.5"
          className={iconClass(active)}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="12"
          cy="13"
          r="3.25"
          className={iconClass(active)}
          strokeWidth="1.75"
        />
      </svg>
    ),
  },
  {
    label: "Cart",
    href: "/shop/cart",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3.5 5.5h1.7l1.4 10.2a1.5 1.5 0 0 0 1.5 1.3h9.3a1.5 1.5 0 0 0 1.5-1.25L20.5 8H7"
          className={iconClass(active)}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? 0.12 : 0}
        />
        <circle
          cx="9.5"
          cy="19.5"
          r="1.25"
          className={active ? "fill-neutral-900" : "fill-neutral-500"}
        />
        <circle
          cx="16.5"
          cy="19.5"
          r="1.25"
          className={active ? "fill-neutral-900" : "fill-neutral-500"}
        />
      </svg>
    ),
  },
];

/** Mobile-style bottom navigation (guideline: Bottom Nav). */
export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Bottom navigation"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1">
        {ITEMS.map((item) => {
          const pathOnly = item.href.split("?")[0]!;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={[
                  "relative flex flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-[11px] tracking-wide transition-colors",
                  active
                    ? "font-semibold text-neutral-900"
                    : "font-medium text-neutral-500",
                ].join(" ")}
              >
                {active && (
                  <span
                    className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-neutral-900"
                    aria-hidden
                  />
                )}
                <span
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                    active ? "bg-neutral-100 text-neutral-900" : "text-neutral-500",
                  ].join(" ")}
                >
                  {item.icon(active)}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

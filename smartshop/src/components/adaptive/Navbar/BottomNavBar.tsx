"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { label: "Home", href: "/", icon: "⌂" },
  { label: "Shop", href: "/shop", icon: "▣" },
  { label: "Sale", href: "/shop?sale=50", icon: "%" },
  { label: "Mood", href: "/shop/mood", icon: "☺" },
  { label: "Cart", href: "/shop/cart", icon: "🛒" },
];

/** Mobile-style bottom navigation (guideline: Bottom Nav). */
export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Bottom navigation"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href.split("?")[0]!);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={[
                  "flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium",
                  active ? "text-neutral-900" : "text-neutral-500",
                ].join(" ")}
              >
                <span className="text-base leading-none" aria-hidden>
                  {item.icon}
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

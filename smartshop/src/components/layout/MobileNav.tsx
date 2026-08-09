"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { SearchBar } from "./SearchBar";
import { useAuthSession } from "@/lib/experiment/AdaptiveAuthProvider";

type NavLink = { label: string; href: string };

const PRIMARY_LINKS: NavLink[] = [
  { label: "Shop all", href: "/shop" },
  { label: "Electronics", href: "/shop?category=electronics" },
  { label: "Fashion", href: "/shop?category=fashion" },
  { label: "Accessories", href: "/shop?category=accessories" },
  { label: "Beauty", href: "/shop?category=beauty" },
  { label: "Home", href: "/shop?category=home" },
  { label: "Caps", href: "/shop?category=caps" },
  { label: "On Sale", href: "/shop?sale=50" },
  { label: "Mood camera", href: "/shop/mood" },
  { label: "Wishlist", href: "/shop/wishlist" },
  { label: "Cart", href: "/shop/cart" },
];

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileNav({ open, onClose }: MobileNavProps) {
  const [mounted, setMounted] = useState(false);
  const { user } = useAuthSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  // Portal to body — header backdrop-blur breaks position:fixed otherwise
  return createPortal(
    <div
      className="fixed inset-0 z-[100] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile menu"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close menu"
        onClick={onClose}
      />

      <aside className="absolute inset-y-0 right-0 flex h-[100dvh] w-[min(100vw,20rem)] max-w-full flex-col bg-white shadow-2xl animate-[slideInRight_0.22s_ease-out]">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-100 px-4">
          <span className="text-base font-bold text-neutral-900">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="shrink-0 border-b border-neutral-100 px-4 py-3">
          <SearchBar />
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {PRIMARY_LINKS.map((link) => (
            <Link
              key={link.href + link.label}
              href={link.href}
              onClick={onClose}
              className="block rounded-xl px-4 py-3.5 text-base font-medium text-neutral-900 hover:bg-neutral-50 active:bg-neutral-100"
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-4 border-t border-neutral-100 px-2 pt-4">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Account
            </p>
            {user ? (
              <>
                <p className="px-4 py-2 text-sm text-neutral-600">
                  Signed in as <strong>{user.name}</strong>
                </p>
                <Link
                  href="/profile"
                  onClick={onClose}
                  className="block rounded-xl px-4 py-3.5 text-base font-medium text-neutral-900 hover:bg-neutral-50"
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={onClose}
                  className="block rounded-xl px-4 py-3.5 text-base font-medium text-neutral-900 hover:bg-neutral-50"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={onClose}
                  className="mt-1 block rounded-xl bg-neutral-900 px-4 py-3.5 text-center text-base font-semibold text-white"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </aside>
    </div>,
    document.body
  );
}

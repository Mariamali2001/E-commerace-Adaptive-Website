// components/layout/UserMenu.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { isAdminEmailClient } from "@/lib/admin-email";
import { clearAdaptiveExperiment } from "@/lib/experiment/clearAdaptive";
import { useAuthSession } from "@/lib/experiment/AdaptiveAuthProvider";

export function UserMenu() {
  const { ready, user, clearUser } = useAuthSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      clearAdaptiveExperiment();
      clearUser();
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setIsOpen(false);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!ready) {
    return (
      <div className="hidden items-center gap-3 md:flex">
        <div className="h-9 w-28 animate-pulse rounded-xl bg-neutral-200" />
      </div>
    );
  }

  if (!user) {
    // Desktop only — mobile uses the menu drawer so the top bar stays clean
    return (
      <div className="hidden items-center gap-2 md:flex">
        <Link
          href="/auth/login"
          className="inline-flex h-9 items-center justify-center rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
        >
          Log in
        </Link>
        <Link
          href="/auth/signup"
          className="inline-flex h-9 items-center justify-center rounded-xl bg-neutral-900 px-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 transition-opacity hover:opacity-80"
        aria-label="User menu"
      >
        <div className="hidden flex-col items-end md:flex">
          <span className="text-sm font-medium">{user.name}</span>
          <span className="text-xs text-neutral-500">{user.email}</span>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
          {initials}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-neutral-200 bg-white py-2 shadow-xl">
          <div className="border-b border-neutral-100 px-4 py-3">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-neutral-500">{user.email}</p>
          </div>

          <div className="py-1">
            <Link
              href="/shop/wishlist"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm transition-colors hover:bg-neutral-50"
            >
              My Wishlist
            </Link>
            <Link
              href="/orders"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm transition-colors hover:bg-neutral-50"
            >
              My Orders
            </Link>
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm transition-colors hover:bg-neutral-50"
            >
              Profile Settings
            </Link>
            {isAdminEmailClient(user.email) && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm transition-colors hover:bg-neutral-50"
              >
                Admin experiment data
              </Link>
            )}
          </div>

          <div className="border-t border-neutral-100 pt-1">
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

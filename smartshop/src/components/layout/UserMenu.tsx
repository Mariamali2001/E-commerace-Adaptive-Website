// components/layout/UserMenu.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import { isAdminEmailClient } from "@/lib/adminEmail";

type User = {
  id: string;
  email: string;
  name: string;
};

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch current user
  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Close dropdown when clicking outside
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
      await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setIsOpen(false);
      // Force full page reload to clear session
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <div className="h-8 w-20 bg-neutral-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Link href="/auth/login" className="text-sm hover:text-neutral-600 transition-colors">
          Log in
        </Link>
        <Link href="/auth/signup" className="hidden md:inline-block text-sm hover:text-neutral-600 transition-colors">
          Sign up
        </Link>
      </>
    );
  }

  // Get initials for avatar
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
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        aria-label="User menu"
      >
        <div className="hidden md:flex flex-col items-end">
          <span className="text-sm font-medium">{user.name}</span>
          <span className="text-xs text-neutral-500">{user.email}</span>
        </div>
        <div className="h-10 w-10 rounded-full bg-neutral-900 text-white flex items-center justify-center font-semibold text-sm">
          {initials}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-neutral-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-neutral-100">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-neutral-500 truncate">{user.email}</p>
          </div>

          <div className="py-1">
            <Link
              href="/shop/wishlist"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm hover:bg-neutral-50 transition-colors"
            >
              My Wishlist
            </Link>
            <Link
              href="/orders"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm hover:bg-neutral-50 transition-colors"
            >
              My Orders
            </Link>
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm hover:bg-neutral-50 transition-colors"
            >
              Profile Settings
            </Link>
            {isAdminEmailClient(user.email) && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm hover:bg-neutral-50 transition-colors"
              >
                Admin experiment data
              </Link>
            )}
          </div>

          <div className="border-t border-neutral-100 pt-1">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


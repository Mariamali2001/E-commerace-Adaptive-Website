// components/layout/Header.tsx
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-neutral-100">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/logo.png" className="h-8 w-8" alt="" />
          <span className="font-bold">SMARTSHOPIING</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/">Shop</Link>
          <Link href="/">On Sale</Link>
          <Link href="/">New Arrivals</Link>
          <Link href="/">Brands</Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-2">
            <input className="w-56 outline-none text-sm" placeholder="What are you looking for?" />
            <span className="i-lucide-search" />
          </div>

          <Link href="/auth/login" className="text-sm">Log in</Link>
          <Link href="/auth/signup" className="hidden md:inline-block text-sm">Sign up</Link>
          <button aria-label="Cart" className="rounded-full border p-2">🛒</button>
        </div>
      </div>
    </header>
  );
}

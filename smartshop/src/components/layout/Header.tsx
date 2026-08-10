// components/layout/Header.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { MegaMenuTrigger } from "./MegaMenu";
import { SearchBar } from "./SearchBar";
import { UserMenu } from "./UserMenu";
import { MobileNav } from "./MobileNav";

export type HeaderVariant = "mega_menu" | "top_bar" | "fullscreen";

type HeaderProps = {
  /** Guideline-driven layout. Default mega_menu keeps prior behavior. */
  variant?: HeaderVariant;
  /** Slimmer bar when paired with bottom nav */
  compact?: boolean;
};

const CAT_IMG = {
  electronics:
    "https://i.3dmodels.org/uploads/Apple/516_Apple_MacBook_Pro_2021_14_inch_Space_Gray/Apple_MacBook_Pro_2021_14_inch_Space_Gray_1000_0001.jpg",
  fashion:
    "https://mediahub.coastfashion.com/bkk18061_beige_xl?qlt=70&w=549&ssz=true&dpr=2",
  accessories:
    "https://xcdn.next.co.uk/common/items/default/default/itemimages/3_4Ratio/product/lge/767397s6.jpg?im=Resize,width=750",
  beauty:
    "https://i0.wp.com/ordinaryeg.com/wp-content/uploads/2023/09/rdn-ascorbyl-glucoside-solution-12pct-30ml-1.webp?fit=800%2C800&ssl=1",
  home: "https://www.ikea.com/ca/en/images/products/blidvaeder-table-lamp-off-white-ceramic-beige__1059592_pe849717_s5.jpg?f=s",
  caps: "https://watchesprime.com/wp-content/uploads/2022/08/baseball-nike-cap-black-cotton-hat-size-heritage86.jpg",
};

const TOP_BAR_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Electronics", href: "/shop?category=electronics" },
  { label: "Fashion", href: "/shop?category=fashion" },
  { label: "On Sale", href: "/shop?sale=50" },
  { label: "Mood camera", href: "/shop/mood" },
];

/** Only categories that have products in the catalog */
const shopMenuColumns = [
  {
    title: "SHOP BY CATEGORY",
    items: [
      { label: "View all", href: "/shop" },
      { label: "Electronics", href: "/shop?category=electronics", image: CAT_IMG.electronics },
      { label: "Fashion", href: "/shop?category=fashion", image: CAT_IMG.fashion },
      { label: "Accessories", href: "/shop?category=accessories", image: CAT_IMG.accessories },
      { label: "Beauty", href: "/shop?category=beauty", image: CAT_IMG.beauty },
      { label: "Home", href: "/shop?category=home", image: CAT_IMG.home },
      { label: "Caps", href: "/shop?category=caps", image: CAT_IMG.caps },
    ],
  },
  {
    title: "MORE",
    items: [
      { label: "On sale", href: "/shop?sale=50" },
      { label: "New arrivals", href: "/shop?new=week" },
      { label: "Highest rated", href: "/shop?sort=rating" },
    ],
  },
  {
    title: "Featured",
    items: [],
    featured: {
      title: "SHOP ELECTRONICS",
      image: CAT_IMG.electronics,
      href: "/shop?category=electronics",
    },
  },
];

const brandsMenuColumns = [
  {
    title: "TECH",
    items: [
      { label: "Apple", href: "/shop?brand=apple" },
      { label: "Philips", href: "/shop?brand=philips" },
    ],
  },
  {
    title: "FASHION",
    items: [
      { label: "Nike", href: "/shop?brand=nike" },
      { label: "Adidas", href: "/shop?brand=adidas" },
      { label: "Zara", href: "/shop?brand=zara" },
    ],
  },
  {
    title: "BEAUTY & HOME",
    items: [
      { label: "Chanel", href: "/shop?brand=chanel" },
      { label: "MAC", href: "/shop?brand=mac" },
      { label: "CeraVe", href: "/shop?brand=cerave" },
      { label: "The Ordinary", href: "/shop?brand=ordinary" },
      { label: "IKEA", href: "/shop?brand=ikea" },
      { label: "H&M Home", href: "/shop?brand=h%26m" },
    ],
  },
];

const saleMenuColumns = [
  {
    title: "DISCOUNTS",
    items: [
      { label: "On sale", href: "/shop?sale=50" },
      { label: "View all deals", href: "/shop?sale=50" },
    ],
  },
  {
    title: "CATEGORIES ON SALE",
    items: [
      { label: "Electronics", href: "/shop?category=electronics&sale=50" },
      { label: "Fashion", href: "/shop?category=fashion&sale=50" },
      { label: "Accessories", href: "/shop?category=accessories&sale=50" },
      { label: "Beauty", href: "/shop?category=beauty&sale=50" },
      { label: "Home", href: "/shop?category=home&sale=50" },
      { label: "Caps", href: "/shop?category=caps&sale=50" },
    ],
  },
  {
    title: "Featured",
    items: [],
    featured: {
      title: "DEALS THIS WEEK",
      image: CAT_IMG.fashion,
      href: "/shop?sale=50",
    },
  },
];

const newArrivalsMenuColumns = [
  {
    title: "BROWSE",
    items: [
      { label: "View all", href: "/shop?new=week" },
      { label: "Electronics", href: "/shop?category=electronics" },
      { label: "Fashion", href: "/shop?category=fashion" },
      { label: "Accessories", href: "/shop?category=accessories" },
    ],
  },
  {
    title: "MORE",
    items: [
      { label: "Beauty", href: "/shop?category=beauty" },
      { label: "Home", href: "/shop?category=home" },
      { label: "Caps", href: "/shop?category=caps" },
    ],
  },
  {
    title: "Featured",
    items: [],
    featured: {
      title: "NEW IN BEAUTY",
      image: CAT_IMG.beauty,
      href: "/shop?category=beauty",
    },
  },
];

export function Header({
  variant = "mega_menu",
  compact = false,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const barH = compact ? "h-14" : "h-16";

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-neutral-200/70 bg-[color-mix(in_srgb,canvas_92%,transparent)] text-neutral-900 backdrop-blur"
      data-header-variant={variant}
    >
      <div className={`container flex ${barH} items-center justify-between gap-3 sm:gap-4`}>
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <img
            src="/images/logo.png"
            className={
              compact
                ? "h-10 w-10 shrink-0 sm:h-12 sm:w-12"
                : "h-14 w-14 shrink-0 sm:h-20 sm:w-20"
            }
            alt=""
          />
          <span className="truncate text-sm font-bold text-current sm:text-base">
            SMARTSHOPPING
          </span>
        </Link>

        {variant === "top_bar" ? (
          <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
            {TOP_BAR_LINKS.map((link) => (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="text-current opacity-90 hover:opacity-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : variant === "fullscreen" ? (
          <nav className="hidden md:block">
            <p className="text-xs text-neutral-500">
              Categories open full-screen from the menu
            </p>
          </nav>
        ) : (
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <MegaMenuTrigger label="Shop" columns={shopMenuColumns} />
            <MegaMenuTrigger label="On Sale" columns={saleMenuColumns} />
            <MegaMenuTrigger
              label="New Arrivals"
              columns={newArrivalsMenuColumns}
            />
            <MegaMenuTrigger label="Brands" columns={brandsMenuColumns} />
            <Link
              href="/shop/mood"
              className="font-medium text-current opacity-90 hover:opacity-100"
            >
              Mood camera
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-1.5 sm:gap-3">
          <div className="hidden md:block">
            <SearchBar />
          </div>

          {/* Auth stays in the drawer on compact mobile to avoid a cramped top bar */}
          <div className={compact ? "hidden md:block" : undefined}>
            <UserMenu />
          </div>

          <Link
            href="/shop/cart"
            aria-label="Cart"
            className={[
              "h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 transition hover:bg-neutral-50",
              // Bottom nav already has Cart on small screens
              compact ? "hidden md:inline-flex" : "inline-flex",
            ].join(" ")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M3.5 5.5h1.7l1.4 10.2a1.5 1.5 0 0 0 1.5 1.3h9.3a1.5 1.5 0 0 0 1.5-1.25L20.5 8H7"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9.5" cy="19.5" r="1.25" fill="currentColor" />
              <circle cx="16.5" cy="19.5" r="1.25" fill="currentColor" />
            </svg>
          </Link>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-sm transition hover:bg-neutral-800 md:hidden"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <span className="sr-only">Menu</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 7h14M5 12h14M5 17h10"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}

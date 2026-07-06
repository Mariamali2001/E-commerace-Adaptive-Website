// components/layout/Header.tsx
"use client";
import Link from "next/link";
import { MegaMenuTrigger } from "./MegaMenu";
import { SearchBar } from "./SearchBar";
import { UserMenu } from "./UserMenu";

const shopMenuColumns = [
  {
    title: "SHOP BY PRODUCT",
    items: [
      { label: "View all", href: "/shop" },
      { label: "New in", href: "/shop?filter=new" },
      { label: "Selling Fast", href: "/shop?filter=trending" },
      { label: "Hair Accessories", href: "/shop?category=hair" },
      { label: "Hats", href: "/shop?category=hats" },
      { label: "Gifts", href: "/shop?category=gifts" },
      { label: "Belts", href: "/shop?category=belts" },
      { label: "Caps", href: "/shop?category=caps" },
      { label: "Gloves", href: "/shop?category=gloves" },
      { label: "Scarves", href: "/shop?category=scarves" },
      { label: "Socks & Tights", href: "/shop?category=socks" },
    ],
  },
  {
    title: "SHOP BY BAGS",
    items: [
      { label: "View all", href: "/shop?category=bags", image: "/images/prod2.jpg" },
      { label: "Cross Body Bags", href: "/shop?category=crossbody", image: "/images/prod3.jpg" },
      { label: "Tote Bags", href: "/shop?category=tote", image: "/images/prod4.jpg" },
      { label: "Travel Bags", href: "/shop?category=travel", image: "/images/prod5.jpg" },
      { label: "Shoulder Bags", href: "/shop?category=shoulder", image: "/images/prod6.jpg" },
      { label: "Clutches", href: "/shop?category=clutches", image: "/images/prod7.jpg" },
    ],
  },
  {
    title: "SHOP BY JEWELLERY",
    items: [
      { label: "View all", href: "/shop?category=jewellery", image: "/images/prod1.jpg" },
      { label: "Earrings", href: "/shop?category=earrings", image: "/images/prod2.jpg" },
      { label: "Necklaces", href: "/shop?category=necklaces", image: "/images/prod3.jpg" },
      { label: "Rings", href: "/shop?category=rings", image: "/images/prod4.jpg" },
      { label: "Bracelets", href: "/shop?category=bracelets", image: "/images/prod5.jpg" },
      { label: "Plated & Sterling Jewellery", href: "/shop?category=sterling", image: "/images/prod6.jpg" },
    ],
  },
  {
    title: "Featured",
    items: [],
    featured: {
      title: "WINTER ACCESSORIES",
      image: "/images/prod7.jpg",
      href: "/shop?collection=winter",
    },
  },
];

const brandsMenuColumns = [
  {
    title: "TOP BRANDS",
    items: [
      { label: "Nike", href: "/shop?brand=nike" },
      { label: "Adidas", href: "/shop?brand=adidas" },
      { label: "Puma", href: "/shop?brand=puma" },
      { label: "Reebok", href: "/shop?brand=reebok" },
      { label: "Under Armour", href: "/shop?brand=underarmour" },
      { label: "New Balance", href: "/shop?brand=newbalance" },
    ],
  },
  {
    title: "LUXURY BRANDS",
    items: [
      { label: "Gucci", href: "/shop?brand=gucci" },
      { label: "Prada", href: "/shop?brand=prada" },
      { label: "Louis Vuitton", href: "/shop?brand=lv" },
      { label: "Chanel", href: "/shop?brand=chanel" },
      { label: "Dior", href: "/shop?brand=dior" },
    ],
  },
  {
    title: "STREETWEAR",
    items: [
      { label: "Supreme", href: "/shop?brand=supreme" },
      { label: "Off-White", href: "/shop?brand=offwhite" },
      { label: "Stussy", href: "/shop?brand=stussy" },
      { label: "Palace", href: "/shop?brand=palace" },
      { label: "BAPE", href: "/shop?brand=bape" },
    ],
  },
  {
    title: "AFFORDABLE",
    items: [
      { label: "H&M", href: "/shop?brand=hm" },
      { label: "Zara", href: "/shop?brand=zara" },
      { label: "Uniqlo", href: "/shop?brand=uniqlo" },
      { label: "Gap", href: "/shop?brand=gap" },
      { label: "Old Navy", href: "/shop?brand=oldnavy" },
    ],
  },
];

const saleMenuColumns = [
  {
    title: "DISCOUNTS",
    items: [
      { label: "Up to 50% Off", href: "/shop?sale=50" },
      { label: "Up to 70% Off", href: "/shop?sale=70" },
      { label: "Clearance", href: "/shop?sale=clearance" },
      { label: "Flash Deals", href: "/shop?sale=flash" },
    ],
  },
  {
    title: "CATEGORIES ON SALE",
    items: [
      { label: "Women's Sale", href: "/shop?sale=women" },
      { label: "Men's Sale", href: "/shop?sale=men" },
      { label: "Kids Sale", href: "/shop?sale=kids" },
      { label: "Accessories Sale", href: "/shop?sale=accessories" },
    ],
  },
  {
    title: "Featured",
    items: [],
    featured: {
      title: "SEASONAL SALE",
      image: "/images/prod1.jpg",
      href: "/shop?sale=seasonal",
    },
  },
];

const newArrivalsMenuColumns = [
  {
    title: "NEW THIS WEEK",
    items: [
      { label: "View All New", href: "/shop?new=week" },
      { label: "Women's New", href: "/shop?new=women" },
      { label: "Men's New", href: "/shop?new=men" },
      { label: "Kids New", href: "/shop?new=kids" },
    ],
  },
  {
    title: "TRENDING NOW",
    items: [
      { label: "Trending Products", href: "/shop?trending=products" },
      { label: "Popular Styles", href: "/shop?trending=styles" },
      { label: "Best Sellers", href: "/shop?trending=bestsellers" },
    ],
  },
  {
    title: "Featured",
    items: [],
    featured: {
      title: "NEW COLLECTION",
      image: "/images/prod2.jpg",
      href: "/shop?collection=new",
    },
  },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-neutral-100">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/images/logo.png" className="h-20 w-20" alt="" />
          <span className="font-bold">SMARTSHOPPING</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <MegaMenuTrigger label="Shop" columns={shopMenuColumns} />
          <MegaMenuTrigger label="On Sale" columns={saleMenuColumns} />
          <MegaMenuTrigger label="New Arrivals" columns={newArrivalsMenuColumns} />
          <MegaMenuTrigger label="Brands" columns={brandsMenuColumns} />
          <Link
            href="/shop/mood"
            className="font-medium text-neutral-800 hover:text-neutral-600"
          >
            Mood camera
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <SearchBar />
          </div>

          <UserMenu />
          <Link
            href="/shop/cart"
            aria-label="Cart"
            className="rounded-full border p-2 hover:bg-neutral-50 transition"
          >
            🛒
          </Link>
        </div>
      </div>
    </header>
  );
}

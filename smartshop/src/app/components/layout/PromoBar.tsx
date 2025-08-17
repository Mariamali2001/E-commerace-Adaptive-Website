// components/layout/PromoBar.tsx
export default function PromoBar() {
  return (
    <div className="bg-black text-white text-xs md:text-sm py-2 text-center">
      Summer Sale… OFF 50% <button className="underline font-semibold ml-1">ShopNow</button>
    </div>
  );
}

// components/layout/Header.tsx
import { Search, Heart, ShoppingCart, User } from "lucide-react";
export default function Header() {
  return (
    <header className="border-b">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
        <div className="font-black text-xl tracking-tight">SMARTSHOPPIING</div>
        <nav className="hidden md:flex gap-6 text-sm">
          <a>Shop</a><a>On Sale</a><a>New Arrivals</a><a>Brands</a>
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center bg-neutral-100 rounded-full px-3 h-10 w-72">
            <Search className="w-4 h-4" /><input className="bg-transparent outline-none ml-2 text-sm w-full" placeholder="What are you looking for?" />
          </div>
          <Heart className="w-5 h-5" /><ShoppingCart className="w-5 h-5" /><User className="w-5 h-5" />
        </div>
      </div>
    </header>
  );
}

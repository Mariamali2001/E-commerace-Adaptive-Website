// components/layout/MegaMenu.tsx
"use client";
import { useState } from "react";
import Link from "next/link";

type MenuItem = {
  label: string;
  href: string;
  image?: string;
};

type MenuColumn = {
  title: string;
  items: MenuItem[];
  featured?: {
    title: string;
    image: string;
    href: string;
  };
};

type MegaMenuProps = {
  label: string;
  columns: MenuColumn[];
};

export function MegaMenuTrigger({ label, columns }: MegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="text-sm text-current opacity-90 transition-colors hover:opacity-100">
        {label}
      </button>

      {isOpen && (
        <div className="absolute left-1/2 top-full -translate-x-1/2 pt-4 z-50">
          <div className="bg-white rounded-lg shadow-xl border border-neutral-200 p-8 min-w-[800px]">
            <div className="grid grid-cols-4 gap-8">
              {columns.map((column, idx) => (
                <div key={idx}>
                  {column.featured ? (
                    <Link href={column.featured.href} className="group block">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-lg mb-2">
                        <img
                          src={column.featured.image}
                          alt={column.featured.title}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <h3 className="absolute bottom-4 left-4 text-white font-bold text-lg uppercase">
                          {column.featured.title}
                        </h3>
                      </div>
                    </Link>
                  ) : (
                    <>
                      <h3 className="font-bold text-xs uppercase tracking-wider mb-4 text-neutral-900">
                        {column.title}
                      </h3>
                      <ul className="space-y-3">
                        {column.items.map((item, itemIdx) => (
                          <li key={itemIdx}>
                            <Link
                              href={item.href}
                              className="flex items-center gap-3 text-sm text-neutral-700 hover:text-neutral-900 transition-colors group"
                            >
                              {item.image && (
                                <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0">
                                  <img
                                    src={item.image}
                                    alt={item.label}
                                    className="h-full w-full object-cover transition group-hover:scale-110"
                                  />
                                </div>
                              )}
                              <span>{item.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


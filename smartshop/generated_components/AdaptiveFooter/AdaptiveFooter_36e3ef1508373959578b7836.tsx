import type { ReactNode } from "react";

export interface FooterProps {
  brand?: string;
  links?: Array<{ label: string; href: string }>;
  copyright?: string;
  children?: ReactNode;
  className?: string;
}

export function VibrantBoldFooter({
  brand = "Brand",
  links = [],
  copyright,
  children,
  className = "",
}: FooterProps) {
  return (
    <footer
      className={`border-t-4 border-fuchsia-500 bg-slate-950 text-white ${className}`}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xl font-black tracking-tight text-transparent bg-gradient-to-r from-fuchsia-400 via-orange-400 to-cyan-400 bg-clip-text">
            {brand}
          </span>
          {copyright && (
            <span className="text-xs font-medium text-slate-400">{copyright}</span>
          )}
        </div>

        {children}

        {links.length > 0 && (
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {links.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <a
                    href={link.href}
                    className="text-sm font-bold text-slate-200 transition-colors hover:text-cyan-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </footer>
  );
}
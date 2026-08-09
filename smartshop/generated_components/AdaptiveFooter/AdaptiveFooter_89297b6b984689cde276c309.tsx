import type { ReactNode } from "react";

type FooterProps = {
  children?: ReactNode;
  className?: string;
};

export function WarmEarthyFooter({
  children,
  className = "",
}: FooterProps) {
  return (
    <footer
      className={`border-t border-orange-900/20 bg-stone-900 text-amber-50 ${className}`}
    >
      <div className="mx-auto flex min-h-56 max-w-7xl items-center px-6 py-16 sm:px-8 lg:px-12">
        <div className="w-full">{children}</div>
      </div>
    </footer>
  );
}
type FooterLink = {
  label: string;
  href: string;
};

type VibrantBoldFooterProps = {
  brandName?: string;
  links?: FooterLink[];
  copyright?: string;
};

export function VibrantBoldFooter({
  brandName = "Your Brand",
  links = [],
  copyright = `© ${new Date().getFullYear()} ${brandName}. All rights reserved.`,
}: VibrantBoldFooterProps) {
  return (
    <footer className="relative overflow-hidden bg-gradient-to-br from-fuchsia-600 via-orange-500 to-yellow-400 px-6 py-10 text-white">
      <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl" />
      <div className="absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-violet-600/30 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <a
            href="/"
            className="text-2xl font-black tracking-tight text-white transition-opacity hover:opacity-80"
          >
            {brandName}
          </a>
          <p className="mt-2 text-sm font-medium text-white/80">{copyright}</p>
        </div>

        {links.length > 0 && (
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap gap-x-6 gap-y-3 sm:justify-end">
              {links.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <a
                    href={link.href}
                    className="font-semibold text-white transition-colors hover:text-cyan-100"
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
export interface FooterProps {
  className?: string;
}

export function VibrantBoldFooter({ className = "" }: FooterProps) {
  return (
    <footer
      className={`border-t-4 border-yellow-300 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-500 text-white ${className}`}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 sm:px-8 lg:px-10">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div className="max-w-sm">
            <a href="#" className="text-2xl font-black tracking-tight">
              Your Brand
            </a>
            <p className="mt-3 text-sm font-medium leading-6 text-white/85">
              Bold ideas, bright experiences, and energy that moves forward.
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap gap-x-7 gap-y-3 text-sm font-bold">
              <li>
                <a className="transition-colors hover:text-yellow-200" href="#">
                  About
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-yellow-200" href="#">
                  Services
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-yellow-200" href="#">
                  Contact
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-yellow-200" href="#">
                  Privacy
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/25 pt-6 text-sm font-medium text-white/80 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2025 Your Brand. All rights reserved.</p>
          <div className="flex gap-5">
            <a className="transition-colors hover:text-yellow-200" href="#">
              Instagram
            </a>
            <a className="transition-colors hover:text-yellow-200" href="#">
              LinkedIn
            </a>
            <a className="transition-colors hover:text-yellow-200" href="#">
              X
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
type FooterProps = {
  children?: React.ReactNode;
};

export function VibrantBoldFooter({ children }: FooterProps) {
  return (
    <footer className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(236,72,153,0.45),transparent_30%),radial-gradient(circle_at_85%_15%,rgba(34,211,238,0.4),transparent_28%),radial-gradient(circle_at_55%_100%,rgba(250,204,21,0.3),transparent_32%)]" />
      <div className="relative mx-auto flex min-h-[280px] max-w-7xl flex-col justify-between gap-12 px-6 py-16 sm:px-10 lg:px-16">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-black uppercase tracking-[0.2em] text-fuchsia-600 shadow-lg shadow-fuchsia-500/20">
              Stay connected
            </div>
            <div className="text-lg leading-8 text-white/75">{children}</div>
          </div>

          <div className="flex gap-3">
            <span className="h-12 w-12 rotate-6 rounded-2xl bg-fuchsia-500 shadow-lg shadow-fuchsia-500/30" />
            <span className="h-12 w-12 -rotate-6 rounded-2xl bg-cyan-400 shadow-lg shadow-cyan-400/30" />
            <span className="h-12 w-12 rotate-6 rounded-2xl bg-yellow-300 shadow-lg shadow-yellow-300/30" />
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/20 pt-6 text-sm font-medium text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} All rights reserved.</span>
          <div className="flex gap-6">
            <a className="transition-colors hover:text-cyan-300" href="#">
              Privacy
            </a>
            <a className="transition-colors hover:text-yellow-300" href="#">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
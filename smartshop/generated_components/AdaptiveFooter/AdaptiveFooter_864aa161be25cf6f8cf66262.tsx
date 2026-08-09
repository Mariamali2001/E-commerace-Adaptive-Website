type FooterProps = {
  children?: import("react").ReactNode;
};

export function DarkModeFooter({ children }: FooterProps) {
  return (
    <footer className="w-full border-t border-white/10 bg-gray-950 px-6 py-8 text-gray-100">
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </footer>
  );
}
import "@/app/globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PromoBar from "@/components/layout/PromoBar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body className="bg-white text-black">
      <PromoBar />
      <Header />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</main>
      <Footer />
    </body></html>
  );
}
import "./globals.css";
import type { Metadata } from "next";
import { PromoBar } from "@/components/layout/PromoBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <PromoBar />
        <Header />
        <main className="pb-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

export const metadata = {
  title: "SmartShopping",
  description: "Modern ecommerce PWA demo",
  manifest: "/manifest.json",
};
import React from "react";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ExperimentBrowseBannerHost } from "@/components/experiment/ExperimentBrowseBannerHost";
import { AdaptiveThemeProvider } from "@/components/adaptive/AdaptiveThemeProvider";
import { AdaptationBanner } from "@/components/adaptive/AdaptationBanner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col">
        <AdaptiveThemeProvider>
          <AdaptationBanner />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <ExperimentBrowseBannerHost />
        </AdaptiveThemeProvider>
      </body>
    </html>
  );
}
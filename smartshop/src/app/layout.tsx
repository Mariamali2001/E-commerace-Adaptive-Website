import React from "react";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { ExperimentBrowseBannerHost } from "@/components/experiment/ExperimentBrowseBannerHost";
import { AdaptiveThemeProvider } from "@/components/adaptive/AdaptiveThemeProvider";
import { AdaptationBanner } from "@/components/adaptive/AdaptationBanner";
import { AdaptiveUrgencyBanner } from "@/components/adaptive/AdaptiveUrgencyBanner";
import { AdaptiveNavbar } from "@/components/adaptive/AdaptiveNavbar";
import { AdaptiveAuthProvider } from "@/lib/experiment/AdaptiveAuthProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col">
        <AdaptiveAuthProvider>
          <AdaptiveThemeProvider>
            <AdaptationBanner />
            <AdaptiveNavbar />
            <AdaptiveUrgencyBanner />
            <main className="flex-1">{children}</main>
            <Footer />
            <ExperimentBrowseBannerHost />
          </AdaptiveThemeProvider>
        </AdaptiveAuthProvider>
      </body>
    </html>
  );
}

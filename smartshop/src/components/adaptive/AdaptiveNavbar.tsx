"use client";

import { Header } from "@/components/layout/Header";
import { BottomNavBar } from "@/components/adaptive/Navbar/BottomNavBar";
import { useExperimentStore } from "@/store/experiment";
import { resolveVariants } from "@/lib/uiAdapter";
import { useAdaptiveAllowed } from "@/lib/experiment/useAdaptiveAllowed";

export type NavVariant = "mega_menu" | "top_bar" | "bottom_nav" | "fullscreen";

function resolveNavVariant(raw: string): NavVariant {
  const id = raw.toLowerCase();
  if (id.includes("bottom")) return "bottom_nav";
  if (id.includes("full") || id.includes("drawer") || id.includes("hamburger")) {
    return "fullscreen";
  }
  if (id.includes("top")) return "top_bar";
  if (id.includes("mega") || id.includes("combination")) return "mega_menu";
  return "mega_menu";
}

/**
 * Picks a real nav layout from guideline navigation tokens.
 * Without adaptation → default mega-menu Header.
 */
export function AdaptiveNavbar() {
  const { ready, allowed } = useAdaptiveAllowed();
  const uiConfig = useExperimentStore((s) => s.uiConfig);
  const generatedBundle = useExperimentStore((s) => s.generatedBundle);

  if (!ready || !allowed || !uiConfig) {
    return <Header variant="mega_menu" />;
  }

  const v = resolveVariants(uiConfig);
  const fromBundle = generatedBundle?.components.find(
    (c) => c.componentName === "Navbar"
  )?.variantId;
  const nav = resolveNavVariant(fromBundle ?? v.navigation);

  if (nav === "bottom_nav") {
    return (
      <>
        <Header variant="top_bar" compact />
        <BottomNavBar />
        <div className="h-[4.25rem] md:hidden" aria-hidden />
      </>
    );
  }

  if (nav === "fullscreen") {
    return <Header variant="fullscreen" />;
  }

  if (nav === "top_bar") {
    return <Header variant="top_bar" />;
  }

  return <Header variant="mega_menu" />;
}

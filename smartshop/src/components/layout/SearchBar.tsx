// components/layout/SearchBar.tsx
"use client";
import { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useExperimentStore } from "@/store/experiment";
import { resolveVariants } from "@/lib/uiAdapter";
import { useAdaptiveAllowed } from "@/lib/experiment/useAdaptiveAllowed";

type SearchResult = {
  id: string;
  title: string;
  slug: string;
  price: number;
  image: string;
  category?: string;
};

type SearchMode = "always" | "icon" | "collapsible";

function resolveSearchMode(variant: string | undefined): SearchMode {
  const id = (variant ?? "always_visible_top").toLowerCase();
  if (id.includes("icon")) return "icon";
  if (id.includes("collapsible")) return "collapsible";
  return "always";
}

export function SearchBar() {
  const router = useRouter();
  const { ready, allowed } = useAdaptiveAllowed();
  const uiConfig = useExperimentStore((s) => s.uiConfig);
  const mode: SearchMode =
    ready && allowed && uiConfig
      ? resolveSearchMode(resolveVariants(uiConfig).search)
      : "always";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [expanded, setExpanded] = useState(mode === "always");
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setExpanded(mode === "always");
  }, [mode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        if (mode !== "always") setExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mode]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/products?search=${encodeURIComponent(query)}`
        );
        if (response.ok) {
          const data = await response.json();
          setResults(data.data.slice(0, 5));
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/shop?search=${encodeURIComponent(query)}`);
    setIsOpen(false);
  };

  const showField = mode === "always" || expanded;

  return (
    <div
      ref={searchRef}
      className="relative"
      data-search-mode={mode}
    >
      {!showField ? (
        <button
          type="button"
          aria-label="Open search"
          className="rounded-full border border-neutral-200 p-2 transition hover:bg-neutral-50"
          onClick={() => setExpanded(true)}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="relative">
          <div
            className={cn(
              "flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-2 focus-within:ring-2 focus-within:ring-neutral-900",
              mode === "always" ? "w-auto" : "w-56"
            )}
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(
                "outline-none text-sm bg-transparent",
                mode === "always" ? "w-56" : "w-full"
              )}
              placeholder="What are you looking for?"
              autoFocus={mode !== "always"}
            />
            <button type="submit" aria-label="Search" className="hover:opacity-70">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </form>
      )}

      {isOpen && showField && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-xl">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-neutral-500">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <>
              <ul className="py-2">
                {results.map((result) => (
                  <li key={result.id}>
                    <Link
                      href={`/shop/product/${result.slug}`}
                      onClick={() => {
                        setQuery("");
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50"
                    >
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                        <img
                          src={result.image}
                          alt={result.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {result.title}
                        </p>
                        <p className="text-xs text-neutral-500">
                          ${result.price.toFixed(2)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="border-t bg-neutral-50 p-3">
                <Link
                  href={`/shop?search=${encodeURIComponent(query)}`}
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-sm font-medium text-neutral-600 hover:text-neutral-900"
                >
                  View all results →
                </Link>
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-sm text-neutral-500">
              No results found for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// components/layout/SearchBar.tsx
"use client";
import { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

type SearchResult = {
  id: string;
  title: string;
  slug: string;
  price: number;
  image: string;
  category?: string;
};

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search products as user types (debounced)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.data.slice(0, 5)); // Show top 5 results
          setIsOpen(true);
          
          // Track search for adaptive UI
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("search:query", {
                detail: { query, resultsCount: data.data.length, timestamp: Date.now() },
              })
            );
          }
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Track search submission for adaptive UI
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("search:submit", {
          detail: { query, timestamp: Date.now() },
        })
      );
    }

    // Navigate to shop page with search query
    router.push(`/shop?search=${encodeURIComponent(query)}`);
    setIsOpen(false);
  };

  const handleResultClick = (slug: string) => {
    // Track result click for adaptive UI
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("search:result-click", {
          detail: { query, slug, timestamp: Date.now() },
        })
      );
    }
    
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-2 focus-within:ring-2 focus-within:ring-neutral-900">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-56 outline-none text-sm bg-transparent"
            placeholder="What are you looking for?"
          />
          <button type="submit" aria-label="Search" className="hover:opacity-70">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-neutral-200 max-h-96 overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-neutral-500">Searching...</div>
          ) : results.length > 0 ? (
            <>
              <div className="p-3 border-b bg-neutral-50">
                <p className="text-xs font-semibold text-neutral-600 uppercase">
                  {results.length} result{results.length !== 1 ? "s" : ""} found
                </p>
              </div>
              <ul className="py-2">
                {results.map((result) => (
                  <li key={result.id}>
                    <Link
                      href={`/shop/product/${result.slug}`}
                      onClick={() => handleResultClick(result.slug)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                        <img
                          src={result.image}
                          alt={result.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.title}</p>
                        <p className="text-xs text-neutral-500">
                          ${result.price.toFixed(2)}
                          {result.category && (
                            <span className="ml-2 text-neutral-400">• {result.category}</span>
                          )}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="p-3 border-t bg-neutral-50">
                <Link
                  href={`/shop?search=${encodeURIComponent(query)}`}
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-sm text-neutral-600 hover:text-neutral-900 font-medium"
                >
                  View all results →
                </Link>
              </div>
            </>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-neutral-500">No results found for "{query}"</p>
              <p className="text-xs text-neutral-400 mt-1">Try different keywords</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


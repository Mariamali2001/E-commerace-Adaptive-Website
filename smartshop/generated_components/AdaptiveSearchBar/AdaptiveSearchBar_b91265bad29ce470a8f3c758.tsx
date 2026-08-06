import { useEffect, useRef, useState } from "react";

export interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export function CollapsibleSearchBar({
  onSearch,
  placeholder = "Search",
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch?.(query);
  }

  function handleToggle() {
    setIsOpen((open) => !open);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2"
      role="search"
    >
      {isOpen && (
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
        />
      )}

      {isOpen && (
        <button
          type="submit"
          aria-label="Submit search"
          className="rounded-lg border border-gray-300 p-2 text-gray-700 transition-colors hover:bg-gray-100"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
        </button>
      )}

      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close search" : "Open search"}
        className="rounded-lg border border-gray-300 p-2 text-gray-700 transition-colors hover:bg-gray-100"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="h-5 w-5"
        >
          {isOpen ? (
            <>
              <path d="M6 6l12 12" />
              <path d="M18 6 6 18" />
            </>
          ) : (
            <>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </>
          )}
        </svg>
      </button>
    </form>
  );
}
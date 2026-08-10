type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
};

export function AlwaysVisibleTopSearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = "Search",
}: SearchBarProps) {
  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.(value);
      }}
      className="sticky top-0 z-10 w-full bg-white px-4 py-4"
    >
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center rounded-xl border border-gray-300 bg-white px-4 shadow-sm transition focus-within:border-gray-500 focus-within:ring-2 focus-within:ring-gray-200">
        <svg
          aria-hidden="true"
          className="mr-3 h-6 w-6 shrink-0 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
          />
        </svg>

        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label="Search"
          className="min-w-0 flex-1 bg-transparent text-lg text-gray-900 outline-none placeholder:text-gray-500"
        />

        <button
          type="submit"
          aria-label="Submit search"
          className="ml-3 rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
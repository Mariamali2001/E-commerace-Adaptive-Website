type FilterOption = {
  value: string;
  label: string;
};

export type FilterPanelProps = {
  filters: FilterOption[];
  selectedValue?: string;
  onChange: (value: string) => void;
};

export function TopBarFilterPanel({
  filters,
  selectedValue,
  onChange,
}: FilterPanelProps) {
  return (
    <div className="flex w-full items-center gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2">
      {filters.map((filter) => {
        const isSelected = filter.value === selectedValue;

        return (
          <button
            key={filter.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(filter.value)}
            className={[
              "shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isSelected
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200",
            ].join(" ")}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
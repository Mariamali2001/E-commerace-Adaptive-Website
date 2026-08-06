type FilterOption = {
  id: string;
  label: string;
  options: readonly {
    label: string;
    value: string;
  }[];
};

type FilterPanelProps = {
  filters: readonly FilterOption[];
  values?: Record<string, string>;
  onChange?: (filterId: string, value: string) => void;
};

export function TopBarFilterPanel({
  filters,
  values = {},
  onChange,
}: FilterPanelProps) {
  return (
    <div className="w-full overflow-x-auto border-b border-slate-200 bg-white">
      <div className="flex min-w-max items-center gap-3 px-4 py-3">
        {filters.map((filter) => (
          <label
            key={filter.id}
            className="flex items-center gap-2 whitespace-nowrap text-sm font-medium text-slate-700"
          >
            <span>{filter.label}</span>
            <select
              value={values[filter.id] ?? ""}
              onChange={(event) => onChange?.(filter.id, event.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">All</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}
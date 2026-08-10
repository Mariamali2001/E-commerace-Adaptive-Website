type FilterOption = {
  label: string;
  value: string;
  count?: number;
};

type FilterGroup = {
  id: string;
  label: string;
  options: FilterOption[];
  multiple?: boolean;
};

export type FilterPanelProps = {
  filters: FilterGroup[];
  selected: Record<string, string[]>;
  onChange: (groupId: string, value: string, checked: boolean) => void;
  onClear?: () => void;
  className?: string;
};

export function SidebarLeftFilterPanel({
  filters,
  selected,
  onChange,
  onClear,
  className = "",
}: FilterPanelProps) {
  return (
    <aside
      aria-labelledby="filter-panel-title"
      className={`h-full w-72 shrink-0 border-r border-slate-200 bg-white ${className}`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2
          id="filter-panel-title"
          className="text-base font-semibold text-slate-900"
        >
          Filters
        </h2>

        {onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            Clear all
          </button>
        ) : null}
      </div>

      <div className="space-y-6 p-5">
        {filters.map((filter) => {
          const values = selected[filter.id] ?? [];

          return (
            <fieldset key={filter.id} className="space-y-3">
              <legend className="text-sm font-semibold text-slate-900">
                {filter.label}
              </legend>

              <div className="space-y-2">
                {filter.options.map((option) => {
                  const checked = values.includes(option.value);
                  const inputId = `filter-${filter.id}-${option.value}`;

                  return (
                    <label
                      key={option.value}
                      htmlFor={inputId}
                      className="flex cursor-pointer items-center gap-3 text-sm text-slate-700"
                    >
                      <input
                        id={inputId}
                        name={filter.multiple ? undefined : filter.id}
                        type={filter.multiple ? "checkbox" : "radio"}
                        value={option.value}
                        checked={checked}
                        onChange={(event) =>
                          onChange(
                            filter.id,
                            option.value,
                            event.currentTarget.checked,
                          )
                        }
                        className="h-4 w-4 border-slate-300 text-slate-900 accent-slate-900 focus:ring-slate-500"
                      />

                      <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                        <span className="truncate">{option.label}</span>
                        {option.count !== undefined ? (
                          <span className="text-xs tabular-nums text-slate-500">
                            {option.count}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>
    </aside>
  );
}
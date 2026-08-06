type FilterOption = {
  id: string;
  label: string;
  count?: number;
};

type FilterGroup = {
  id: string;
  label: string;
  options: FilterOption[];
};

type FilterPanelProps = {
  groups: FilterGroup[];
  selectedValues?: Record<string, string[]>;
  onChange?: (groupId: string, optionId: string, checked: boolean) => void;
  onClear?: () => void;
  title?: string;
  className?: string;
};

export function SidebarLeftFilterPanel({
  groups,
  selectedValues = {},
  onChange,
  onClear,
  title = "Filters",
  className = "",
}: FilterPanelProps) {
  return (
    <aside
      aria-label={title}
      className={`w-full shrink-0 border-r border-slate-200 bg-white p-4 ${className}`}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <fieldset key={group.id} className="space-y-2">
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group.label}
            </legend>

            <div className="space-y-2">
              {group.options.map((option) => {
                const isChecked =
                  selectedValues[group.id]?.includes(option.id) ?? false;

                return (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-center justify-between gap-3 text-sm text-slate-700"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(event) =>
                          onChange?.(
                            group.id,
                            option.id,
                            event.currentTarget.checked,
                          )
                        }
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-400"
                      />
                      <span className="truncate">{option.label}</span>
                    </span>

                    {option.count !== undefined && (
                      <span className="shrink-0 text-xs text-slate-400">
                        {option.count}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
    </aside>
  );
}
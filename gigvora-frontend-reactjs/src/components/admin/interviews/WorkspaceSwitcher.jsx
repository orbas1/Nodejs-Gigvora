import { useMemo } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

export default function WorkspaceSwitcher({
  workspaces = [],
  value,
  onChange,
  onRefresh,
  refreshing = false,
  disabled = false,
}) {
  const options = useMemo(() => {
    return workspaces.map((workspace) => ({
      id: workspace.id,
      label: workspace.name ?? workspace.id,
      info: `${workspace.rooms ?? 0} rooms · ${workspace.lanes ?? 0} lanes`,
    }));
  }, [workspaces]);

  return (
    <div className="flex flex-col gap-4 rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-slate-200/70 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Workspace</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">
          {options.find((option) => option.id === value)?.label ?? 'Select workspace'}
        </p>
        {options.find((option) => option.id === value)?.info ? (
          <p className="text-sm text-slate-500">{options.find((option) => option.id === value)?.info}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Switch</span>
          <select
            className="w-56 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={value ?? ''}
            onChange={(event) => onChange?.(event.target.value || null)}
            disabled={disabled || refreshing}
          >
            <option value="" disabled>
              Choose workspace
            </option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => onRefresh?.()}
          disabled={refreshing || disabled}
          className={classNames(
            'inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold shadow-sm transition',
            refreshing
              ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
              : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600',
          )}
        >
          <ArrowPathIcon
            className={classNames('mr-2 h-5 w-5', refreshing ? 'animate-spin text-slate-400' : 'text-blue-500')}
          />
          Refresh
        </button>
      </div>
    </div>
  );
}

import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  DISPUTE_PRIORITY_OPTIONS,
  DISPUTE_STAGE_OPTIONS,
  DISPUTE_STATUS_OPTIONS,
  DISPUTE_SORT_FIELDS,
  DISPUTE_SORT_DIRECTIONS,
} from '../../constants/disputes.js';

function Field({ label, children }) {
  return (
    <label className="block space-y-2 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function DisputeFilterDrawer({
  open,
  filters,
  onClose,
  onChange,
  onReset,
  onToggleOnlyMine,
  onToggleIncludeClosed,
  canFilterMyCases,
}) {
  if (!open) {
    return null;
  }

  const handleChange = (field) => (event) => {
    const value = event?.target?.value ?? '';
    onChange?.(field, value);
  };

  const handleNumberChange = (field) => (event) => {
    const value = event?.target?.value ?? '';
    onChange?.(field, value.replace(/[^0-9]/g, ''));
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-slate-900/60" aria-hidden="true" onClick={onClose} />
      <aside className="relative ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReset}
              className="text-sm font-semibold text-slate-500 transition hover:text-slate-900"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
            >
              <XMarkIcon className="h-5 w-5" />
              <span className="sr-only">Close filters</span>
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
          <Field label="Search">
            <input
              type="search"
              value={filters.search}
              onChange={handleChange('search')}
              placeholder="Case, reference, or notes"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Stage">
              <select
                value={filters.stage}
                onChange={handleChange('stage')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All</option>
                {DISPUTE_STAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Status">
              <select
                value={filters.status}
                onChange={handleChange('status')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {DISPUTE_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Priority">
              <select
                value={filters.priority}
                onChange={handleChange('priority')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">All</option>
                {DISPUTE_PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Assignee ID">
              <input
                type="text"
                inputMode="numeric"
                value={filters.assignedToId}
                onChange={handleNumberChange('assignedToId')}
                placeholder="User ID"
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </Field>
          </div>

          <Field label="Escrow reference">
            <input
              type="text"
              value={filters.transactionReference}
              onChange={handleChange('transactionReference')}
              placeholder="Reference code"
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Sort field">
              <select
                value={filters.sortBy}
                onChange={handleChange('sortBy')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {DISPUTE_SORT_FIELDS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sort order">
              <select
                value={filters.sortDirection}
                onChange={handleChange('sortDirection')}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {DISPUTE_SORT_DIRECTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="space-y-3 text-sm text-slate-600">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={filters.includeClosed}
                onChange={(event) => onToggleIncludeClosed?.(event.target.checked)}
              />
              <span>Show closed cases</span>
            </label>
            {canFilterMyCases ? (
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={filters.onlyMine}
                  onChange={(event) => onToggleOnlyMine?.(event.target.checked)}
                />
                <span>Only my queue</span>
              </label>
            ) : null}
          </div>
        </div>

        <div className="border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            Done
          </button>
        </div>
      </aside>
    </div>
  );
}

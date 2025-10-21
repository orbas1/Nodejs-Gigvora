import PropTypes from 'prop-types';
import { FunnelIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { STATUS_OPTIONS, HIGHLIGHT_OPTIONS } from './constants.js';

export default function FilterBar({ filters, onChange, onReset }) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 items-center gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={filters.query ?? ''}
            onChange={(event) => onChange({ query: event.target.value, page: 1 })}
            placeholder="Search reviews"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <FunnelIcon className="h-4 w-4 text-slate-400" />
          <select
            value={filters.status ?? 'all'}
            onChange={(event) => onChange({ status: event.target.value, page: 1 })}
            className="rounded-xl border border-transparent bg-transparent text-sm font-semibold text-slate-700 focus:border-blue-400 focus:bg-white focus:outline-none"
          >
            <option value="all">All</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Highlight</span>
          <select
            value={filters.highlighted ?? 'all'}
            onChange={(event) => {
              const value = event.target.value;
              onChange({ highlighted: value === 'all' ? undefined : value === 'true', page: 1 });
            }}
            className="rounded-xl border border-transparent bg-transparent text-sm font-semibold text-slate-700 focus:border-blue-400 focus:bg-white focus:outline-none"
          >
            {HIGHLIGHT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Min rating</span>
          <input
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={filters.minRating ?? ''}
            onChange={(event) => onChange({ minRating: event.target.value ? Number(event.target.value) : null, page: 1 })}
            className="w-20 rounded-xl border border-transparent bg-white px-2 py-1 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
        >
          <XMarkIcon className="h-4 w-4" />
          Clear
        </button>
      </div>
    </div>
  );
}

FilterBar.propTypes = {
  filters: PropTypes.shape({
    query: PropTypes.string,
    status: PropTypes.string,
    highlighted: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
    minRating: PropTypes.number,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};

import { ArrowPathIcon, PlusIcon, TrashIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import { DATABASE_STATUS_STYLES } from '../../../constants/databaseStatusStyles.js';

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'warning', label: 'Slow' },
  { value: 'error', label: 'Error' },
  { value: 'unknown', label: 'Unknown' },
];

function normalizeOption(value) {
  if (!value) return '';
  return value.toLowerCase();
}

export default function DatabaseConnectionList({
  connections = [],
  loading = false,
  selectedId = null,
  onSelect,
  onDelete,
  onTest,
  onRefresh,
  onCreateNew,
  filters = {},
  onFiltersChange,
  environmentOptions = [],
  roleOptions = [],
}) {
  const handleFilterChange = (key) => (event) => {
    const nextValue = event.target.value;
    if (typeof onFiltersChange === 'function') {
      onFiltersChange({ ...filters, [key]: nextValue });
    }
  };

  const visibleConnections = connections.filter((connection) => {
    if (filters.environment && normalizeOption(connection.environment) !== normalizeOption(filters.environment)) {
      return false;
    }
    if (filters.role && normalizeOption(connection.role) !== normalizeOption(filters.role)) {
      return false;
    }
    if (filters.status) {
      const statusKey = connection.status && DATABASE_STATUS_STYLES[connection.status]
        ? connection.status
        : 'unknown';
      if (statusKey !== filters.status) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Connection profiles</h2>
          <p className="mt-1 text-sm text-slate-600">
            Track primary and replica databases, manage access roles, and monitor connection health.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1"
          >
            <PlusIcon className="h-4 w-4" />
            New connection
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Environment
          <select
            value={filters.environment ?? ''}
            onChange={handleFilterChange('environment')}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            <option value="">All environments</option>
            {environmentOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Role
          <select
            value={filters.role ?? ''}
            onChange={handleFilterChange('role')}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            <option value="">All roles</option>
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Status
          <select
            value={filters.status ?? ''}
            onChange={handleFilterChange('status')}
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-100/70 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3">Name</th>
              <th scope="col" className="px-4 py-3">Environment</th>
              <th scope="col" className="px-4 py-3">Role</th>
              <th scope="col" className="px-4 py-3">Host</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Last tested</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {visibleConnections.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                  {loading ? 'Loading connection profiles…' : 'No connection profiles match your filters.'}
                </td>
              </tr>
            ) : (
              visibleConnections.map((connection) => {
                const statusKey = connection.status && DATABASE_STATUS_STYLES[connection.status]
                  ? connection.status
                  : 'unknown';
                const statusStyle = DATABASE_STATUS_STYLES[statusKey];
                const isSelected = selectedId === connection.id;
                return (
                  <tr
                    key={connection.id}
                    className={`transition hover:bg-slate-50 ${isSelected ? 'bg-accent/5' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onSelect?.(connection)}
                        className="text-left text-sm font-semibold text-slate-900 hover:text-accent"
                      >
                        {connection.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{connection.environment}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{connection.role}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {connection.host}:{connection.port}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusStyle.className}`}
                      >
                        {statusStyle.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {connection.lastTestedAt ? new Date(connection.lastTestedAt).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onTest?.(connection)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/30"
                        >
                          <WrenchScrewdriverIcon className="h-4 w-4" />
                          Test
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete?.(connection)}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-medium text-rose-600 transition hover:border-rose-300 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

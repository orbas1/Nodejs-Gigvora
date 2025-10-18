import { useMemo } from 'react';
import PropTypes from 'prop-types';

const STATUS_COLOURS = {
  draft: 'bg-slate-100 text-slate-600',
  scheduled: 'bg-sky-100 text-sky-700',
  in_progress: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-indigo-100 text-indigo-700',
  cancelled: 'bg-rose-100 text-rose-700',
  archived: 'bg-slate-200 text-slate-600',
};

export default function SpeedNetworkingFilters({ catalog, filters, onChange, onReset }) {
  const statusOptions = useMemo(() => catalog?.statuses ?? [], [catalog?.statuses]);
  const hosts = useMemo(() => catalog?.hosts ?? [], [catalog?.hosts]);
  const workspaces = useMemo(() => catalog?.workspaces ?? [], [catalog?.workspaces]);

  const handleStatusToggle = (value) => {
    const current = new Set(filters.status ?? []);
    if (current.has(value)) {
      current.delete(value);
    } else {
      current.add(value);
    }
    onChange({ status: Array.from(current) });
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Session filters</h2>
          <p className="text-sm text-slate-500">Layer filters to hone in on the rotations that need attention.</p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="self-start rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
        >
          Reset
        </button>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Status</span>
          <div className="mt-3 flex flex-wrap gap-2">
            {statusOptions.map((option) => {
              const isActive = (filters.status ?? []).includes(option.value);
              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => handleStatusToggle(option.value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    isActive ? STATUS_COLOURS[option.value] ?? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Host</span>
          <select
            value={filters.hostId ?? ''}
            onChange={(event) => onChange({ hostId: event.target.value || undefined })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="">All hosts</option>
            {hosts.map((host) => (
              <option key={host.id} value={host.id}>
                {host.name} · {host.userType}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Workspace</span>
          <select
            value={filters.workspaceId ?? ''}
            onChange={(event) => onChange({ workspaceId: event.target.value || undefined })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="">Any workspace</option>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Date from</span>
          <input
            type="date"
            value={filters.from ?? ''}
            onChange={(event) => onChange({ from: event.target.value || undefined })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Date to</span>
          <input
            type="date"
            value={filters.to ?? ''}
            onChange={(event) => onChange({ to: event.target.value || undefined })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </label>
        <label className="flex flex-col gap-2 lg:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Search</span>
          <input
            type="search"
            value={filters.search ?? ''}
            onChange={(event) => onChange({ search: event.target.value || undefined })}
            placeholder="Search by title, theme, or notes"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </label>
      </div>
    </section>
  );
}

SpeedNetworkingFilters.propTypes = {
  catalog: PropTypes.shape({
    statuses: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      }),
    ),
    hosts: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        name: PropTypes.string,
        userType: PropTypes.string,
      }),
    ),
    workspaces: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
        name: PropTypes.string,
      }),
    ),
  }),
  filters: PropTypes.shape({
    status: PropTypes.arrayOf(PropTypes.string),
    hostId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    workspaceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    from: PropTypes.string,
    to: PropTypes.string,
    search: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};

SpeedNetworkingFilters.defaultProps = {
  catalog: null,
};

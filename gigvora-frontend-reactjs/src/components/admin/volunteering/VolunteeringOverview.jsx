import PropTypes from 'prop-types';

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(numeric);
}

export default function VolunteeringOverview({
  data,
  loading,
  onRefresh,
  onOpenPrograms,
  onOpenRoles,
  onOpenShifts,
  onSelectShift,
}) {
  const totals = data?.totals ?? {};
  const statuses = data?.statusBreakdown ?? {};
  const locations = data?.locationBreakdown ?? {};
  const upcoming = data?.upcomingShifts ?? [];
  const updated = data?.lastUpdatedAt ? new Date(data.lastUpdatedAt) : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Volunteering</h1>
          <p className="text-sm text-slate-500">Live programme health at a glance.</p>
          {updated ? (
            <p className="text-xs text-slate-400">Refreshed {updated.toLocaleString()}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenPrograms}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
          >
            New program
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </header>

      {loading ? (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Roles</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(totals.roles)}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Open</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-700">{formatNumber(totals.open)}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Draft</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(totals.draft)}</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">Upcoming shifts</p>
              <p className="mt-2 text-2xl font-semibold text-sky-700">{formatNumber(totals.upcomingShifts)}</p>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Status</p>
                <button
                  type="button"
                  onClick={onOpenRoles}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Manage roles
                </button>
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {Object.entries(statuses).map(([key, count]) => (
                  <li
                    key={key}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600"
                  >
                    <span className="capitalize">{key}</span>
                    <span className="font-semibold text-slate-900">{formatNumber(count)}</span>
                  </li>
                ))}
                {!Object.keys(statuses).length ? (
                  <li className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">
                    Add a role to see status distribution.
                  </li>
                ) : null}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Location</p>
                <button
                  type="button"
                  onClick={onOpenPrograms}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Configure
                </button>
              </div>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {Object.entries(locations).map(([key, count]) => (
                  <li
                    key={key}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600"
                  >
                    <span className="capitalize">{key}</span>
                    <span className="font-semibold text-slate-900">{formatNumber(count)}</span>
                  </li>
                ))}
                {!Object.keys(locations).length ? (
                  <li className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">
                    Record locations to see mix.
                  </li>
                ) : null}
              </ul>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Next shifts</p>
              <button
                type="button"
                onClick={onOpenShifts}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Planner
              </button>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {upcoming.length ? (
                upcoming.map((shift) => (
                  <button
                    type="button"
                    key={shift.id}
                    onClick={() => onSelectShift?.(shift)}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 hover:shadow"
                  >
                    <span className="text-sm font-semibold text-slate-800">{shift.title}</span>
                    <span className="text-xs text-slate-500">
                      {shift.role ? `${shift.role.title} • ${shift.role.organization}` : 'Unassigned role'}
                    </span>
                    <span className="mt-2 text-xs text-slate-500">
                      {shift.shiftDate}
                      {shift.startTime ? ` • ${shift.startTime}` : ''}
                      {shift.timezone ? ` ${shift.timezone}` : ''}
                    </span>
                    {shift.location ? (
                      <span className="mt-1 text-xs text-slate-400">{shift.location}</span>
                    ) : null}
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400">
                  Add shifts to start scheduling coverage.
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

VolunteeringOverview.propTypes = {
  data: PropTypes.shape({
    totals: PropTypes.object,
    statusBreakdown: PropTypes.object,
    locationBreakdown: PropTypes.object,
    upcomingShifts: PropTypes.arrayOf(PropTypes.object),
    lastUpdatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  }),
  loading: PropTypes.bool,
  onRefresh: PropTypes.func,
  onOpenPrograms: PropTypes.func,
  onOpenRoles: PropTypes.func,
  onOpenShifts: PropTypes.func,
  onSelectShift: PropTypes.func,
};

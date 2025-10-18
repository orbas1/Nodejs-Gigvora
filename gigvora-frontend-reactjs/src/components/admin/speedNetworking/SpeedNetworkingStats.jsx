import PropTypes from 'prop-types';

function StatCard({ label, value, helper, accent }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</span>
      <span className="text-3xl font-semibold text-slate-900">{value}</span>
      {helper ? <span className="text-xs text-slate-500">{helper}</span> : null}
      {accent ? <span className="text-xs font-medium text-slate-400">{accent}</span> : null}
    </div>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string,
  accent: PropTypes.string,
};

StatCard.defaultProps = {
  helper: null,
  accent: null,
};

export default function SpeedNetworkingStats({ metrics, onCreate, onRefresh, refreshing }) {
  const nextSessionLabel = metrics?.nextSession
    ? new Date(metrics.nextSession).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not scheduled';

  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50/60 p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Admin · Speed networking</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Session control</h1>
          <p className="mt-2 text-sm text-slate-500">
            Orchestrate rotations, room capacity, and attendee readiness from one command centre.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-400 hover:text-slate-900"
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800"
          >
            New session
          </button>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Live sessions"
          value={metrics?.totalsByStatus?.in_progress ?? 0}
          helper={`${metrics?.totalsByStatus?.scheduled ?? 0} upcoming`}
        />
        <StatCard
          label="Engaged participants"
          value={metrics?.participantsEngaged ?? 0}
          helper={`${metrics?.participantsTotal ?? 0} total registered`}
        />
        <StatCard label="Next rotation" value={nextSessionLabel} />
        <StatCard
          label="Drafts awaiting setup"
          value={metrics?.totalsByStatus?.draft ?? 0}
          accent={`${metrics?.totalsByStatus?.cancelled ?? 0} cancelled / ${
            metrics?.totalsByStatus?.archived ?? 0
          } archived`}
        />
      </div>
    </section>
  );
}

SpeedNetworkingStats.propTypes = {
  metrics: PropTypes.shape({
    totalsByStatus: PropTypes.object,
    participantsEngaged: PropTypes.number,
    participantsTotal: PropTypes.number,
    nextSession: PropTypes.string,
  }),
  onCreate: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  refreshing: PropTypes.bool,
};

SpeedNetworkingStats.defaultProps = {
  metrics: null,
  refreshing: false,
};

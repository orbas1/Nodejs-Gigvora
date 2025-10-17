import DataStatus from '../../components/DataStatus.jsx';

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(Number(value));
}

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Number(value).toFixed(0)}%`;
}

function formatMinutes(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  const total = Math.max(0, Number(value));
  if (total < 60) {
    return `${Math.round(total)}m`;
  }
  const hours = Math.floor(total / 60);
  const minutes = Math.round(total % 60);
  if (!minutes) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

export default function OverviewPanel({ summary = {}, stats = {}, preference, onToggleAvailability, loading, error, onRefresh, lastUpdated }) {
  const availabilityStatus = preference?.availabilityStatus ?? 'available';
  const isOnline = availabilityStatus === 'available';
  const toggleLabel = isOnline ? 'Go offline' : 'Go online';

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
          <p className="text-sm text-slate-500">Live invites and response health</p>
        </div>
        <button
          type="button"
          onClick={() => onToggleAvailability?.(isOnline ? 'offline' : 'available')}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
            isOnline ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          disabled={loading}
        >
          {toggleLabel}
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Live matches</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{formatNumber(summary.liveInvites)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Decisions</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{formatNumber(summary.pendingDecisions)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Acceptance rate</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{formatPercent(stats.acceptanceRate)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Response time</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{formatMinutes(stats.averageResponseMinutes)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>Auto accept at {formatPercent(preference?.autoAcceptThreshold)}</span>
          <span className="inline-flex items-center gap-2 text-xs">
            <span className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <DataStatus
        loading={loading}
        error={error}
        lastUpdated={lastUpdated}
        onRetry={onRefresh}
      />
    </section>
  );
}

import { ChartBarIcon, ClockIcon, CurrencyDollarIcon, ScaleIcon } from '@heroicons/react/24/outline';

function formatNumber(value) {
  if (value == null) {
    return '0';
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return `${value}`;
  }
  return numeric.toLocaleString();
}

function formatCurrencyMap(map) {
  if (!map || typeof map !== 'object') {
    return [];
  }
  return Object.entries(map)
    .map(([currency, total]) => ({ currency, total: Number(total) || 0 }))
    .sort((a, b) => b.total - a.total);
}

function StageProgress({ summary }) {
  const totals = summary?.totalsByStage ?? {};
  const totalCases = Object.values(totals).reduce((sum, count) => sum + Number(count || 0), 0);
  if (totalCases === 0) {
    return <p className="text-sm text-slate-500">No cases yet.</p>;
  }

  return (
    <div className="space-y-2">
      {Object.entries(totals).map(([stage, count]) => {
        const numericCount = Number(count || 0);
        const percent = Math.round((numericCount / totalCases) * 100);
        return (
          <div key={stage}>
            <div className="flex justify-between text-sm text-slate-600">
              <span className="capitalize">{stage.replace(/_/g, ' ')}</span>
              <span>
                {numericCount}
                <span className="text-slate-400"> · {percent}%</span>
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DisputeSummaryCards({ summary, onRefresh }) {
  const totalsByStatus = summary?.totalsByStatus ?? {};
  const openCases =
    Number(totalsByStatus.open ?? 0) +
    Number(totalsByStatus.awaiting_customer ?? 0) +
    Number(totalsByStatus.under_review ?? 0);
  const closedCases =
    Number(totalsByStatus.closed ?? 0) + Number(totalsByStatus.settled ?? 0);
  const averageResolutionHours = summary?.averageResolutionHours ?? null;
  const currencyTotals = formatCurrencyMap(summary?.openAmountsByCurrency ?? {});

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Stats</h2>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
          >
            Sync
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Active</p>
            <ScaleIcon className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-semibold text-slate-900">{formatNumber(openCases)}</p>
        </div>
        <div className="space-y-1 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Closed</p>
            <ChartBarIcon className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-semibold text-slate-900">{formatNumber(closedCases)}</p>
        </div>
        <div className="space-y-1 rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Avg hours</p>
            <ClockIcon className="h-5 w-5 text-violet-500" />
          </div>
          <p className="text-3xl font-semibold text-slate-900">
            {averageResolutionHours != null ? `${averageResolutionHours.toLocaleString()}` : '—'}
          </p>
        </div>
        <div className="space-y-1 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Held</p>
            <CurrencyDollarIcon className="h-5 w-5 text-amber-500" />
          </div>
          <div className="space-y-1 text-sm text-slate-700">
            {currencyTotals.length ? (
              currencyTotals.map(({ currency, total }) => (
                <div key={currency} className="flex items-center justify-between">
                  <span className="font-medium">{currency}</span>
                  <span>{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">0</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Stages</h3>
        </div>
        <div className="mt-3">
          <StageProgress summary={summary} />
        </div>
      </div>
    </div>
  );
}

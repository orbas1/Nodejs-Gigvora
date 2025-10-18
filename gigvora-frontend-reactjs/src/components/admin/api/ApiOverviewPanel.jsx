import { ArrowPathIcon, BanknotesIcon, KeyIcon, ShieldCheckIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

function formatNumber(value) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(Math.round(numeric));
}

function formatCurrency(cents) {
  const numeric = Number(cents ?? 0);
  if (!Number.isFinite(numeric)) {
    return '$0.00';
  }
  return `$${(numeric / 100).toFixed(2)}`;
}

const CARD_ICONS = {
  providers: Squares2X2Icon,
  clients: ShieldCheckIcon,
  requests: ArrowPathIcon,
  revenue: BanknotesIcon,
  unbilled: KeyIcon,
};

export default function ApiOverviewPanel({ summary = {}, loading, onRefresh, onAddProvider, onAddClient }) {
  const cards = [
    { id: 'providers', label: 'Providers', value: formatNumber(summary.providerCount) },
    { id: 'clients', label: 'Clients', value: formatNumber(summary.activeClientCount) },
    { id: 'requests', label: '30d Calls', value: formatNumber(summary.requestsLast30Days) },
    { id: 'revenue', label: '30d Revenue', value: formatCurrency(summary.revenueLast30DaysCents) },
    {
      id: 'unbilled',
      label: 'Unbilled calls',
      value: formatNumber(summary.unbilledRequestCountLast30Days),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">API hub</h2>
          <p className="text-sm text-slate-500">Monitor volume, revenue, and outstanding usage.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            type="button"
            onClick={onAddProvider}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            New provider
          </button>
          <button
            type="button"
            onClick={onAddClient}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
          >
            Provision client
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = CARD_ICONS[card.id] ?? Squares2X2Icon;
          return (
            <div key={card.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
                </div>
                <Icon className="h-10 w-10 text-blue-500" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Latency</h3>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {summary.avgLatencyMsLast30Days ? `${summary.avgLatencyMsLast30Days} ms` : 'No data'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Peak {summary.peakLatencyMsLast30Days ? `${summary.peakLatencyMsLast30Days} ms` : '—'}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Error rate</h3>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {summary.errorRateLast30Days ? `${summary.errorRateLast30Days.toFixed(2)}%` : '0%'}
          </p>
          <p className="mt-1 text-xs text-slate-500">Billable calls {formatNumber(summary.billableRequestCountLast30Days)}</p>
        </div>
      </div>
    </div>
  );
}

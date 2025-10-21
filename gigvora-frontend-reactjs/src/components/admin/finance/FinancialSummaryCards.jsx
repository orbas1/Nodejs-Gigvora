import PropTypes from 'prop-types';
import { ArrowPathIcon, BanknotesIcon, ChartBarIcon, ShieldCheckIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

const CARD_STYLES = [
  { icon: BanknotesIcon, accent: 'from-blue-500/10 to-blue-500/5 text-blue-700', border: 'border-blue-200' },
  { icon: ChartBarIcon, accent: 'from-emerald-500/10 to-emerald-500/5 text-emerald-700', border: 'border-emerald-200' },
  { icon: ShieldCheckIcon, accent: 'from-indigo-500/10 to-indigo-500/5 text-indigo-700', border: 'border-indigo-200' },
  { icon: ClipboardDocumentCheckIcon, accent: 'from-amber-500/10 to-amber-500/5 text-amber-700', border: 'border-amber-200' },
];

const defaultFormatCurrency = (amount) => {
  const numeric = Number(amount ?? 0);
  if (!Number.isFinite(numeric)) {
    return '$0';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: numeric >= 1000 ? 0 : 2,
  }).format(numeric);
};

const defaultFormatNumber = (value) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return new Intl.NumberFormat('en-US').format(Math.round(numeric));
};

export default function FinancialSummaryCards({
  summary,
  lookbackDays,
  refreshedAt,
  onRefresh,
  formatCurrency,
  formatNumber,
}) {
  const metrics = [
    {
      key: 'grossEscrowVolume',
      label: 'Gross escrow volume',
      description: `${lookbackDays}-day gross settlements`,
      value: formatCurrency(summary?.grossEscrowVolume ?? 0),
    },
    {
      key: 'netEscrowVolume',
      label: 'Net release volume',
      description: 'Gross – fees over lookback window',
      value: formatCurrency(summary?.netEscrowVolume ?? 0),
    },
    {
      key: 'pendingReleaseTotal',
      label: 'Pending release',
      description: 'Awaiting approval in escrow accounts',
      value: formatCurrency(summary?.pendingReleaseTotal ?? 0),
    },
    {
      key: 'activeScheduleCount',
      label: 'Active payout schedules',
      description: 'Live automation workflows',
      value: formatNumber(summary?.activeScheduleCount ?? 0),
    },
    {
      key: 'activeAdjustmentCount',
      label: 'Open adjustments',
      description: 'Pending treasury approvals',
      value: formatNumber(summary?.activeAdjustmentCount ?? 0),
    },
  ];

  const refreshedLabel = refreshedAt
    ? new Date(refreshedAt).toLocaleString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric',
      })
    : '—';

  return (
    <section id="finance-summary" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Treasury control tower</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Monitor platform liquidity, release velocity, and treasury workloads for the most recent {lookbackDays}-day window.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Refreshed {refreshedLabel}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-blue-700 transition hover:border-blue-300 hover:bg-white"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Refresh
          </button>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric, index) => {
          const style = CARD_STYLES[index % CARD_STYLES.length];
          const Icon = style.icon ?? BanknotesIcon;
          return (
            <article
              key={metric.key}
              className={`relative overflow-hidden rounded-2xl border ${style.border} bg-gradient-to-br ${style.accent} p-5 shadow-sm transition hover:shadow-md`}
            >
              <div className="absolute right-4 top-4 rounded-full border border-white/40 bg-white/70 p-2 text-slate-500">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{metric.label}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">{metric.value}</p>
              <p className="mt-2 text-xs text-slate-600">{metric.description}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

FinancialSummaryCards.propTypes = {
  summary: PropTypes.shape({
    grossEscrowVolume: PropTypes.number,
    netEscrowVolume: PropTypes.number,
    pendingReleaseTotal: PropTypes.number,
    activeScheduleCount: PropTypes.number,
    activeAdjustmentCount: PropTypes.number,
  }),
  lookbackDays: PropTypes.number,
  refreshedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  onRefresh: PropTypes.func,
  formatCurrency: PropTypes.func,
  formatNumber: PropTypes.func,
};

FinancialSummaryCards.defaultProps = {
  summary: {},
  lookbackDays: 30,
  refreshedAt: undefined,
  onRefresh: undefined,
  formatCurrency: defaultFormatCurrency,
  formatNumber: defaultFormatNumber,
};

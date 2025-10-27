import PropTypes from 'prop-types';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';
import {
  describeSchedule,
  formatCurrency,
  getRiskToneClasses,
  getStatusToneClasses,
} from './escrowUtils.js';

export default function EscrowSummaryGrid({ summary }) {
  if (!summary) {
    return null;
  }

  const currency = summary.currency ?? 'USD';
  const queueSize = summary.releaseQueueSize ?? 0;
  const dueSoonCount = summary.dueSoonCount ?? 0;
  const overdueAmount = Number(summary.overdueAmount ?? 0);
  const disputeCount = summary.disputeCount ?? 0;
  const upcoming = summary.upcomingRelease ?? null;

  const cards = [
    {
      key: 'in-escrow',
      label: 'Safeguarded funds',
      value: formatCurrency(summary.inEscrow ?? 0, currency),
      caption: `${queueSize} payouts staged`,
      tone: getStatusToneClasses('in_escrow'),
    },
    {
      key: 'released',
      label: 'Released this quarter',
      value: formatCurrency(summary.released ?? 0, currency),
      caption: `Refunded ${formatCurrency(summary.refunded ?? 0, currency)}`,
      tone: getStatusToneClasses('released'),
    },
    {
      key: 'risk',
      label: 'Risk alerts',
      value: `${dueSoonCount} due soon`,
      caption:
        overdueAmount > 0
          ? `${formatCurrency(overdueAmount, currency)} overdue`
          : 'All milestones on track',
      tone: getRiskToneClasses(overdueAmount > 0 || dueSoonCount > 0 ? 'warning' : 'success'),
    },
    {
      key: 'disputes',
      label: 'Open disputes',
      value: `${disputeCount}`,
      caption: `Tied up ${formatCurrency(summary.disputed ?? 0, currency)}`,
      tone: getStatusToneClasses(disputeCount > 0 ? 'disputed' : 'released'),
    },
    {
      key: 'subscriptions',
      label: 'Subscriptions',
      value: `${summary.activeSubscriptions ?? 0} active`,
      caption: `MRR ${formatCurrency(summary.monthlyRecurringRevenue ?? 0, currency)}`,
      tone: getStatusToneClasses('active'),
    },
    {
      key: 'accounts',
      label: 'Accounts',
      value: `${summary.totalAccounts ?? 0}`,
      caption: `Queue volume ${formatCurrency(summary.releaseQueueTotal ?? 0, currency)}`,
      tone: getStatusToneClasses('funded'),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`rounded-3xl border bg-white/85 p-5 shadow-sm transition hover:shadow-md ${card.tone}`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide">{card.label}</p>
          <p className="mt-2 text-xl font-semibold">{card.value}</p>
          <p className="mt-1 text-xs font-medium opacity-80">{card.caption}</p>
        </div>
      ))}
      {upcoming ? (
        <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Next release</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {formatCurrency(upcoming.amount ?? 0, currency)}
          </p>
          {upcoming.reference ? (
            <p className="mt-1 text-xs font-medium text-slate-600">{upcoming.reference}</p>
          ) : null}
          <p className="mt-2 text-sm text-blue-700">
            {upcoming.scheduledAt
              ? formatAbsolute(upcoming.scheduledAt, { dateStyle: 'medium', timeStyle: 'short' })
              : 'Awaiting schedule'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {upcoming.counterpartyName ? `Counterparty · ${upcoming.counterpartyName}` : describeSchedule(upcoming.scheduledAt)}
          </p>
        </div>
      ) : null}
      {summary.averageCycleDays != null ? (
        <div className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average release cycle</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{summary.averageCycleDays} days</p>
          <p className="mt-1 text-xs text-slate-500">
            Last updated {formatRelativeTime(summary.cycleCalculatedAt ?? Date.now())}
          </p>
        </div>
      ) : null}
    </div>
  );
}

EscrowSummaryGrid.propTypes = {
  summary: PropTypes.shape({
    inEscrow: PropTypes.number,
    released: PropTypes.number,
    refunded: PropTypes.number,
    disputed: PropTypes.number,
    totalAccounts: PropTypes.number,
    releaseQueueSize: PropTypes.number,
    currency: PropTypes.string,
    upcomingRelease: PropTypes.shape({
      amount: PropTypes.number,
      scheduledAt: PropTypes.string,
      reference: PropTypes.string,
      counterpartyName: PropTypes.string,
    }),
    releaseQueueTotal: PropTypes.number,
    dueSoonCount: PropTypes.number,
    overdueAmount: PropTypes.number,
    disputeCount: PropTypes.number,
    monthlyRecurringRevenue: PropTypes.number,
    activeSubscriptions: PropTypes.number,
    averageCycleDays: PropTypes.number,
    cycleCalculatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
};

EscrowSummaryGrid.defaultProps = {
  summary: null,
};

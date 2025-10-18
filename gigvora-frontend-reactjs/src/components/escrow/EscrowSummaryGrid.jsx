import PropTypes from 'prop-types';
import { formatAbsolute } from '../../utils/date.js';

function formatCurrency(amount, currency) {
  if (amount == null) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch (error) {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

export default function EscrowSummaryGrid({ summary }) {
  if (!summary) {
    return null;
  }

  const currency = summary.currency ?? 'USD';
  const cards = [
    { label: 'In escrow', value: formatCurrency(summary.inEscrow ?? 0, currency) },
    { label: 'Released', value: formatCurrency(summary.released ?? 0, currency) },
    { label: 'Refunded', value: formatCurrency(summary.refunded ?? 0, currency) },
    { label: 'Disputed', value: formatCurrency(summary.disputed ?? 0, currency) },
    { label: 'Accounts', value: summary.totalAccounts ?? 0 },
    { label: 'Queue', value: summary.releaseQueueSize ?? 0 },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{card.value}</p>
        </div>
      ))}
      {summary.upcomingRelease ? (
        <div className="rounded-3xl border border-blue-100 bg-blue-50/70 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Next release</p>
          <p className="mt-2 text-lg font-semibold text-blue-700">
            {formatCurrency(summary.upcomingRelease.amount ?? 0, currency)}
          </p>
          {summary.upcomingRelease.scheduledAt ? (
            <p className="mt-1 text-sm text-blue-600">
              {formatAbsolute(summary.upcomingRelease.scheduledAt, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          ) : null}
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
    }),
  }),
};

EscrowSummaryGrid.defaultProps = {
  summary: null,
};

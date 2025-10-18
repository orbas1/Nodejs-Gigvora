import PropTypes from 'prop-types';

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency.toUpperCase()} ${Number(value).toFixed(0)}`;
  }
}

const SUMMARY_FIELDS = [
  { id: 'totalSessions', label: 'All sessions' },
  { id: 'upcomingSessions', label: 'Booked' },
  { id: 'completedSessions', label: 'Finished' },
  { id: 'sessionsRemaining', label: 'Sessions left' },
];

export default function MentoringSummaryCards({ summary, currency }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {SUMMARY_FIELDS.map((field) => {
        const value = summary?.[field.id];
        return (
          <div key={field.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{field.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{value != null ? value : '—'}</p>
          </div>
        );
      })}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Mentoring spend</p>
        <p className="mt-3 text-3xl font-semibold text-slate-900">
          {formatCurrency(summary?.totalSpend ?? 0, currency)}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {summary?.activePackages ? `${summary.activePackages} active package${summary.activePackages === 1 ? '' : 's'}.` : 'No active packages yet.'}
        </p>
      </div>
    </div>
  );
}

MentoringSummaryCards.propTypes = {
  summary: PropTypes.shape({
    totalSessions: PropTypes.number,
    upcomingSessions: PropTypes.number,
    completedSessions: PropTypes.number,
    sessionsRemaining: PropTypes.number,
    activePackages: PropTypes.number,
    totalSpend: PropTypes.number,
  }),
  currency: PropTypes.string,
};

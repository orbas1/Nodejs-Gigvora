import PropTypes from 'prop-types';

function formatDate(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function LegalPolicySummaryBoard({ summary }) {
  const stats = summary ?? {};
  const highlights = [
    {
      label: 'Active policies',
      value: stats.active ?? 0,
      caption: 'Live across all cohorts',
    },
    {
      label: 'Locales covered',
      value: Array.isArray(stats.locales) ? stats.locales.length : stats.localeCount ?? 1,
      caption: Array.isArray(stats.locales) ? stats.locales.join(', ') : 'Global',
    },
    {
      label: 'Due for review',
      value: stats.dueForReview ?? 0,
      caption: 'Within next 30 days',
    },
  ];

  const upcoming = Array.isArray(stats.upcomingReviews) ? stats.upcomingReviews.slice(0, 3) : [];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Governance summary</p>
        <h2 className="text-xl font-semibold text-slate-900">Legal coverage</h2>
        <p className="text-sm text-slate-500">
          Snapshot of policy health to keep Gigvora audit-ready. Update cadence ensures terms stay in lockstep with platform
          evolution.
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {highlights.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
            <p className="mt-1 text-xs text-slate-500">{item.caption}</p>
          </div>
        ))}
      </div>
      {upcoming.length > 0 ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
          <h3 className="text-sm font-semibold text-slate-800">Upcoming reviews</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {upcoming.map((item) => (
              <li key={item.id ?? item.slug} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2">
                <span className="font-semibold text-slate-900">{item.title ?? item.name ?? 'Policy'}</span>
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  {formatDate(item.reviewDate ?? item.dueAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

LegalPolicySummaryBoard.propTypes = {
  summary: PropTypes.shape({
    active: PropTypes.number,
    locales: PropTypes.arrayOf(PropTypes.string),
    localeCount: PropTypes.number,
    dueForReview: PropTypes.number,
    upcomingReviews: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        slug: PropTypes.string,
        title: PropTypes.string,
        name: PropTypes.string,
        reviewDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
        dueAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      }),
    ),
  }),
};

LegalPolicySummaryBoard.defaultProps = {
  summary: null,
};

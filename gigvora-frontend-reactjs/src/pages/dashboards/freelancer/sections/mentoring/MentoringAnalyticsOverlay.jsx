import PropTypes from 'prop-types';
import { formatMentorName, formatMentorContactLine } from '../../../../../utils/mentoring.js';

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  const percent = Number(value) * 100;
  try {
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(percent)}%`;
  } catch (error) {
    return `${percent.toFixed(1)}%`;
  }
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toFixed(0)}`;
  }
}

function describeMentor(entry) {
  const parts = [];
  if (entry.completed) {
    parts.push(`${entry.completed} completed`);
  }
  if (entry.upcoming) {
    parts.push(`${entry.upcoming} upcoming`);
  }
  if (entry.purchases) {
    parts.push(`${entry.purchases} package${entry.purchases === 1 ? '' : 's'}`);
  }
  if (entry.favourited) {
    parts.push('Favourite');
  }
  return parts.length ? parts.join(' • ') : 'Workspace activity insight';
}

export default function MentoringAnalyticsOverlay({ analytics, currency, loading, onOpenMentor }) {
  if (!analytics) {
    return null;
  }

  const { totalMentors, conversionRate, avgSpendPerMentor, topMentors } = analytics;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Analytics</p>
          <h3 className="text-lg font-semibold text-slate-900">Mentor performance insights</h3>
        </div>
        {loading ? (
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <span className="h-2 w-2 animate-ping rounded-full bg-blue-500" aria-hidden /> Refreshing
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Mentors engaged</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalMentors ?? '—'}</p>
          <p className="mt-1 text-xs text-slate-500">Unique mentors across sessions, packages, and favourites.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Session conversion</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatPercent(conversionRate)}</p>
          <p className="mt-1 text-xs text-slate-500">Completed sessions divided by scheduled/requested sessions.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Avg spend per mentor</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(avgSpendPerMentor, currency)}</p>
          <p className="mt-1 text-xs text-slate-500">Total spend allocated across engaged mentors.</p>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-slate-800">Top mentors by momentum</h4>
        <ul className="mt-3 space-y-3">
          {topMentors?.length ? (
            topMentors.map((entry) => {
              const mentor = entry.mentor ?? {};
              const mentorName = formatMentorName(mentor);
              const mentorContact = formatMentorContactLine(mentor);
              return (
                <li
                  key={entry.mentorId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div>
                    <button
                      type="button"
                      onClick={() => onOpenMentor(entry.mentorId)}
                      className="text-left text-sm font-semibold text-slate-900 transition hover:text-blue-700"
                    >
                      {mentorName}
                    </button>
                    <p className="text-xs text-slate-500">{mentorContact}</p>
                    <p className="text-xs text-slate-400">{describeMentor(entry)}</p>
                  </div>
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Score {Number(entry.score ?? 0).toFixed(1)}
                  </span>
                </li>
              );
            })
          ) : (
            <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-sm text-slate-500">
              Build session history or packages to unlock mentor analytics.
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}

MentoringAnalyticsOverlay.propTypes = {
  analytics: PropTypes.shape({
    totalMentors: PropTypes.number,
    conversionRate: PropTypes.number,
    avgSpendPerMentor: PropTypes.number,
    topMentors: PropTypes.arrayOf(PropTypes.object),
  }),
  currency: PropTypes.string,
  loading: PropTypes.bool,
  onOpenMentor: PropTypes.func.isRequired,
};

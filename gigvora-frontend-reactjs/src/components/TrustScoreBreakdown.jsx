import PropTypes from 'prop-types';

function formatLevel(level) {
  if (!level) return 'Emerging';
  const normalized = `${level}`.toLowerCase();
  switch (normalized) {
    case 'platinum':
      return 'Platinum';
    case 'gold':
      return 'Gold';
    case 'silver':
      return 'Silver';
    default:
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
}

function formatDate(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return '—';
  }
}

export default function TrustScoreBreakdown({ score, level, breakdown, recommendedReviewAt }) {
  const items = Array.isArray(breakdown) ? breakdown : [];
  const normalizedScore = score == null ? null : Number(score);
  const displayScore = Number.isFinite(normalizedScore)
    ? normalizedScore.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : '—';
  const displayLevel = formatLevel(level);
  const reviewDate = formatDate(recommendedReviewAt);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Trust score insights</h2>
          <p className="text-sm text-slate-500">
            Weighted metrics reflecting references, community leadership, availability freshness, and delivery evidence.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Current score</p>
          <p className="text-3xl font-bold text-slate-900">{displayScore}</p>
          <p className="text-xs font-medium text-slate-500">Level: {displayLevel}</p>
          <p className="text-xs text-slate-400">Review due {reviewDate}</p>
        </div>
      </div>
      <div className="mt-6 space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">Trust score inputs will populate once references and delivery evidence are saved.</p>
        ) : null}
        {items.map((item) => {
          const maxContribution = item && typeof item.weight === 'number' && item.weight > 0 ? item.weight * 100 : 100;
          const contribution = Number.isFinite(Number(item?.contribution)) ? Number(item.contribution) : 0;
          const progress = Math.max(
            0,
            Math.min(100, maxContribution > 0 ? (contribution / maxContribution) * 100 : 0),
          );
          return (
            <article
              key={item?.key ?? item?.label}
              className="rounded-2xl border border-slate-200/80 bg-surfaceMuted/60 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item?.label ?? 'Metric'}</p>
                  <p className="text-xs text-slate-500">{item?.description}</p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p className="font-semibold text-slate-900">{contribution.toFixed(1)} pts</p>
                  <p>{Math.round(progress)}% of target</p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent via-blue-500 to-emerald-400"
                  style={{ width: `${progress}%` }}
                  aria-hidden="true"
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

TrustScoreBreakdown.propTypes = {
  score: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  level: PropTypes.string,
  breakdown: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.string,
      description: PropTypes.string,
      weight: PropTypes.number,
      contribution: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
  ),
  recommendedReviewAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
};

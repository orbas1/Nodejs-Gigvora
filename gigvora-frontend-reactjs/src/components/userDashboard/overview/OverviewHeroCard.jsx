import PropTypes from 'prop-types';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import UserAvatar from '../../UserAvatar.jsx';

function MetricBlock({ label, value }) {
  return (
    <div className="flex flex-col gap-1 rounded-3xl bg-white/20 px-4 py-3 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/60">{label}</p>
      <p className="text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

MetricBlock.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default function OverviewHeroCard({ data, onEdit, canEdit }) {
  if (!data) {
    return null;
  }

  const bannerStyle = data.bannerImageUrl
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.3)), url(${data.bannerImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        backgroundImage: 'linear-gradient(135deg, rgba(37, 99, 235, 0.8), rgba(14, 165, 233, 0.65), rgba(16, 185, 129, 0.6))',
      };

  return (
    <article
      className="relative overflow-hidden rounded-4xl border border-slate-200 bg-slate-900 text-white shadow-sm"
      style={bannerStyle}
    >
      <div className="absolute inset-0 bg-slate-900/25" aria-hidden="true" />
      <div className="relative z-10 flex flex-col gap-8 p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <UserAvatar
              name={data.greetingName ?? 'Member'}
              imageUrl={data.avatarUrl}
              size="xl"
              className="border-4 border-white/40 shadow-xl"
            />
            <div className="space-y-2">
              <h3 className="text-4xl font-semibold">Hi {data.greetingName ?? 'there'}</h3>
              {data.headline ? <p className="text-lg text-white/80">{data.headline}</p> : null}
              {data.overview ? (
                <p className="text-sm text-white/70" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {data.overview}
                </p>
              ) : null}
            </div>
          </div>
          {canEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 self-start rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
            >
              <PencilSquareIcon className="h-4 w-4" />
              Edit
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wide text-white/70">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
            {data.dateLabel}
            <span aria-hidden="true">•</span>
            {data.timeLabel}
          </span>
          {data.weatherSummary ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">{data.weatherSummary}</span>
          ) : null}
          {data.trustLabel ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">{data.trustLabel}</span>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <MetricBlock label="Followers" value={data.followersLabel} />
          <MetricBlock label="Trust" value={`${data.trustScore}%`} />
          <MetricBlock
            label="Rating"
            value={
              data.ratingScore && data.ratingScore !== '—'
                ? `${data.ratingScore} (${Number(data.ratingCount ?? 0).toLocaleString()})`
                : '—'
            }
          />
        </div>
      </div>
    </article>
  );
}

OverviewHeroCard.propTypes = {
  data: PropTypes.shape({
    greetingName: PropTypes.string,
    headline: PropTypes.string,
    overview: PropTypes.string,
    avatarUrl: PropTypes.string,
    bannerImageUrl: PropTypes.string,
    dateLabel: PropTypes.string,
    timeLabel: PropTypes.string,
    weatherSummary: PropTypes.string,
    trustLabel: PropTypes.string,
    trustScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    followersLabel: PropTypes.string,
    followersCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    followersGoal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ratingScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ratingCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onEdit: PropTypes.func,
  canEdit: PropTypes.bool,
};

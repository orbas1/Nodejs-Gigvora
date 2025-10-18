import PropTypes from 'prop-types';
import { PencilSquareIcon, StarIcon } from '@heroicons/react/24/solid';

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0';
  }
  return Number(value).toLocaleString();
}

function StatBlock({ label, value, sublabel }) {
  return (
    <div className="flex flex-col gap-1 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      {sublabel ? <p className="text-xs font-medium text-slate-400">{sublabel}</p> : null}
    </div>
  );
}

StatBlock.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  sublabel: PropTypes.string,
};

export default function OverviewStatsCard({ data, onEdit, canEdit }) {
  if (!data) {
    return null;
  }

  const goalLabel = data.followersGoal != null ? `Goal ${formatNumber(data.followersGoal)}` : null;
  const trustLabel = data.trustLabel ? data.trustLabel : null;
  const ratingCount = data.ratingCount != null ? `${formatNumber(data.ratingCount)} reviews` : null;

  return (
    <section className="flex flex-col gap-6 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Stats</h3>
        {canEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Edit
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatBlock label="Followers" value={formatNumber(data.followersCount)} sublabel={goalLabel} />
        <StatBlock label="Trust" value={`${data.trustScore}%`} sublabel={trustLabel} />
        <div className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-inner">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rating</p>
          <div className="flex items-center gap-2 text-slate-900">
            <StarIcon className="h-5 w-5 text-amber-400" />
            <span className="text-2xl font-semibold">{data.ratingScore ?? '—'}</span>
          </div>
          {ratingCount ? <p className="text-xs font-medium text-slate-400">{ratingCount}</p> : null}
        </div>
      </div>
    </section>
  );
}

OverviewStatsCard.propTypes = {
  data: PropTypes.shape({
    followersCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    followersGoal: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    trustScore: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    trustLabel: PropTypes.string,
    ratingScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ratingCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onEdit: PropTypes.func,
  canEdit: PropTypes.bool,
};

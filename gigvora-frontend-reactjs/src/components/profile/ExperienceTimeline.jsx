import PropTypes from 'prop-types';
import { formatRelativeTime } from '../../utils/date.js';
import { formatStatusLabel } from '../userNetworking/utils.js';

function formatRange(startDate, endDate) {
  if (!startDate && !endDate) {
    return 'Timeline pending';
  }
  const startLabel = startDate ? startDate : '—';
  const endLabel = endDate ? endDate : 'Present';
  return `${startLabel} – ${endLabel}`;
}

export default function ExperienceTimeline({ items, statCards, emptyMessage }) {
  if (!items.length) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 text-center text-sm text-slate-600 shadow-sm">
        <p className="font-semibold text-slate-800">Experience timeline</p>
        <p className="mt-2 text-slate-500">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Experience timeline</h2>
          <p className="text-sm text-slate-500">
            Highlighting the pods, programmes, and leadership rotations that shaped this profile.
          </p>
        </div>
        {statCards.length ? (
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            {statCards.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-surfaceMuted/60 px-3 py-2 text-left shadow-sm">
                <p className="font-semibold text-slate-700">{stat.value}</p>
                <p className="text-[11px] uppercase tracking-wide text-slate-400">{stat.label}</p>
                {stat.helper ? <p className="mt-1 text-[11px] text-slate-400">{stat.helper}</p> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <div className="mt-6 space-y-5">
        {items.map((item, index) => {
          const highlights = Array.isArray(item.highlights) ? item.highlights : [];
          const range = formatRange(item.startDate, item.endDate);
          const summary = item.summary ?? item.description;
          const badge = item.engagementType ? formatStatusLabel(item.engagementType) : null;
          const lastUpdated = item.updatedAt ?? item.lastActivityAt;

          return (
            <article key={`${item.organization ?? 'experience'}-${index}`} className="rounded-2xl border border-slate-200 bg-surfaceMuted/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-600">{item.organization ?? 'Experience'}</span>
                <span>{range}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">{item.role ?? item.title ?? 'Role'}</h3>
                {badge ? (
                  <span className="rounded-full border border-accent/40 bg-accent/5 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
                    {badge}
                  </span>
                ) : null}
              </div>
              {summary ? <p className="mt-2 text-sm text-slate-600">{summary}</p> : null}
              {highlights.length ? (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-slate-500">
                  {highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              ) : null}
              {item.metrics ? (
                <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(item.metrics).map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-2">
                      <p className="font-semibold text-slate-700">{value}</p>
                      <p className="uppercase tracking-wide text-[10px] text-slate-400">{formatStatusLabel(label)}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {lastUpdated ? (
                <p className="mt-4 text-[11px] uppercase tracking-wide text-slate-400">
                  Updated {formatRelativeTime(lastUpdated)}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

ExperienceTimeline.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      organization: PropTypes.string,
      role: PropTypes.string,
      title: PropTypes.string,
      startDate: PropTypes.string,
      endDate: PropTypes.string,
      description: PropTypes.string,
      summary: PropTypes.string,
      highlights: PropTypes.arrayOf(PropTypes.string),
      metrics: PropTypes.object,
      engagementType: PropTypes.string,
      updatedAt: PropTypes.string,
      lastActivityAt: PropTypes.string,
    }),
  ),
  statCards: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      helper: PropTypes.string,
    }),
  ),
  emptyMessage: PropTypes.string,
};

ExperienceTimeline.defaultProps = {
  items: [],
  statCards: [],
  emptyMessage: 'Add engagements, roles, or programmes to bring your experience story to life.',
};

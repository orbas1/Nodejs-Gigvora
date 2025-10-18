import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { ArrowTopRightOnSquareIcon, PlusIcon } from '@heroicons/react/24/outline';
import { CREATION_STUDIO_TYPES, CREATION_STUDIO_STATUSES, getCreationType } from '../../constants/creationStudio.js';
import { formatAbsolute, formatRelativeTime } from '../../utils/date.js';

function SummaryCard({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-blue-900">{value}</p>
      {helper ? <p className="mt-1 text-xs text-blue-600">{helper}</p> : null}
    </div>
  );
}

SummaryCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  helper: PropTypes.string,
};

SummaryCard.defaultProps = {
  helper: null,
};

function TypeBreakdownList({ breakdown }) {
  if (!Array.isArray(breakdown) || !breakdown.length) {
    return <p className="text-sm text-slate-500">Add an item to see totals.</p>;
  }

  return (
    <ul className="divide-y divide-slate-200 text-sm">
      {breakdown.map((entry) => {
        const type = getCreationType(entry.type);
        const label = type?.label ?? entry.type;
        const published = entry.byStatus?.published ?? 0;
        const scheduled = entry.byStatus?.scheduled ?? 0;
        const drafts = entry.byStatus?.draft ?? 0;
        return (
          <li key={entry.type} className="flex items-center justify-between py-2">
            <div>
              <p className="font-semibold text-slate-900">{label}</p>
              <p className="text-xs text-slate-500">
                {published} published · {scheduled} scheduled · {drafts} drafts
              </p>
            </div>
            <span className="text-sm font-semibold text-slate-600">{entry.total}</span>
          </li>
        );
      })}
    </ul>
  );
}

TypeBreakdownList.propTypes = {
  breakdown: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.string.isRequired,
      total: PropTypes.number,
      byStatus: PropTypes.object,
    }),
  ),
};

TypeBreakdownList.defaultProps = {
  breakdown: [],
};

function UpcomingLaunches({ upcoming }) {
  if (!Array.isArray(upcoming) || !upcoming.length) {
    return <p className="text-sm text-slate-500">No launches yet.</p>;
  }

  return (
    <ul className="space-y-3 text-sm">
      {upcoming.map((item) => {
        const type = getCreationType(item.type);
        const status = CREATION_STUDIO_STATUSES.find((entry) => entry.id === item.status);
        return (
          <li key={item.id} className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-indigo-900">{item.title}</p>
                <p className="text-xs text-indigo-600">{type?.label ?? item.type}</p>
              </div>
              {status ? (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.badge}`}>{status.label}</span>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-indigo-700">
              {item.launchDate
                ? `Launches ${formatAbsolute(item.launchDate)} (${formatRelativeTime(item.launchDate)})`
                : 'Launch date in review'}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

UpcomingLaunches.propTypes = {
  upcoming: PropTypes.arrayOf(PropTypes.object),
};

UpcomingLaunches.defaultProps = {
  upcoming: [],
};

export default function CreationStudioSummary({
  overview,
  onOpenStudio,
  ctaLabel,
  ctaTo,
  actions,
  compact,
}) {
  const summary = overview?.summary ?? {};
  const cards = [
    {
      label: 'Active drafts',
      value: summary.drafts ?? 0,
      helper: 'Ready for review',
    },
    {
      label: 'Scheduled launches',
      value: summary.scheduled ?? 0,
      helper: 'Automatic go-live',
    },
    {
      label: 'Published assets',
      value: summary.published ?? 0,
      helper: 'Live on Gigvora',
    },
  ];

  const openButton = onOpenStudio ? (
    <button
      type="button"
      onClick={onOpenStudio}
      className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90"
    >
      <PlusIcon className="h-4 w-4" />
      New creation
    </button>
  ) : ctaTo ? (
    <Link
      to={ctaTo}
      className="inline-flex items-center gap-2 rounded-full border border-accent/40 px-4 py-2 text-sm font-semibold text-accent transition hover:border-accent hover:bg-accent/5"
    >
      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
      {ctaLabel ?? 'Open creation studio'}
    </Link>
  ) : null;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Studio</h2>
          <p className="mt-1 text-sm text-slate-600">Create jobs, gigs, pages, and ads in one workspace.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {actions}
          {openButton}
        </div>
      </div>

      <div className={`mt-6 grid gap-3 ${compact ? 'md:grid-cols-3' : 'md:grid-cols-3 xl:grid-cols-4'}`}>
        {cards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      {!compact ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Creation mix</h3>
            <TypeBreakdownList breakdown={overview?.typeSummaries} />
          </div>
          <div className="rounded-3xl border border-indigo-100 bg-indigo-50/60 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Upcoming launches</h3>
            <UpcomingLaunches upcoming={overview?.upcoming} />
          </div>
        </div>
      ) : null}
    </section>
  );
}

CreationStudioSummary.propTypes = {
  overview: PropTypes.shape({
    summary: PropTypes.object,
    typeSummaries: PropTypes.array,
    upcoming: PropTypes.array,
  }),
  onOpenStudio: PropTypes.func,
  ctaLabel: PropTypes.string,
  ctaTo: PropTypes.string,
  actions: PropTypes.node,
  compact: PropTypes.bool,
};

CreationStudioSummary.defaultProps = {
  overview: null,
  onOpenStudio: null,
  ctaLabel: null,
  ctaTo: null,
  actions: null,
  compact: false,
};

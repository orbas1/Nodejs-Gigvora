import PropTypes from 'prop-types';
import { CalendarDaysIcon, ClockIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

function formatDate(value) {
  if (!value) {
    return '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTime(value) {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

const STATUS_TONES = {
  scheduled: 'bg-sky-50 text-sky-600 border-sky-200',
  in_review: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  overdue: 'bg-rose-50 text-rose-700 border-rose-200',
};

function TimelineItem({ item }) {
  const tone = STATUS_TONES[item.status] ?? 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <li className="relative pl-8">
      <span className="absolute left-0 top-1 h-5 w-5 rounded-full border-2 border-white bg-gradient-to-br from-blue-500 to-violet-500" />
      <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
          <span className={clsx('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide', tone)}>
            {item.statusLabel ?? item.status?.replace(/[_-]/g, ' ') ?? 'Scheduled'}
          </span>
        </div>
        {item.description ? <p className="mt-2 text-sm text-slate-500">{item.description}</p> : null}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
            {formatDate(item.dueAt)}
          </span>
          {item.dueAt ? (
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="h-4 w-4" aria-hidden="true" />
              {formatTime(item.dueAt)}
            </span>
          ) : null}
          {item.owner ? <span>Owner: {item.owner}</span> : null}
          {item.tags?.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </li>
  );
}

TimelineItem.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    owner: PropTypes.string,
    dueAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    status: PropTypes.string,
    statusLabel: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};

export default function AdminGovernanceTimeline({ events, audits }) {
  const items = Array.isArray(events) && events.length > 0
    ? events
    : [
        {
          id: 'policy-refresh',
          title: 'Quarterly policy refresh',
          description: 'Coordinate with legal to publish refreshed Privacy Policy across all locales.',
          owner: 'Legal Ops',
          dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          status: 'in_review',
          tags: ['Legal', 'Policy'],
        },
        {
          id: 'governance-report',
          title: 'Governance report to leadership',
          description: 'Prepare executive summary covering compliance KPIs and trust center updates.',
          owner: 'Chief of Staff',
          dueAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
          status: 'scheduled',
          tags: ['Reporting'],
        },
      ];

  const auditSummary = audits ?? {
    nextAudit: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    readinessScore: 0.92,
    lastAudit: new Date(Date.now() - 160 * 24 * 60 * 60 * 1000),
  };

  return (
    <section
      id="admin-governance-timeline"
      className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8 shadow-inner"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Admin portal</p>
          <h2 className="text-2xl font-semibold text-slate-900">Governance runway</h2>
          <p className="text-sm text-slate-600">
            Align product, legal, and operations teams on upcoming checkpoints. Every milestone keeps Gigvora compliant and
            high-trust for enterprise partners.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next audit window</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{formatDate(auditSummary.nextAudit)}</p>
          <p className="mt-1 text-xs text-slate-500">Readiness score {(auditSummary.readinessScore * 100).toFixed(0)}%</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
            Last audit {formatDate(auditSummary.lastAudit)}
          </div>
        </div>
      </div>

      <ol className="mt-8 space-y-4 border-l border-slate-200 pl-4">
        {items.map((item) => (
          <TimelineItem key={item.id ?? item.title} item={item} />
        ))}
      </ol>
    </section>
  );
}

AdminGovernanceTimeline.propTypes = {
  events: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      description: PropTypes.string,
      owner: PropTypes.string,
      dueAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      status: PropTypes.string,
      statusLabel: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string),
    }),
  ),
  audits: PropTypes.shape({
    nextAudit: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    readinessScore: PropTypes.number,
    lastAudit: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  }),
};

AdminGovernanceTimeline.defaultProps = {
  events: [],
  audits: null,
};

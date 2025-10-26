import { useMemo } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import DataStatus from '../DataStatus.jsx';
import { formatDate, formatCurrency, formatStatus } from '../wallet/walletFormatting.js';
import { formatRelativeTime, formatAbsolute } from '../../utils/date.js';

const STATUS_TONE = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  awaiting_approval: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  funded: 'bg-blue-50 text-blue-700 border-blue-200',
  in_escrow: 'bg-blue-50 text-blue-700 border-blue-200',
  released: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  disputed: 'bg-rose-50 text-rose-700 border-rose-200',
  overdue: 'bg-rose-50 text-rose-700 border-rose-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

const RISK_TONE = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-rose-50 text-rose-700 border-rose-200',
  critical: 'bg-rose-50 text-rose-700 border-rose-300 shadow-sm shadow-rose-200/60',
};

const defaultHandlers = Object.freeze({
  onApprove: () => {},
  onRequestRelease: () => {},
  onScheduleRelease: () => {},
  onRaiseDispute: () => {},
  onAddNote: () => {},
  onReschedule: () => {},
  onUploadEvidence: () => {},
  onViewDocument: () => {},
});

function ApprovalPill({ approval }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold',
        approval.status === 'approved'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : approval.status === 'rejected'
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : 'border-slate-200 bg-slate-50 text-slate-600',
      )}
    >
      <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
      <span>{approval.name}</span>
      <span className="text-[11px] font-medium text-slate-400">{formatStatus(approval.status)}</span>
    </span>
  );
}

ApprovalPill.propTypes = {
  approval: PropTypes.shape({
    name: PropTypes.string,
    status: PropTypes.string,
  }).isRequired,
};

function AttachmentButton({ document, onViewDocument }) {
  return (
    <button
      type="button"
      onClick={() => onViewDocument(document)}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
    >
      <DocumentArrowDownIcon className="h-4 w-4" aria-hidden="true" />
      {document.name ?? 'Supporting document'}
    </button>
  );
}

AttachmentButton.propTypes = {
  document: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    url: PropTypes.string,
  }).isRequired,
  onViewDocument: PropTypes.func.isRequired,
};

function statusBadgeTone(status) {
  const normalized = String(status ?? '').toLowerCase();
  return STATUS_TONE[normalized] ?? 'bg-slate-100 text-slate-600 border-slate-200';
}

function riskBadgeTone(level) {
  const normalized = String(level ?? '').toLowerCase();
  return RISK_TONE[normalized] ?? 'bg-slate-100 text-slate-600 border-slate-200';
}

export default function EscrowMilestoneTracker({
  milestones,
  currency,
  loading,
  lastUpdated,
  fromCache,
  error,
  timezone,
  onApprove,
  onRequestRelease,
  onScheduleRelease,
  onRaiseDispute,
  onAddNote,
  onReschedule,
  onUploadEvidence,
  onViewDocument,
}) {
  const handlers = {
    onApprove: onApprove ?? defaultHandlers.onApprove,
    onRequestRelease: onRequestRelease ?? defaultHandlers.onRequestRelease,
    onScheduleRelease: onScheduleRelease ?? defaultHandlers.onScheduleRelease,
    onRaiseDispute: onRaiseDispute ?? defaultHandlers.onRaiseDispute,
    onAddNote: onAddNote ?? defaultHandlers.onAddNote,
    onReschedule: onReschedule ?? defaultHandlers.onReschedule,
    onUploadEvidence: onUploadEvidence ?? defaultHandlers.onUploadEvidence,
    onViewDocument: onViewDocument ?? defaultHandlers.onViewDocument,
  };

  const metrics = useMemo(() => {
    const base = {
      total: 0,
      approved: 0,
      released: 0,
      disputed: 0,
      pendingAmount: 0,
      releasedAmount: 0,
      disputedAmount: 0,
      highestRisk: null,
      upcoming: null,
    };

    const now = Date.now();
    milestones.forEach((milestone) => {
      const amount = Number(milestone.amount ?? 0);
      base.total += amount;
      const status = String(milestone.status ?? '').toLowerCase();
      if (['approved', 'completed', 'released'].includes(status)) {
        base.approved += 1;
      }
      if (['released', 'completed'].includes(status)) {
        base.released += 1;
        base.releasedAmount += amount;
      } else if (status === 'disputed') {
        base.disputed += 1;
        base.disputedAmount += amount;
      } else if (['pending', 'awaiting_approval', 'in_escrow', 'funded'].includes(status)) {
        base.pendingAmount += amount;
      }

      if (!base.highestRisk || (milestone.riskLevel && severityScore(milestone.riskLevel) > severityScore(base.highestRisk.riskLevel))) {
        base.highestRisk = milestone;
      }

      const dueTime = milestone.releaseWindow?.plannedAt ?? milestone.dueDate;
      if (dueTime) {
        const due = new Date(dueTime).getTime();
        if (Number.isFinite(due) && due >= now) {
          if (!base.upcoming || due < new Date(base.upcoming.releaseWindow?.plannedAt ?? base.upcoming.dueDate).getTime()) {
            base.upcoming = milestone;
          }
        }
      }
    });

    const completion = milestones.length ? Math.round((base.released / milestones.length) * 100) : 0;
    return { ...base, completion };
  }, [milestones]);

  return (
    <div className="space-y-6">
      <DataStatus loading={loading} lastUpdated={lastUpdated} fromCache={fromCache} error={error} statusLabel="Escrow milestones">
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total in escrow" value={formatCurrency(metrics.total, currency)} hint={`${milestones.length} milestones`} />
          <MetricCard label="Pending release" value={formatCurrency(metrics.pendingAmount, currency)} hint={`${metrics.total ? metrics.completion : 0}% completed`} tone="info" />
          <MetricCard label="Released" value={formatCurrency(metrics.releasedAmount, currency)} hint={`${metrics.released} cleared`} tone="positive" />
          <MetricCard label="Disputed" value={formatCurrency(metrics.disputedAmount, currency)} hint={`${metrics.disputed} at risk`} tone={metrics.disputedAmount ? 'warning' : 'neutral'} />
        </div>
        {metrics.highestRisk ? (
          <RiskBanner milestone={metrics.highestRisk} onRaiseDispute={handlers.onRaiseDispute} onUploadEvidence={handlers.onUploadEvidence} />
        ) : null}
        {metrics.upcoming ? <UpcomingBanner milestone={metrics.upcoming} timezone={timezone} onScheduleRelease={handlers.onScheduleRelease} /> : null}
        <MilestoneTimeline
          milestones={milestones}
          currency={currency}
          timezone={timezone}
          handlers={handlers}
          loading={loading}
        />
      </DataStatus>
    </div>
  );
}

EscrowMilestoneTracker.propTypes = {
  milestones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      currency: PropTypes.string,
      status: PropTypes.string,
      dueDate: PropTypes.string,
      releaseWindow: PropTypes.shape({
        plannedAt: PropTypes.string,
        scheduledBy: PropTypes.string,
      }),
      owner: PropTypes.shape({
        name: PropTypes.string,
        avatar: PropTypes.string,
      }),
      approvals: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          name: PropTypes.string,
          status: PropTypes.string,
        }),
      ),
      notes: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          author: PropTypes.string,
          body: PropTypes.string,
          createdAt: PropTypes.string,
        }),
      ),
      documents: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string,
          name: PropTypes.string,
          url: PropTypes.string,
        }),
      ),
      riskLevel: PropTypes.oneOf(['low', 'medium', 'high', 'critical']),
      riskSummary: PropTypes.string,
      updatedAt: PropTypes.string,
    }),
  ),
  currency: PropTypes.string,
  loading: PropTypes.bool,
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  fromCache: PropTypes.bool,
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  timezone: PropTypes.string,
  onApprove: PropTypes.func,
  onRequestRelease: PropTypes.func,
  onScheduleRelease: PropTypes.func,
  onRaiseDispute: PropTypes.func,
  onAddNote: PropTypes.func,
  onReschedule: PropTypes.func,
  onUploadEvidence: PropTypes.func,
  onViewDocument: PropTypes.func,
};

EscrowMilestoneTracker.defaultProps = {
  milestones: [],
  currency: 'USD',
  loading: false,
  lastUpdated: null,
  fromCache: false,
  error: undefined,
  timezone: 'UTC',
  onApprove: undefined,
  onRequestRelease: undefined,
  onScheduleRelease: undefined,
  onRaiseDispute: undefined,
  onAddNote: undefined,
  onReschedule: undefined,
  onUploadEvidence: undefined,
  onViewDocument: undefined,
};

function severityScore(riskLevel) {
  switch (String(riskLevel ?? '').toLowerCase()) {
    case 'critical':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
}

function MetricCard({ label, value, hint, tone = 'neutral' }) {
  const toneStyles = {
    neutral: 'border-slate-200 bg-white/70 text-slate-700',
    info: 'border-blue-200 bg-blue-50/80 text-blue-700',
    positive: 'border-emerald-200 bg-emerald-50/80 text-emerald-700',
    warning: 'border-amber-200 bg-amber-50/80 text-amber-700',
  };
  return (
    <div className={clsx('rounded-2xl border p-4 shadow-sm backdrop-blur', toneStyles[tone] ?? toneStyles.neutral)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  hint: PropTypes.string,
  tone: PropTypes.oneOf(['neutral', 'info', 'positive', 'warning']),
};

MetricCard.defaultProps = {
  hint: '',
  tone: 'neutral',
};

function RiskBanner({ milestone, onRaiseDispute, onUploadEvidence }) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-rose-200 bg-gradient-to-r from-rose-50 via-white to-white/60 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4 text-sm">
        <div className="rounded-2xl bg-rose-100/80 p-3 text-rose-600">
          <ExclamationTriangleIcon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">High risk milestone</p>
          <h3 className="text-lg font-semibold text-rose-700">{milestone.title}</h3>
          <p className="text-sm text-rose-600/80">{milestone.riskSummary ?? 'Risk monitoring flagged anomalies in recent activity. Review evidence before approving release.'}</p>
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className={clsx('inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold', riskBadgeTone(milestone.riskLevel))}>
              <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
              Risk {formatStatus(milestone.riskLevel)}
            </span>
            <span className="rounded-full bg-rose-100 px-3 py-1 font-semibold text-rose-600">
              {formatCurrency(milestone.amount, milestone.currency)} at stake
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onRaiseDispute(milestone)}
          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
          Escalate
        </button>
        <button
          type="button"
          onClick={() => onUploadEvidence(milestone)}
          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white/80 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
        >
          <DocumentArrowDownIcon className="h-5 w-5" aria-hidden="true" />
          Attach evidence
        </button>
      </div>
    </div>
  );
}

RiskBanner.propTypes = {
  milestone: PropTypes.shape({
    title: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    riskLevel: PropTypes.string,
    riskSummary: PropTypes.string,
  }).isRequired,
  onRaiseDispute: PropTypes.func.isRequired,
  onUploadEvidence: PropTypes.func.isRequired,
};

function UpcomingBanner({ milestone, timezone, onScheduleRelease }) {
  const planned = milestone.releaseWindow?.plannedAt ?? milestone.dueDate;
  const relative = planned ? formatRelativeTime(planned) : '—';
  const absolute = planned ? formatAbsolute(planned, { timeZone: timezone, timeStyle: 'short' }) : '—';
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-white/60 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4 text-sm">
        <div className="rounded-2xl bg-blue-100/80 p-3 text-blue-600">
          <ClockIcon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Upcoming release</p>
          <h3 className="text-lg font-semibold text-blue-700">{milestone.title}</h3>
          <p className="text-sm text-blue-600/80">
            Scheduled for {relative} ({absolute}). Confirm readiness and coordinate release approvals.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-600">
              {formatCurrency(milestone.amount, milestone.currency)}
            </span>
            <span className="rounded-full border border-blue-200 px-3 py-1 font-semibold text-blue-600">
              Owner {milestone.owner?.name ?? 'Unassigned'}
            </span>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onScheduleRelease(milestone)}
        className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        <ClockIcon className="h-5 w-5" aria-hidden="true" />
        Adjust schedule
      </button>
    </div>
  );
}

UpcomingBanner.propTypes = {
  milestone: PropTypes.shape({
    title: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    releaseWindow: PropTypes.shape({
      plannedAt: PropTypes.string,
    }),
    dueDate: PropTypes.string,
    owner: PropTypes.shape({
      name: PropTypes.string,
    }),
  }).isRequired,
  timezone: PropTypes.string,
  onScheduleRelease: PropTypes.func.isRequired,
};

UpcomingBanner.defaultProps = {
  timezone: 'UTC',
};

function MilestoneTimeline({ milestones, currency, timezone, handlers, loading }) {
  if (!loading && milestones.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/70 p-8 text-center text-sm text-slate-500">
        No escrow milestones tracked yet. Invite your project manager to stage the first deliverable.
      </div>
    );
  }

  return (
    <ol className="relative space-y-6 border-l border-slate-200 pl-6">
      {milestones.map((milestone, index) => {
        const statusClass = statusBadgeTone(milestone.status);
        const releaseDate = milestone.releaseWindow?.plannedAt ?? milestone.dueDate;
        const showDivider = index < milestones.length - 1;
        return (
          <li key={milestone.id} className="relative">
            <span className="absolute -left-[13px] top-1 h-6 w-6 rounded-full border-4 border-white shadow-sm" style={{ background: statusDotColor(milestone.status) }} aria-hidden="true" />
            {showDivider ? <span className="absolute -left-px top-8 h-full border-l border-dashed border-slate-200" aria-hidden="true" /> : null}
            <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Milestone</p>
                  <h4 className="text-lg font-semibold text-slate-900">{milestone.title}</h4>
                  <p className="text-sm text-slate-600">{milestone.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <span className={clsx('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold', statusClass)}>
                    {formatStatus(milestone.status)}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(milestone.amount, milestone.currency ?? currency)}</span>
                  <span className="text-xs text-slate-500">
                    Due {formatDate(releaseDate)} {timezone ? `(${timezone})` : ''}
                  </span>
                </div>
              </div>
              {milestone.approvals?.length ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {milestone.approvals.map((approval) => (
                    <ApprovalPill key={approval.id ?? approval.name} approval={approval} />
                  ))}
                </div>
              ) : null}
              {milestone.documents?.length ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {milestone.documents.map((document) => (
                    <AttachmentButton key={document.id ?? document.name} document={document} onViewDocument={handlers.onViewDocument} />
                  ))}
                </div>
              ) : null}
              {milestone.notes?.length ? (
                <div className="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes &amp; approvals</p>
                  <div className="space-y-2">
                    {milestone.notes.slice(0, 3).map((note) => (
                      <div key={note.id} className="rounded-xl bg-white/80 p-3 text-sm text-slate-600">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-semibold text-slate-500">{note.author}</span>
                          <span>{note.createdAt ? formatRelativeTime(note.createdAt) : ''}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{note.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold">
                {renderActionButtons(milestone, handlers)}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

MilestoneTimeline.propTypes = {
  milestones: PropTypes.array.isRequired,
  currency: PropTypes.string,
  timezone: PropTypes.string,
  handlers: PropTypes.shape({
    onApprove: PropTypes.func,
    onRequestRelease: PropTypes.func,
    onScheduleRelease: PropTypes.func,
    onRaiseDispute: PropTypes.func,
    onAddNote: PropTypes.func,
    onReschedule: PropTypes.func,
    onUploadEvidence: PropTypes.func,
    onViewDocument: PropTypes.func,
  }).isRequired,
  loading: PropTypes.bool,
};

MilestoneTimeline.defaultProps = {
  currency: 'USD',
  timezone: 'UTC',
  loading: false,
};

function renderActionButtons(milestone, handlers) {
  const status = String(milestone.status ?? '').toLowerCase();
  const actions = [];

  if (['pending', 'awaiting_approval'].includes(status)) {
    actions.push(
      <button
        key="approve"
        type="button"
        onClick={() => handlers.onApprove(milestone)}
        className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700"
      >
        <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
        Approve milestone
      </button>,
    );
  }

  if (['approved', 'in_escrow', 'funded'].includes(status)) {
    actions.push(
      <button
        key="request-release"
        type="button"
        onClick={() => handlers.onRequestRelease(milestone)}
        className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
      >
        <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
        Request release
      </button>,
    );
  }

  if (['pending', 'awaiting_approval', 'approved', 'in_escrow', 'funded'].includes(status)) {
    actions.push(
      <button
        key="reschedule"
        type="button"
        onClick={() => handlers.onReschedule(milestone)}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
      >
        <ClockIcon className="h-5 w-5" aria-hidden="true" />
        Reschedule
      </button>,
    );
  }

  if (status !== 'disputed' && status !== 'released' && status !== 'completed') {
    actions.push(
      <button
        key="dispute"
        type="button"
        onClick={() => handlers.onRaiseDispute(milestone)}
        className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-rose-600 transition hover:bg-rose-100"
      >
        <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
        Raise dispute
      </button>,
    );
  }

  actions.push(
    <button
      key="add-note"
      type="button"
      onClick={() => handlers.onAddNote(milestone)}
      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
    >
      <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden="true" />
      Add note
    </button>,
  );

  actions.push(
    <button
      key="refresh"
      type="button"
      onClick={() => handlers.onUploadEvidence({ ...milestone, intent: 'refresh' })}
      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
    >
      <ArrowPathIcon className="h-5 w-5" aria-hidden="true" />
      Sync audit trail
    </button>,
  );

  return actions;
}

function statusDotColor(status) {
  const normalized = String(status ?? '').toLowerCase();
  if (['released', 'approved', 'completed'].includes(normalized)) {
    return '#10b981';
  }
  if (['pending', 'awaiting_approval', 'in_escrow', 'funded'].includes(normalized)) {
    return '#2563eb';
  }
  if (['disputed', 'overdue'].includes(normalized)) {
    return '#f97316';
  }
  return '#cbd5f5';
}

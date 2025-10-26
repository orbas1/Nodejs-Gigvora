import { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PaperClipIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import WalletStatusPill from '../wallet/WalletStatusPill.jsx';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatStatus,
  statusTone,
} from '../wallet/walletFormatting.js';

const statusAccent = {
  positive: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  info: 'bg-sky-100 text-sky-700 ring-sky-200',
  warning: 'bg-amber-100 text-amber-800 ring-amber-200',
  negative: 'bg-rose-100 text-rose-700 ring-rose-200',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
};

function RequirementItem({ requirement }) {
  const tone = statusTone(requirement.status ?? requirement.state ?? 'pending');
  const Icon = tone === 'positive' ? CheckCircleIcon : tone === 'negative' ? ExclamationTriangleIcon : ClockIcon;

  return (
    <li className="flex items-start gap-3 rounded-2xl bg-white/70 p-3 text-xs text-slate-600">
      <span
        className={`mt-0.5 inline-flex h-7 w-7 flex-none items-center justify-center rounded-full ring-1 ${
          statusAccent[tone] ?? statusAccent.info
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <p className="font-semibold text-slate-900">{requirement.label}</p>
        {requirement.note ? <p className="text-slate-500">{requirement.note}</p> : null}
        <p className="text-[11px] uppercase tracking-wide text-slate-400">
          {formatStatus(requirement.status ?? requirement.state ?? 'pending')}
        </p>
      </div>
    </li>
  );
}

RequirementItem.propTypes = {
  requirement: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string.isRequired,
    note: PropTypes.string,
    status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    state: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
};

function ActivityItem({ entry }) {
  return (
    <li className="flex gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-3 text-xs text-slate-600">
      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-slate-900/5 text-slate-500">
        <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-semibold text-slate-900">{entry.action}</p>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            {entry.actor}
          </span>
        </div>
        {entry.note ? <p className="text-slate-500">{entry.note}</p> : null}
        <p className="text-[11px] uppercase tracking-wide text-slate-400">{formatDateTime(entry.timestamp)}</p>
      </div>
    </li>
  );
}

ActivityItem.propTypes = {
  entry: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    action: PropTypes.string.isRequired,
    note: PropTypes.string,
    actor: PropTypes.string.isRequired,
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
  }).isRequired,
};

function AttachmentList({ attachments }) {
  if (!attachments?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-dashed border-slate-200/80 bg-white/60 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Documentation</p>
      <ul className="mt-2 space-y-2 text-xs text-slate-600">
        {attachments.map((attachment) => (
          <li key={attachment.id ?? attachment.url} className="flex items-center gap-2">
            <PaperClipIcon className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <span className="font-medium text-slate-900">{attachment.label ?? attachment.name ?? 'Attachment'}</span>
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              {formatStatus(attachment.type ?? attachment.kind ?? 'supporting')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

AttachmentList.propTypes = {
  attachments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
      name: PropTypes.string,
      url: PropTypes.string,
      type: PropTypes.string,
      kind: PropTypes.string,
    }),
  ),
};

AttachmentList.defaultProps = {
  attachments: [],
};

function MilestoneCard({
  milestone,
  currency,
  timezone,
  canManage,
  onApproveRelease,
  onHoldMilestone,
  onTrackEvent,
}) {
  const amount = formatCurrency(milestone.amount ?? milestone.releaseAmount ?? 0, milestone.currency ?? currency);
  const tone = statusTone(milestone.status ?? 'pending');

  const handleRelease = useCallback(() => {
    onTrackEvent?.('escrow_milestone_release_initiated', {
      milestoneId: milestone.id,
      reference: milestone.reference,
    });
    onApproveRelease?.(milestone.id, milestone);
  }, [milestone, onApproveRelease, onTrackEvent]);

  const handleHold = useCallback(() => {
    onTrackEvent?.('escrow_milestone_hold_initiated', {
      milestoneId: milestone.id,
      reference: milestone.reference,
    });
    onHoldMilestone?.(milestone.id, milestone);
  }, [milestone, onHoldMilestone, onTrackEvent]);

  return (
    <article className="relative flex flex-col gap-6 rounded-4xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-900">{milestone.title}</h3>
            <WalletStatusPill value={milestone.status ?? 'pending'} />
          </div>
          <p className="text-sm text-slate-500">{milestone.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-0.5">Due {formatDate(milestone.dueDate)}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5">{amount}</span>
            {milestone.reference ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5">Ref {milestone.reference}</span>
            ) : null}
            {milestone.releaseWindow ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                Release window {milestone.releaseWindow.start ? formatDate(milestone.releaseWindow.start) : 'TBD'}
                {milestone.releaseWindow.end ? ` – ${formatDate(milestone.releaseWindow.end)}` : ''}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-3 text-right">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ring-1 ${
              statusAccent[tone] ?? statusAccent.info
            }`}
          >
            <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
            {formatStatus(milestone.compliance?.status ?? milestone.status ?? 'pending')}
          </span>
          {milestone.compliance?.lastReviewed ? (
            <p className="text-[11px] text-slate-400">
              Reviewed {formatDateTime(milestone.compliance.lastReviewed)}
              {timezone ? ` • ${timezone}` : ''}
            </p>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <div className="space-y-4">
          {milestone.requirements?.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Compliance checklist</p>
              <ul className="mt-3 space-y-3">
                {milestone.requirements.map((requirement) => (
                  <RequirementItem key={requirement.id ?? requirement.label} requirement={requirement} />
                ))}
              </ul>
            </div>
          ) : null}

          <AttachmentList attachments={milestone.attachments} />
        </div>

        <div className="space-y-4">
          {milestone.activity?.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Activity</p>
              <ul className="mt-3 space-y-3">
                {milestone.activity.slice(0, 4).map((entry) => (
                  <ActivityItem key={entry.id ?? `${entry.timestamp}-${entry.action}`} entry={entry} />
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200/80 bg-white/60 p-4 text-xs text-slate-500">
              Activity will appear as finance, compliance, and client events occur.
            </div>
          )}

          {canManage ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleRelease}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
                Release funds
              </button>
              <button
                type="button"
                onClick={handleHold}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              >
                <ExclamationTriangleIcon className="h-5 w-5" aria-hidden="true" />
                Place on hold
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

MilestoneCard.propTypes = {
  milestone: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    releaseWindow: PropTypes.shape({
      start: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      end: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    }),
    reference: PropTypes.string,
    amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    releaseAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    currency: PropTypes.string,
    compliance: PropTypes.shape({
      status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      lastReviewed: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    }),
    requirements: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        label: PropTypes.string.isRequired,
        note: PropTypes.string,
        status: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        state: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
    ),
    attachments: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        label: PropTypes.string,
        name: PropTypes.string,
        url: PropTypes.string,
        type: PropTypes.string,
        kind: PropTypes.string,
      }),
    ),
    activity: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        action: PropTypes.string.isRequired,
        note: PropTypes.string,
        actor: PropTypes.string.isRequired,
        timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      }),
    ),
  }).isRequired,
  currency: PropTypes.string.isRequired,
  timezone: PropTypes.string,
  canManage: PropTypes.bool,
  onApproveRelease: PropTypes.func,
  onHoldMilestone: PropTypes.func,
  onTrackEvent: PropTypes.func,
};

MilestoneCard.defaultProps = {
  timezone: undefined,
  canManage: false,
  onApproveRelease: undefined,
  onHoldMilestone: undefined,
  onTrackEvent: undefined,
};

export default function EscrowMilestoneTracker({
  milestones,
  currency,
  timezone,
  canManage,
  onApproveRelease,
  onHoldMilestone,
  onTrackEvent,
}) {
  const summary = useMemo(() => {
    const totals = milestones.reduce(
      (acc, milestone) => {
        const amount = Number(milestone.amount ?? milestone.releaseAmount ?? 0);
        if (Number.isFinite(amount)) {
          acc.total += amount;
        }
        if ((milestone.status ?? '').toString().toLowerCase() === 'released') {
          acc.released += amount;
        } else if ((milestone.status ?? '').toString().toLowerCase() === 'in_review') {
          acc.inReview += amount;
        } else if ((milestone.status ?? '').toString().toLowerCase() === 'blocked') {
          acc.onHold += amount;
        } else {
          acc.pending += amount;
        }
        if (milestone.riskScore != null) {
          acc.riskScores.push(Number(milestone.riskScore));
        }
        return acc;
      },
      { total: 0, released: 0, pending: 0, inReview: 0, onHold: 0, riskScores: [] },
    );

    const riskAverage = totals.riskScores.length
      ? totals.riskScores.reduce((acc, score) => acc + score, 0) / totals.riskScores.length
      : null;

    return {
      total: formatCurrency(totals.total, currency),
      released: formatCurrency(totals.released, currency),
      pending: formatCurrency(totals.pending, currency),
      inReview: formatCurrency(totals.inReview, currency),
      onHold: formatCurrency(totals.onHold, currency),
      progress: totals.total > 0 ? Math.min(100, Math.round((totals.released / totals.total) * 100)) : 0,
      riskAverage: riskAverage != null ? Math.round(riskAverage) : null,
    };
  }, [milestones, currency]);

  const orderedMilestones = useMemo(
    () =>
      [...milestones].sort((a, b) => {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
        if (aDate === bDate) {
          return (a.sequence ?? 0) - (b.sequence ?? 0);
        }
        return aDate - bDate;
      }),
    [milestones],
  );

  return (
    <section className="space-y-6 rounded-4xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Escrow milestone tracker</h2>
          <p className="mt-1 text-sm text-slate-500">
            Monitor release readiness, compliance checkpoints, and billing documentation across every funded milestone.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total in scope</p>
            <p className="text-lg font-semibold text-slate-900">{summary.total}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Released</p>
            <p className="text-lg font-semibold text-emerald-600">{summary.released}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pending</p>
            <p className="text-lg font-semibold text-slate-900">{summary.pending}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-900/5 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Progress</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/70">
              <div className="h-full rounded-full bg-emerald-500 transition" style={{ width: `${summary.progress}%` }} />
            </div>
            <span className="text-sm font-semibold text-slate-700">{summary.progress}%</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Under review</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">{summary.inReview}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">On hold</p>
          <p className="mt-2 text-sm font-semibold text-amber-600">{summary.onHold}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk average</p>
          <p className="mt-2 text-sm font-semibold text-rose-600">
            {summary.riskAverage != null ? `${summary.riskAverage}/100` : 'No risk scores logged'}
          </p>
        </div>
      </div>

      <ol className="space-y-6">
        {orderedMilestones.map((milestone) => (
          <li key={milestone.id} className="relative pl-6 sm:pl-10">
            <div className="absolute left-2 top-2 hidden h-full w-px bg-gradient-to-b from-slate-200 via-slate-200 to-transparent sm:block" />
            <span className="absolute left-0 top-0 hidden h-4 w-4 -translate-x-1/2 rounded-full border-4 border-white bg-blue-500 shadow sm:block" />
            <MilestoneCard
              milestone={milestone}
              currency={currency}
              timezone={timezone}
              canManage={canManage}
              onApproveRelease={onApproveRelease}
              onHoldMilestone={onHoldMilestone}
              onTrackEvent={onTrackEvent}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}

EscrowMilestoneTracker.propTypes = {
  milestones: PropTypes.arrayOf(MilestoneCard.propTypes.milestone).isRequired,
  currency: PropTypes.string,
  timezone: PropTypes.string,
  canManage: PropTypes.bool,
  onApproveRelease: PropTypes.func,
  onHoldMilestone: PropTypes.func,
  onTrackEvent: PropTypes.func,
};

EscrowMilestoneTracker.defaultProps = {
  currency: 'USD',
  timezone: undefined,
  canManage: false,
  onApproveRelease: undefined,
  onHoldMilestone: undefined,
  onTrackEvent: undefined,
};

import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowRightCircleIcon,
  BellAlertIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import DataStatus from '../DataStatus.jsx';

const STAGE_BLUEPRINT = [
  { id: 'awaiting', label: 'Awaiting funding', statuses: ['initiated', 'pending_funding'], tone: 'text-slate-600' },
  { id: 'funded', label: 'Funded', statuses: ['funded'], tone: 'text-sky-600' },
  { id: 'in_escrow', label: 'In escrow', statuses: ['in_escrow', 'held'], tone: 'text-blue-600' },
  { id: 'ready', label: 'Ready to release', statuses: ['pending_release'], tone: 'text-amber-600' },
  { id: 'released', label: 'Released', statuses: ['released'], tone: 'text-emerald-600' },
  { id: 'refunded', label: 'Refunded', statuses: ['refunded'], tone: 'text-slate-500' },
  { id: 'disputed', label: 'Disputed', statuses: ['disputed'], tone: 'text-rose-600' },
];

const STAGE_PROGRESS = {
  awaiting: 0.1,
  funded: 0.25,
  in_escrow: 0.55,
  ready: 0.8,
  released: 1,
  refunded: 1,
  disputed: 0.55,
};

function resolveStageId(status) {
  const match = STAGE_BLUEPRINT.find((stage) => stage.statuses.includes(status));
  return match?.id ?? 'in_escrow';
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toLocaleString()}`;
  }
}

function toDate(input) {
  if (!input) return null;
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatRelative(dateInput) {
  const date = toDate(dateInput);
  if (!date) {
    return 'Not scheduled';
  }
  const diffMs = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const minutes = Math.round(diffMs / (1000 * 60));
  if (Math.abs(minutes) < 60) {
    return rtf.format(minutes, 'minute');
  }
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 48) {
    return rtf.format(hours, 'hour');
  }
  const days = Math.round(hours / 24);
  return rtf.format(days, 'day');
}

function formatDate(dateInput) {
  const date = toDate(dateInput);
  if (!date) return 'Date pending';
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function computeMilestones(transactions) {
  return transactions.map((transaction) => {
    const stageId = resolveStageId(transaction.status);
    const scheduledAt =
      transaction.scheduledReleaseAt ||
      transaction.targetReleaseAt ||
      transaction.expectedReleaseAt ||
      transaction.dueOn ||
      transaction.dueAt ||
      null;
    const dueAt = toDate(scheduledAt);
    const updatedAt = toDate(transaction.updatedAt ?? transaction.createdAt);
    const overdue = Boolean(
      dueAt &&
        dueAt.getTime() < Date.now() &&
        !['released', 'refunded'].includes(transaction.status),
    );
    const dueSoon = Boolean(
      dueAt &&
        dueAt.getTime() >= Date.now() &&
        dueAt.getTime() - Date.now() <= 72 * 60 * 60 * 1000,
    );

    return {
      id: transaction.id,
      stageId,
      stageLabel: STAGE_BLUEPRINT.find((stage) => stage.id === stageId)?.label ?? 'In escrow',
      tone: STAGE_BLUEPRINT.find((stage) => stage.id === stageId)?.tone ?? 'text-slate-600',
      label: transaction.milestoneLabel || transaction.reference || `Milestone ${transaction.id}`,
      reference: transaction.reference,
      amount: transaction.amount,
      currency: transaction.currencyCode ?? transaction.currency ?? 'USD',
      status: transaction.status,
      dueAt,
      dueSoon,
      overdue,
      progress: STAGE_PROGRESS[stageId] ?? 0.5,
      account: transaction.account?.label || transaction.account?.provider || 'Escrow account',
      approvals: transaction.approvalState,
      updatedAt,
      transaction,
    };
  });
}

function aggregateMilestones(milestones) {
  return milestones.reduce(
    (acc, milestone) => {
      const next = { ...acc };
      next.totalAmount += Number(milestone.amount ?? 0);
      next.stageCounts[milestone.stageId] = (next.stageCounts[milestone.stageId] ?? 0) + 1;
      if (milestone.dueSoon) {
        next.dueSoon.push(milestone);
      }
      if (milestone.overdue) {
        next.overdue.push(milestone);
      }
      if (milestone.stageId === 'ready') {
        next.releaseReady.push(milestone);
      }
      if (
        milestone.dueAt &&
        !milestone.overdue &&
        ['ready', 'in_escrow', 'funded', 'awaiting'].includes(milestone.stageId)
      ) {
        next.nextReleaseCandidates.push(milestone);
      }
      return next;
    },
    {
      totalAmount: 0,
      stageCounts: {},
      dueSoon: [],
      overdue: [],
      releaseReady: [],
      nextReleaseCandidates: [],
    },
  );
}

function MilestoneRow({
  milestone,
  onInspect,
  onRelease,
  onRefund,
}) {
  const { stageId, tone, label, amount, currency, status, overdue, dueSoon, dueAt, account, progress } = milestone;
  const canRelease = ['ready', 'in_escrow', 'funded'].includes(stageId) && status !== 'released';
  const canRefund = ['ready', 'in_escrow', 'funded', 'disputed'].includes(stageId) && status !== 'refunded';

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{label}</h3>
          <p className="mt-1 text-xs text-slate-500">{account}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-slate-900">{formatCurrency(amount, currency)}</p>
          <p className={`text-xs font-semibold uppercase tracking-wide ${tone}`}>{status.replace(/_/g, ' ')}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <ClockIcon className="h-4 w-4" />
            {formatRelative(dueAt)}
          </span>
          <span className="text-xs text-slate-500">{formatDate(dueAt)}</span>
          {dueSoon ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
              <BellAlertIcon className="h-4 w-4" />
              Due soon
            </span>
          ) : null}
          {overdue ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
              <ExclamationTriangleIcon className="h-4 w-4" />
              Overdue
            </span>
          ) : null}
        </div>
        <div className="flex w-full items-center gap-2 lg:w-auto">
          <div className="h-2 flex-1 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500"
              style={{ width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }}
              aria-hidden="true"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500">{Math.round(progress * 100)}%</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onInspect(milestone)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            Inspect
          </button>
          <button
            type="button"
            onClick={() => onRelease(milestone)}
            disabled={!canRelease}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Release
          </button>
          <button
            type="button"
            onClick={() => onRefund(milestone)}
            disabled={!canRefund}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Refund
          </button>
        </div>
        {milestone.approvals ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            <ShieldCheckIcon className="h-4 w-4" />
            {milestone.approvals}
          </div>
        ) : null}
      </div>
    </article>
  );
}

MilestoneRow.propTypes = {
  milestone: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    stageId: PropTypes.string.isRequired,
    tone: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    currency: PropTypes.string,
    status: PropTypes.string.isRequired,
    overdue: PropTypes.bool,
    dueSoon: PropTypes.bool,
    dueAt: PropTypes.instanceOf(Date),
    account: PropTypes.string.isRequired,
    progress: PropTypes.number.isRequired,
    approvals: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    transaction: PropTypes.object.isRequired,
  }).isRequired,
  onInspect: PropTypes.func.isRequired,
  onRelease: PropTypes.func.isRequired,
  onRefund: PropTypes.func.isRequired,
};

export default function EscrowMilestoneTracker({
  transactions = [],
  loading = false,
  onInspect = () => {},
  onRelease = () => {},
  onRefund = () => {},
}) {
  const [stageFilter, setStageFilter] = useState('all');

  const milestones = useMemo(() => computeMilestones(transactions), [transactions]);
  const summary = useMemo(() => aggregateMilestones(milestones), [milestones]);

  const filtered = useMemo(() => {
    if (stageFilter === 'all') {
      return milestones;
    }
    return milestones.filter((milestone) => milestone.stageId === stageFilter);
  }, [milestones, stageFilter]);

  const nextRelease = useMemo(() => {
    if (summary.nextReleaseCandidates.length === 0) return null;
    return [...summary.nextReleaseCandidates].sort(
      (a, b) => a.dueAt.getTime() - b.dueAt.getTime(),
    )[0];
  }, [summary.nextReleaseCandidates]);

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Milestones</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Escrow milestone tracker</h2>
          <p className="mt-2 text-sm text-slate-600">
            Monitor milestone funding, approvals, and release readiness across every escrow-backed engagement.
          </p>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <CurrencyDollarIcon className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">In play</p>
              <p className="text-sm font-semibold text-slate-900">
                {formatCurrency(summary.totalAmount)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <ArrowRightCircleIcon className="h-5 w-5 text-sky-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Release ready</p>
              <p className="text-sm font-semibold text-slate-900">{summary.releaseReady.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-rose-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overdue</p>
              <p className="text-sm font-semibold text-slate-900">{summary.overdue.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <ClockIcon className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next release</p>
              <p className="text-sm font-semibold text-slate-900">
                {nextRelease ? formatRelative(nextRelease.dueAt) : 'TBC'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStageFilter('all')}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
            stageFilter === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({milestones.length})
        </button>
        {STAGE_BLUEPRINT.map((stage) => (
          <button
            key={stage.id}
            type="button"
            onClick={() => setStageFilter(stage.id)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              stageFilter === stage.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {stage.label} ({summary.stageCounts[stage.id] ?? 0})
          </button>
        ))}
      </div>

      <DataStatus loading={loading} empty={!loading && milestones.length === 0}>
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            No milestones match this filter yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((milestone) => (
              <MilestoneRow
                key={milestone.id}
                milestone={milestone}
                onInspect={(item) => onInspect(item.transaction)}
                onRelease={(item) => onRelease(item.transaction)}
                onRefund={(item) => onRefund(item.transaction)}
              />
            ))}
          </div>
        )}
      </DataStatus>

      {summary.overdue.length ? (
        <aside className="rounded-3xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">{summary.overdue.length} milestone{summary.overdue.length > 1 ? 's' : ''} overdue</p>
              <p className="mt-1 text-rose-600">
                Escalate with compliance or trigger refunds if delivery proof has lapsed.
              </p>
            </div>
          </div>
        </aside>
      ) : null}

      {summary.releaseReady.length ? (
        <aside className="rounded-3xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-semibold">{summary.releaseReady.length} milestone{summary.releaseReady.length > 1 ? 's' : ''} ready for release</p>
              <p className="mt-1 text-emerald-600">
                Release now or batch into a payout cycle once final approvals land.
              </p>
            </div>
          </div>
        </aside>
      ) : null}
    </section>
  );
}

EscrowMilestoneTracker.propTypes = {
  transactions: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  onInspect: PropTypes.func,
  onRelease: PropTypes.func,
  onRefund: PropTypes.func,
};


import { useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ArrowUpRightIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  HandRaisedIcon,
  ShieldCheckIcon,
  SparklesIcon,
  DocumentMagnifyingGlassIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import WalletStatusPill from '../../wallet/WalletStatusPill.jsx';
import {
  formatCurrency,
  formatDateTime,
  formatStatus,
} from '../../wallet/walletFormatting.js';

const STATUS_TOKENS = {
  awaiting_approval: 'bg-slate-200 text-slate-700',
  in_review: 'bg-amber-100 text-amber-700',
  approved: 'bg-blue-100 text-blue-700',
  scheduled: 'bg-emerald-100 text-emerald-700',
  released: 'bg-emerald-200 text-emerald-800',
  disputed: 'bg-rose-100 text-rose-700',
  refunded: 'bg-slate-100 text-slate-600',
};

function normalizeMilestone(input, fallbackCurrency, index) {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const id = input.id ?? input.transactionId ?? input.reference ?? `milestone-${index}`;
  const status = String(input.status ?? input.state ?? 'awaiting_approval').toLowerCase();
  const scheduledAt =
    input.scheduledAt ?? input.dueAt ?? input.dueDate ?? input.releaseAt ?? input.targetAt ?? null;
  const approvals = Array.isArray(input.approvals)
    ? input.approvals
    : Array.isArray(input.pendingApprovals)
    ? input.pendingApprovals
    : [];
  const reviewers = Array.isArray(input.reviewers)
    ? input.reviewers
    : Array.isArray(input.stakeholders)
    ? input.stakeholders
    : [];
  const riskScore = Number.isFinite(Number(input.riskScore))
    ? Number(input.riskScore)
    : input.disputed
    ? 92
    : input.alert
    ? 74
    : input.isHighValue
    ? 48
    : 18;
  const amount = Number.parseFloat(input.amount ?? input.value ?? input.total ?? input.releaseAmount ?? 0) || 0;
  const currency = input.currency ?? input.currencyCode ?? fallbackCurrency ?? 'USD';
  const automation =
    input.automation ?? input.releaseAutomation ?? (input.requiresManualApproval ? 'manual' : 'auto');
  const evidence = Array.isArray(input.evidence) ? input.evidence : [];
  const notes = Array.isArray(input.notes)
    ? input.notes
    : input.note
    ? [input.note]
    : input.summary
    ? [input.summary]
    : [];

  return {
    id,
    title: input.title ?? input.milestoneLabel ?? input.name ?? `Milestone ${index + 1}`,
    description:
      input.description ??
      input.scope ??
      input.context ??
      'Track deliverables, approvals, and readiness notes before funds release.',
    amount,
    currency,
    status,
    scheduledAt,
    automation,
    approvals,
    reviewers,
    evidence,
    notes,
    owner: input.owner ?? input.assignee ?? input.vendor ?? null,
    releaseEligible: Boolean(input.releaseEligible ?? input.readyToRelease ?? status === 'scheduled'),
    releaseTransactionId: input.transactionId ?? input.releaseTransactionId ?? null,
    riskScore: Math.min(Math.max(Number.isFinite(riskScore) ? riskScore : 0, 0), 100),
    updatedAt: input.updatedAt ?? input.statusChangedAt ?? input.createdAt ?? null,
    health: input.health ?? input.status ?? 'active',
    disputed: Boolean(input.disputed || status === 'disputed'),
  };
}

function MilestoneActionButtons({ milestone, onApprove, onRelease, onEscalate, pendingAction }) {
  const disableAll = pendingAction != null;
  const busyApprove = pendingAction === `approve:${milestone.id}`;
  const busyRelease = pendingAction === `release:${milestone.id}`;
  const busyEscalate = pendingAction === `escalate:${milestone.id}`;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-3">
      {onApprove ? (
        <button
          type="button"
          disabled={disableAll}
          onClick={() => onApprove(milestone)}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
            busyApprove
              ? 'bg-blue-200 text-blue-800'
              : 'bg-blue-600 text-white hover:bg-blue-500 shadow'
          }`}
        >
          {busyApprove ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <CheckBadgeIcon className="h-4 w-4" aria-hidden="true" />
          )}
          {busyApprove ? 'Approving…' : 'Approve evidence'}
        </button>
      ) : null}
      {onRelease ? (
        <button
          type="button"
          disabled={disableAll || !milestone.releaseEligible}
          onClick={() => onRelease(milestone)}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
            busyRelease
              ? 'bg-emerald-200 text-emerald-800'
              : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow'
          } ${milestone.releaseEligible ? '' : 'opacity-60 cursor-not-allowed'}`}
        >
          {busyRelease ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
          )}
          {busyRelease ? 'Releasing…' : 'Release funds'}
        </button>
      ) : null}
      {onEscalate ? (
        <button
          type="button"
          disabled={disableAll}
          onClick={() => onEscalate(milestone)}
          className={`inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition focus:outline-none focus:ring-2 focus:ring-rose-200 ${
            busyEscalate ? 'opacity-80' : 'hover:bg-rose-100'
          }`}
        >
          {busyEscalate ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <HandRaisedIcon className="h-4 w-4" aria-hidden="true" />
          )}
          {busyEscalate ? 'Escalating…' : 'Escalate / dispute'}
        </button>
      ) : null}
    </div>
  );
}

MilestoneActionButtons.propTypes = {
  milestone: PropTypes.object.isRequired,
  onApprove: PropTypes.func,
  onRelease: PropTypes.func,
  onEscalate: PropTypes.func,
  pendingAction: PropTypes.string,
};

MilestoneActionButtons.defaultProps = {
  onApprove: null,
  onRelease: null,
  onEscalate: null,
  pendingAction: null,
};

function EvidenceList({ evidence }) {
  if (!evidence.length) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-white/60 p-3 text-xs text-slate-600">
      <p className="flex items-center gap-2 font-semibold uppercase tracking-wide text-slate-500">
        <DocumentMagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" /> Evidence package
      </p>
      <ul className="space-y-1">
        {evidence.map((item) => (
          <li key={item.id ?? item.href ?? item.label} className="flex items-center justify-between gap-3">
            <span className="font-medium text-slate-700">{item.label ?? item.name ?? 'Attachment'}</span>
            {item.href ? (
              <a
                href={item.href}
                className="inline-flex items-center gap-1 text-blue-600 transition hover:text-blue-800"
              >
                View
                <ArrowUpRightIcon className="h-3 w-3" aria-hidden="true" />
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

EvidenceList.propTypes = {
  evidence: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
      name: PropTypes.string,
      href: PropTypes.string,
    }),
  ),
};

EvidenceList.defaultProps = {
  evidence: [],
};

export default function EscrowMilestoneTracker({
  milestones,
  releaseQueue,
  summary,
  riskInsights,
  currency,
  onApproveMilestone,
  onReleaseMilestone,
  onEscalateMilestone,
  onRefresh,
}) {
  const normalizedMilestones = useMemo(() => {
    const list = [];
    if (Array.isArray(milestones)) {
      milestones.forEach((milestone, index) => {
        const normalized = normalizeMilestone(milestone, currency, index);
        if (normalized) {
          list.push(normalized);
        }
      });
    }
    if (!list.length && Array.isArray(releaseQueue)) {
      releaseQueue.forEach((entry, index) => {
        const normalized = normalizeMilestone(
          {
            ...entry,
            status: entry.status ?? (entry.releaseEligible ? 'scheduled' : 'awaiting_approval'),
            title: entry.milestoneLabel ?? entry.reference ?? `Queued release ${index + 1}`,
            approvals: entry.pendingApprovals ?? [],
          },
          currency,
          index,
        );
        if (normalized) {
          list.push(normalized);
        }
      });
    }
    return list
      .map((item, index) => ({ ...item, timelineIndex: index }))
      .sort((a, b) => {
        const aDate = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Infinity;
        const bDate = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Infinity;
        return aDate - bDate;
      });
  }, [milestones, releaseQueue, currency]);

  const totals = useMemo(() => {
    const total = normalizedMilestones.reduce((acc, milestone) => acc + milestone.amount, 0);
    const released = normalizedMilestones
      .filter((milestone) => milestone.status === 'released')
      .reduce((acc, milestone) => acc + milestone.amount, 0);
    const disputed = normalizedMilestones
      .filter((milestone) => milestone.disputed)
      .reduce((acc, milestone) => acc + milestone.amount, 0);
    const upcoming = normalizedMilestones.find((milestone) => milestone.status !== 'released');

    return {
      total,
      released,
      disputed,
      upcoming,
      percentage: total ? Math.round((released / total) * 100) : 0,
    };
  }, [normalizedMilestones]);

  const insight = useMemo(() => {
    if (riskInsights && typeof riskInsights === 'object') {
      return {
        headline: riskInsights.headline ?? 'Automation health',
        narrative:
          riskInsights.narrative ??
          'Monitor milestone readiness, evidence coverage, and risk thresholds before releasing funds.',
        score: Number.isFinite(Number(riskInsights.score)) ? Number(riskInsights.score) : totals.percentage,
        breaches: Array.isArray(riskInsights.breaches) ? riskInsights.breaches : [],
      };
    }

    const flagged = normalizedMilestones.filter((milestone) => milestone.disputed || milestone.riskScore >= 70);
    return {
      headline: 'Automation & risk posture',
      narrative:
        'All milestones run through dual-control approvals, evidence packages, and compliance checks before release.',
      score: totals.percentage,
      breaches: flagged.map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        severity: milestone.riskScore >= 80 ? 'High severity' : 'Monitor',
        message: milestone.disputed
          ? 'Dispute in progress — review supporting documentation before resolving.'
          : 'Pending manual review — ensure approvals arrive before scheduled release.',
      })),
    };
  }, [riskInsights, normalizedMilestones, totals.percentage]);

  const [pendingAction, setPendingAction] = useState(null);

  const runAsync = useCallback(async (handler, milestone, key) => {
    if (!handler) {
      return;
    }
    const result = handler(milestone);
    if (result && typeof result.then === 'function') {
      try {
        setPendingAction(key);
        await result;
      } finally {
        setPendingAction(null);
      }
    }
  }, []);

  const handleApprove = useCallback(
    (milestone) => runAsync(onApproveMilestone, milestone, `approve:${milestone.id}`),
    [onApproveMilestone, runAsync],
  );
  const handleRelease = useCallback(
    (milestone) => runAsync(onReleaseMilestone, milestone, `release:${milestone.id}`),
    [onReleaseMilestone, runAsync],
  );
  const handleEscalate = useCallback(
    (milestone) => runAsync(onEscalateMilestone, milestone, `escalate:${milestone.id}`),
    [onEscalateMilestone, runAsync],
  );

  const automationMode = summary?.automationMode ?? 'Dual control';
  const coverage = summary?.coverage ?? normalizedMilestones.length;
  const pendingApprovals = normalizedMilestones.reduce((acc, milestone) => acc + milestone.approvals.length, 0);

  return (
    <section className="space-y-6 rounded-[2.5rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-6 shadow-lg shadow-blue-100/40 sm:p-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Escrow milestone governance</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Milestone release tracker</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Visualise every escrow checkpoint, approvals, and risk signals before funds release. Automation keeps finance,
            legal, and delivery teams aligned while preserving an auditable trail of decisions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full bg-slate-900/5 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
            {automationMode}
          </div>
          <div className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow">
            {coverage} checkpoints
          </div>
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Refresh data
            </button>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total escrowed</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {formatCurrency(totals.total, summary?.currency ?? currency)}
          </p>
          <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-emerald-600">
            <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> {totals.percentage}% released
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending approvals</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{pendingApprovals}</p>
          <p className="mt-2 text-xs text-slate-500">Stakeholders reviewing evidence packages.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Disputed exposure</p>
          <p className="mt-2 text-3xl font-semibold text-rose-600">
            {formatCurrency(totals.disputed, summary?.currency ?? currency)}
          </p>
          <p className="mt-2 text-xs text-rose-500">Escalated for compliance review.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-900 text-white p-5 shadow-sm shadow-blue-200/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Next release</p>
          <p className="mt-2 text-xl font-semibold">
            {totals.upcoming
              ? `${totals.upcoming.title}`
              : 'All milestones cleared'}
          </p>
          <p className="mt-1 text-sm text-white/70">
            {totals.upcoming?.scheduledAt ? formatDateTime(totals.upcoming.scheduledAt) : 'Awaiting new milestone'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          {normalizedMilestones.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-12 text-center">
              <SparklesIcon className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-semibold text-slate-800">No milestones logged yet</h3>
              <p className="mt-2 text-sm text-slate-500">
                Add milestones from your project workspace or import checkpoints from contracts to orchestrate escrow releases.
              </p>
            </div>
          ) : (
            <ol className="relative space-y-6 border-l-2 border-slate-200 pl-6">
              {normalizedMilestones.map((milestone, index) => {
                const palette = STATUS_TOKENS[milestone.status] ?? STATUS_TOKENS.awaiting_approval;
                const accent =
                  milestone.status === 'released'
                    ? 'bg-emerald-500'
                    : milestone.disputed
                    ? 'bg-rose-500'
                    : milestone.releaseEligible
                    ? 'bg-blue-500'
                    : 'bg-slate-300';

                return (
                  <li key={milestone.id} className="space-y-4">
                    <span
                      className={`absolute -left-[11px] mt-2 h-5 w-5 rounded-full border-4 border-white shadow ${accent}`}
                    />
                    <article className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="flex items-center gap-3">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${palette}`}>
                              {formatStatus(milestone.status)}
                            </span>
                            {milestone.scheduledAt ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
                                {formatDateTime(milestone.scheduledAt)}
                              </span>
                            ) : null}
                          </p>
                          <h3 className="mt-3 text-lg font-semibold text-slate-900">{milestone.title}</h3>
                          <p className="mt-2 text-sm text-slate-600">{milestone.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</p>
                          <p className="mt-1 text-xl font-semibold text-slate-900">
                            {formatCurrency(milestone.amount, milestone.currency ?? currency)}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">Risk score {milestone.riskScore}%</p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white/60 p-3">
                          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <UserGroupIcon className="h-4 w-4" aria-hidden="true" /> Approvals
                          </p>
                          {milestone.approvals.length ? (
                            <ul className="mt-2 space-y-1 text-sm text-slate-600">
                              {milestone.approvals.map((approval) => (
                                <li key={approval.id ?? approval.email ?? approval}>
                                  {approval.name ?? approval.displayName ?? approval.email ?? approval}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-2 text-sm text-slate-500">No approvals requested yet.</p>
                          )}
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white/60 p-3">
                          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" /> Automation mode
                          </p>
                          <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                            <span className="font-semibold text-slate-700">{milestone.automation}</span>
                            <WalletStatusPill value={milestone.health} />
                          </div>
                          {milestone.owner ? (
                            <p className="mt-2 text-xs text-slate-500">Owner: {milestone.owner.name ?? milestone.owner}</p>
                          ) : null}
                        </div>
                      </div>

                      {milestone.notes.length ? (
                        <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-700">
                          <p className="font-semibold uppercase tracking-wide">Progress notes</p>
                          <ul className="mt-2 space-y-1">
                            {milestone.notes.map((note, noteIndex) => (
                              <li key={`${milestone.id}-note-${noteIndex}`}>{note}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      <EvidenceList evidence={milestone.evidence} />

                      <MilestoneActionButtons
                        milestone={milestone}
                        onApprove={onApproveMilestone ? handleApprove : null}
                        onRelease={onReleaseMilestone ? handleRelease : null}
                        onEscalate={onEscalateMilestone ? handleEscalate : null}
                        pendingAction={pendingAction}
                      />
                    </article>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <SparklesIcon className="h-4 w-4" aria-hidden="true" /> {insight.headline}
            </p>
            <p className="mt-3 text-lg font-semibold text-slate-900">
              Automation score {Math.round(insight.score)}%
            </p>
            <p className="mt-2 text-sm text-slate-600">{insight.narrative}</p>
            {insight.breaches.length ? (
              <ul className="mt-4 space-y-3">
                {insight.breaches.map((breach) => (
                  <li key={breach.id} className="rounded-2xl border border-rose-100 bg-rose-50/70 p-3 text-xs text-rose-600">
                    <p className="font-semibold">{breach.title}</p>
                    <p className="mt-1 text-rose-500">{breach.message}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" /> Release timeline
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Scheduled releases align with compliance guardrails. Every change is logged for audit readiness.
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              {normalizedMilestones.slice(0, 4).map((milestone) => (
                <li key={`timeline-${milestone.id}`} className="flex items-center justify-between gap-4">
                  <span className="font-medium text-slate-700">{milestone.title}</span>
                  <span className="text-xs text-slate-500">
                    {milestone.scheduledAt ? formatDateTime(milestone.scheduledAt) : 'Date pending'}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 text-amber-800 shadow-sm">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
              <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" /> Risk alerts
            </p>
            <p className="mt-3 text-sm">
              Triaged automatically with escalation paths to compliance and legal for fast resolution.
            </p>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wide">Active alerts</p>
            <p className="mt-2 text-2xl font-semibold">
              {normalizedMilestones.filter((milestone) => milestone.disputed || milestone.riskScore >= 70).length}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}

EscrowMilestoneTracker.propTypes = {
  milestones: PropTypes.arrayOf(PropTypes.object),
  releaseQueue: PropTypes.arrayOf(PropTypes.object),
  summary: PropTypes.shape({
    currency: PropTypes.string,
    automationMode: PropTypes.string,
    coverage: PropTypes.number,
  }),
  riskInsights: PropTypes.shape({
    headline: PropTypes.string,
    narrative: PropTypes.string,
    score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    breaches: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        title: PropTypes.string,
        severity: PropTypes.string,
        message: PropTypes.string,
      }),
    ),
  }),
  currency: PropTypes.string,
  onApproveMilestone: PropTypes.func,
  onReleaseMilestone: PropTypes.func,
  onEscalateMilestone: PropTypes.func,
  onRefresh: PropTypes.func,
};

EscrowMilestoneTracker.defaultProps = {
  milestones: [],
  releaseQueue: [],
  summary: null,
  riskInsights: null,
  currency: 'USD',
  onApproveMilestone: null,
  onReleaseMilestone: null,
  onEscalateMilestone: null,
  onRefresh: null,
};

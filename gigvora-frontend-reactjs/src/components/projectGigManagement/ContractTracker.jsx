import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { format, formatDistanceToNow, isBefore, parseISO } from 'date-fns';

const STATUS_BADGES = {
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
  scheduled: 'bg-slate-100 text-slate-600 border-slate-200',
  in_progress: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  blocked: 'bg-amber-100 text-amber-700 border-amber-200',
  overdue: 'bg-rose-100 text-rose-700 border-rose-200',
};

const RISK_BADGES = {
  high: 'bg-rose-100 text-rose-700 border-rose-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  try {
    return parseISO(value);
  } catch (error) {
    return null;
  }
}

function formatDate(value, fallback = '—') {
  const date = parseDate(value);
  if (!date) return fallback;
  try {
    return format(date, 'd MMM');
  } catch (error) {
    return fallback;
  }
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return `${currency} 0`;
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toLocaleString()}`;
  }
}

function MilestoneNode({ milestone, isActive, onSelect, onComplete }) {
  const dueDate = parseDate(milestone.dueAt ?? milestone.targetAt);
  const statusTone = STATUS_BADGES[milestone.status] ?? STATUS_BADGES.pending;
  const overdue = dueDate ? isBefore(dueDate, new Date()) && milestone.status !== 'completed' : false;

  const handleSelect = () => {
    onSelect?.(milestone);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={`flex w-full items-center gap-3 rounded-3xl border px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
        isActive ? 'border-indigo-400 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-200'
      }`}
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
        {milestone.order ?? '•'}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold text-slate-900">{milestone.title ?? 'Milestone'}</h4>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusTone}`}>
            {milestone.status?.replace(/_/g, ' ') ?? 'pending'}
          </span>
          {overdue ? (
            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-rose-600">
              Overdue
            </span>
          ) : null}
        </div>
        <p className="text-xs text-slate-500">
          {dueDate ? `${formatDate(dueDate)} · ${formatDistanceToNow(dueDate, { addSuffix: true })}` : 'Schedule pending'}
        </p>
        {milestone.summary ? <p className="text-xs text-slate-500">{milestone.summary}</p> : null}
      </div>
      {onComplete && milestone.status !== 'completed' ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onComplete(milestone);
          }}
          className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500 hover:text-white"
        >
          Mark done
        </button>
      ) : null}
    </div>
  );
}

MilestoneNode.propTypes = {
  milestone: PropTypes.object.isRequired,
  isActive: PropTypes.bool,
  onSelect: PropTypes.func,
  onComplete: PropTypes.func,
};

MilestoneNode.defaultProps = {
  isActive: false,
  onSelect: undefined,
  onComplete: undefined,
};

export default function ContractTracker({ tracker, canManage, onCompleteMilestone, onAcknowledgeRisk, onEscalate }) {
  const milestones = useMemo(
    () => (Array.isArray(tracker?.milestones) ? tracker.milestones : []),
    [tracker?.milestones],
  );
  const payments = Array.isArray(tracker?.payments) ? tracker.payments : [];
  const risks = Array.isArray(tracker?.risks) ? tracker.risks : [];
  const [activeMilestoneId, setActiveMilestoneId] = useState(milestones[0]?.id ?? null);

  const activeMilestone = useMemo(
    () => milestones.find((milestone) => milestone.id === activeMilestoneId) ?? milestones[0] ?? null,
    [milestones, activeMilestoneId],
  );

  const contractCurrency = tracker?.currency ?? tracker?.contract?.currency ?? 'USD';
  const summary = tracker?.summary ?? {};

  const paymentTotals = useMemo(() => {
    return payments.reduce(
      (acc, payment) => {
        const amount = Number(payment.amount);
        if (!Number.isFinite(amount)) {
          return acc;
        }
        if (payment.status === 'released' || payment.status === 'paid') {
          acc.released += amount;
        } else if (payment.status === 'pending') {
          acc.pending += amount;
        } else if (payment.status === 'held') {
          acc.held += amount;
        }
        acc.total += amount;
        return acc;
      },
      { total: 0, released: 0, pending: 0, held: 0 },
    );
  }, [payments]);

  const riskCounts = useMemo(() => {
    return risks.reduce(
      (acc, risk) => {
        const level = risk.level ?? risk.severity ?? 'low';
        acc[level] = (acc[level] ?? 0) + 1;
        return acc;
      },
      { high: 0, medium: 0, low: 0 },
    );
  }, [risks]);

  const completionPercent = useMemo(() => {
    if (!milestones.length) return 0;
    const completed = milestones.filter((milestone) => milestone.status === 'completed' || milestone.status === 'approved').length;
    return Math.round((completed / milestones.length) * 100);
  }, [milestones]);

  const handleMilestoneComplete = async (milestone) => {
    if (!onCompleteMilestone || !canManage) return;
    await onCompleteMilestone(milestone.id, milestone);
  };

  const handleRiskAcknowledge = async (risk) => {
    if (!onAcknowledgeRisk || !canManage) return;
    await onAcknowledgeRisk(risk.id, risk);
  };

  const handleEscalate = async (risk) => {
    if (!onEscalate || !canManage) return;
    await onEscalate(risk.id, risk);
  };

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-indigo-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Contract health</p>
            <h3 className="text-2xl font-semibold text-slate-900">Track delivery confidence</h3>
            <p className="text-sm text-slate-500">{completionPercent}% milestones complete · {formatCurrency(paymentTotals.released, contractCurrency)} released</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
              Health {summary.healthScore ?? '—'}
            </div>
            <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              Owner {tracker?.contract?.owner?.name ?? tracker?.owner ?? 'Assign'}
            </div>
          </div>
        </div>
        <dl className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total contract</dt>
            <dd className="mt-2 text-xl font-semibold text-slate-900">{formatCurrency(summary.contractValue ?? paymentTotals.total, contractCurrency)}</dd>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-emerald-700">
            <dt className="text-xs font-semibold uppercase tracking-wide">Released</dt>
            <dd className="mt-2 text-xl font-semibold">{formatCurrency(paymentTotals.released, contractCurrency)}</dd>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-amber-700">
            <dt className="text-xs font-semibold uppercase tracking-wide">Pending</dt>
            <dd className="mt-2 text-xl font-semibold">{formatCurrency(paymentTotals.pending, contractCurrency)}</dd>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-rose-700">
            <dt className="text-xs font-semibold uppercase tracking-wide">Risks</dt>
            <dd className="mt-2 text-xl font-semibold">{riskCounts.high + riskCounts.medium + riskCounts.low}</dd>
          </div>
        </dl>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Milestones</h4>
          <div className="space-y-3">
            {milestones.length ? (
              milestones.map((milestone) => (
                <MilestoneNode
                  key={milestone.id ?? milestone.title}
                  milestone={milestone}
                  isActive={activeMilestone?.id === milestone.id}
                  onSelect={(current) => setActiveMilestoneId(current.id)}
                  onComplete={canManage ? handleMilestoneComplete : undefined}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                No milestones defined yet.
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          {activeMilestone ? (
            <div className="space-y-3">
              <header className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active milestone</p>
                <h4 className="text-xl font-semibold text-slate-900">{activeMilestone.title ?? 'Milestone'}</h4>
                <p className="text-xs text-slate-500">
                  Due {formatDate(activeMilestone.dueAt ?? activeMilestone.targetAt)} · {formatDistanceToNow(parseDate(activeMilestone.dueAt ?? activeMilestone.targetAt) ?? new Date(), { addSuffix: true })}
                </p>
              </header>
              <p className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                {activeMilestone.summary || 'Outline objectives, deliverables, and review gates for this milestone.'}
              </p>
              {Array.isArray(activeMilestone.checklist) && activeMilestone.checklist.length ? (
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Checklist</h5>
                  <ul className="space-y-2 text-sm">
                    {activeMilestone.checklist.map((item) => (
                      <li key={item.id ?? item.label} className="flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                          item.complete ? 'bg-emerald-500 text-white' : 'bg-white text-slate-500'
                        }`}
                        >
                          {item.complete ? '✓' : '•'}
                        </span>
                        <span className="text-slate-700">{item.label ?? item.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {Array.isArray(activeMilestone.documents) && activeMilestone.documents.length ? (
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Documents</h5>
                  <ul className="space-y-2 text-sm">
                    {activeMilestone.documents.map((document) => (
                      <li key={document.id ?? document.name} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100">
                        <span className="text-slate-700">{document.name ?? 'Attachment'}</span>
                        <a
                          href={document.url ?? '#'}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          View
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              Select a milestone to view details.
            </div>
          )}

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <header className="flex items-center justify-between">
              <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risks</h5>
              <div className="flex gap-2 text-xs font-semibold">
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-600">High {riskCounts.high}</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-600">Medium {riskCounts.medium}</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-600">Low {riskCounts.low}</span>
              </div>
            </header>
            <div className="space-y-2">
              {risks.length ? (
                risks.map((risk) => (
                  <div key={risk.id ?? risk.title} className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800">{risk.title ?? 'Risk item'}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                        RISK_BADGES[risk.level ?? risk.severity ?? 'low'] ?? RISK_BADGES.low
                      }`}
                      >
                        {(risk.level ?? risk.severity ?? 'low').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{risk.description ?? 'Describe the potential impact and mitigation plan.'}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold">Owner {risk.owner?.name ?? 'Unassigned'}</span>
                      {risk.acknowledgedAt ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                          Acknowledged {formatDistanceToNow(parseDate(risk.acknowledgedAt) ?? new Date(), { addSuffix: true })}
                        </span>
                      ) : null}
                    </div>
                    {canManage ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleRiskAcknowledge(risk)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-600"
                        >
                          Acknowledge
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEscalate(risk)}
                          className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-500 hover:text-white"
                        >
                          Escalate
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                  No risks logged.
                </div>
              )}
            </div>
          </section>

          <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h5 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Approvals & signatures</h5>
            <ul className="space-y-2 text-sm">
              {Array.isArray(tracker?.approvals) && tracker.approvals.length ? (
                tracker.approvals.map((approval) => (
                  <li key={approval.id ?? approval.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                    <span className="text-slate-700">{approval.name ?? 'Approval'}</span>
                    <span className="text-xs font-semibold text-slate-500">{approval.status ?? 'pending'}</span>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                  No approval records yet.
                </li>
              )}
            </ul>
          </section>
        </aside>
      </div>
    </section>
  );
}

ContractTracker.propTypes = {
  tracker: PropTypes.shape({
    milestones: PropTypes.array,
    payments: PropTypes.array,
    risks: PropTypes.array,
    approvals: PropTypes.array,
    summary: PropTypes.object,
    currency: PropTypes.string,
    contract: PropTypes.object,
  }),
  canManage: PropTypes.bool,
  onCompleteMilestone: PropTypes.func,
  onAcknowledgeRisk: PropTypes.func,
  onEscalate: PropTypes.func,
};

ContractTracker.defaultProps = {
  tracker: null,
  canManage: false,
  onCompleteMilestone: undefined,
  onAcknowledgeRisk: undefined,
  onEscalate: undefined,
};

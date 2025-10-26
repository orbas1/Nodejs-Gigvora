import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { formatDateLabel, formatRelativeTime } from '../../utils/date.js';

const STATUS_BADGES = {
  onTrack: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  atRisk: 'bg-amber-50 text-amber-700 border-amber-200',
  blocked: 'bg-rose-50 text-rose-700 border-rose-200',
  archived: 'bg-slate-100 text-slate-500 border-slate-200',
};

const SEVERITY_OPTIONS = [
  { id: 'all', label: 'All severities' },
  { id: 'high', label: 'High priority', tone: 'border-rose-200 bg-rose-50 text-rose-700' },
  { id: 'medium', label: 'Medium', tone: 'border-amber-200 bg-amber-50 text-amber-700' },
  { id: 'low', label: 'Low', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
];

function computePhaseProgress(phases) {
  if (!phases?.length) return 0;
  const total = phases.length;
  const completed = phases.filter((phase) => phase.status === 'done').length;
  const inProgress = phases.some((phase) => phase.status === 'in_progress') ? 0.5 : 0;
  return Math.round(((completed + inProgress) / total) * 100);
}

function computeFinancialProgress(financials) {
  if (!financials || !financials.totalValue) return 0;
  const paid = financials.paidToDate ?? 0;
  return Math.min(Math.round((paid / financials.totalValue) * 100), 100);
}

function ContractTracker({ contract, persona, onObligationToggle, updating }) {
  const obligations = contract.obligations ?? [];
  const deliverables = contract.deliverables ?? [];
  const [severityFilter, setSeverityFilter] = useState('all');
  const [completedObligations, setCompletedObligations] = useState(() =>
    new Set(obligations.filter((item) => item.completed).map((item) => item.id)),
  );

  useEffect(() => {
    setCompletedObligations(new Set(obligations.filter((item) => item.completed).map((item) => item.id)));
  }, [obligations]);

  const phaseProgress = useMemo(() => computePhaseProgress(contract.phases), [contract.phases]);
  const financialProgress = useMemo(() => computeFinancialProgress(contract.financials), [contract.financials]);

  const filteredObligations = useMemo(() => {
    if (severityFilter === 'all') return obligations;
    return obligations.filter((item) => item.severity === severityFilter);
  }, [obligations, severityFilter]);

  const renewalWindow = useMemo(() => {
    if (!contract.renewal?.targetDate) return null;
    const target = new Date(contract.renewal.targetDate);
    const now = new Date();
    const msDiff = target - now;
    return Math.max(Math.floor(msDiff / (1000 * 60 * 60 * 24)), -1);
  }, [contract.renewal?.targetDate]);

  const healthScore = useMemo(() => {
    const base = phaseProgress * 0.3 + financialProgress * 0.2;
    const outstanding = obligations.filter((item) => !completedObligations.has(item.id)).length;
    const riskPenalty = (contract.risks?.filter((risk) => risk.severity === 'high').length ?? 0) * 5;
    const cadenceBonus = contract.touchpoints?.length > 2 ? 10 : 0;
    return Math.max(0, Math.min(100, Math.round(base + cadenceBonus - outstanding * 3 - riskPenalty)));
  }, [phaseProgress, financialProgress, obligations, completedObligations, contract.risks, contract.touchpoints]);

  const handleObligationToggle = (obligation) => {
    if (updating) {
      return;
    }
    const next = new Set(completedObligations);
    if (next.has(obligation.id)) {
      next.delete(obligation.id);
    } else {
      next.add(obligation.id);
    }
    setCompletedObligations(next);
    onObligationToggle?.(obligation, next.has(obligation.id));
  };

  return (
    <div className="rounded-[40px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100/60 p-10 shadow-soft">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Contract operations</p>
          <h2 className="text-3xl font-semibold text-slate-900">Contract Tracker</h2>
          <p className="text-sm text-slate-600">
            Monitor delivery, obligations, and renewal health with enterprise-grade transparency tailored to {persona} teams.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <BadgeMetric label="Health" value={`${healthScore}/100`} tone={healthScore > 75 ? 'emerald' : healthScore > 50 ? 'amber' : 'rose'} />
          <BadgeMetric label="Phase progress" value={`${phaseProgress}%`} tone="indigo" />
          <BadgeMetric label="Paid" value={`${financialProgress}%`} tone="purple" />
        </div>
      </header>

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{contract.title}</h3>
                <p className="text-sm text-slate-500">{contract.counterpart}</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p className="font-semibold text-slate-700">
                  {contract.financials?.currency ?? contract.currency ?? 'USD'}{' '}
                  {contract.financials?.totalValue?.toLocaleString() ?? contract.value?.toLocaleString() ?? '—'}
                </p>
                <p>{formatDateLabel(contract.startDate)} – {formatDateLabel(contract.endDate)}</p>
                <span
                  className={`mt-2 inline-flex rounded-full border px-3 py-1 font-semibold ${
                    STATUS_BADGES[contract.statusKey ?? 'onTrack'] ?? STATUS_BADGES.onTrack
                  }`}
                >
                  {contract.statusLabel ?? 'On track'}
                </span>
              </div>
            </header>

            <PhaseTimeline phases={contract.phases} />

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {contract.financials ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">Financial cadence</p>
                  <p className="mt-2">Paid to date {contract.financials.currency} {contract.financials.paidToDate?.toLocaleString() ?? '—'}</p>
                  <p className="mt-1">Upcoming {contract.financials.currency} {contract.financials.upcoming?.toLocaleString() ?? '—'}</p>
                  <p className="mt-1 text-[11px]">Burn rate {contract.financials.burnRate ?? '—'} / month</p>
                </div>
              ) : null}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">Touchpoints</p>
                <ul className="mt-2 space-y-1">
                  {(contract.touchpoints ?? ['Weekly ops review', 'Monthly exec sync']).map((touchpoint) => (
                    <li key={touchpoint}>• {touchpoint}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">Key metrics</p>
                <p className="mt-2">Renewal probability {contract.analytics?.renewalProbability ?? 68}%</p>
                <p className="mt-1">Satisfaction {contract.analytics?.satisfaction ?? 4.5}/5</p>
                <p className="mt-1">Compliance score {contract.analytics?.compliance ?? 92}%</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900">Obligations & deliverables</h3>
              <div className="flex flex-wrap gap-2">
                {SEVERITY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSeverityFilter(option.id)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                      severityFilter === option.id
                        ? option.tone ?? 'bg-slate-900 text-white border-transparent'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {filteredObligations.map((obligation) => {
                const checked = completedObligations.has(obligation.id);
                return (
                  <div
                    key={obligation.id}
                    className={`flex flex-col gap-3 rounded-2xl border p-4 text-sm transition ${
                      checked ? 'border-emerald-300 bg-emerald-50/80' : 'border-slate-200 bg-white hover:border-emerald-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border border-emerald-300 text-emerald-600 focus:ring-emerald-400"
                          checked={checked}
                          onChange={() => handleObligationToggle(obligation)}
                          disabled={updating}
                        />
                        <p className="font-semibold text-slate-800">{obligation.label}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-slate-100 px-3 py-1">Owner {obligation.owner ?? 'Unassigned'}</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1">
                          Due {formatDateLabel(obligation.dueDate)}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1">{obligation.type ?? 'Contract'}</span>
                        <span
                          className={`rounded-full px-3 py-1 font-semibold ${
                            obligation.severity === 'high'
                              ? 'bg-rose-100 text-rose-700'
                              : obligation.severity === 'medium'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {obligation.severity ?? 'low'}
                        </span>
                      </div>
                    </div>
                    {obligation.notes ? <p className="text-xs text-slate-500">{obligation.notes}</p> : null}
                    {updating && (
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Syncing update…</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">Delivery milestones</p>
                <ul className="mt-3 space-y-2">
                  {deliverables.map((deliverable) => (
                    <li key={deliverable.id} className="rounded-xl border border-slate-200 bg-white/70 p-3">
                      <p className="text-sm font-semibold text-slate-800">{deliverable.label}</p>
                      <p className="text-xs text-slate-500">
                        Due {formatDateLabel(deliverable.dueDate)} · {deliverable.stage ?? 'Planned'}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">Escalation map</p>
                <ul className="mt-3 space-y-2">
                  {(contract.escalationContacts ?? []).map((contact) => (
                    <li key={contact.name}>
                      {contact.name} · {contact.role} · {contact.responseSla ?? '4h SLA'}
                    </li>
                  ))}
                </ul>
                {!contract.escalationContacts?.length ? (
                  <p className="text-xs text-slate-500">Assign escalation owners to ensure rapid unblock.</p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-rose-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Risk & watchlist</h3>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {(contract.risks ?? []).map((risk) => (
                <div key={risk.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
                  <p className="text-sm font-semibold text-rose-800">{risk.label}</p>
                  <p className="mt-2">Severity {risk.severity ?? 'medium'} · Owner {risk.owner ?? 'Unassigned'}</p>
                  <p className="mt-2 text-[11px] text-rose-600">{risk.mitigation}</p>
                </div>
              ))}
            </div>
            {!contract.risks?.length ? (
              <p className="text-xs text-rose-600">No active risks logged. Capture assumptions to maintain audit trails.</p>
            ) : null}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Activity stream</h3>
            <ul className="mt-4 space-y-3 text-xs text-slate-500">
              {(contract.activity ?? []).map((entry) => (
                <li key={entry.timestamp + entry.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-700">{entry.label}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {formatRelativeTime(entry.timestamp)} · {entry.actor ?? entry.persona ?? 'System'}
                  </p>
                  {entry.details ? <p className="mt-1 text-slate-500">{entry.details}</p> : null}
                </li>
              ))}
            </ul>
            {!contract.activity?.length ? (
              <p className="mt-4 text-xs text-slate-500">Track comments, approvals, and escalations to keep everyone aligned.</p>
            ) : null}
          </section>

          <section className="rounded-3xl border border-indigo-100 bg-indigo-50/80 p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Renewal strategy</h3>
            {contract.renewal ? (
              <div className="space-y-3 text-sm text-indigo-700">
                <p>
                  Option {contract.renewal.option ?? 'Review'} · Notice period{' '}
                  {contract.renewal.noticePeriod ?? '30 days'}
                </p>
                <p>Owner {contract.renewal.owner ?? 'Assign owner'} · Target {formatDateLabel(contract.renewal.targetDate)}</p>
                <p>Recommended action: {contract.renewal.recommendedAction ?? 'Model renewal scenarios and prep decks.'}</p>
                <p className="text-xs text-indigo-500">
                  {renewalWindow != null
                    ? renewalWindow >= 0
                      ? `${renewalWindow} days until renewal window`
                      : `Renewal window passed ${Math.abs(renewalWindow)} days ago`
                    : 'Set a target date to unlock proactive nudges.'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-indigo-600">Capture renewal intent to orchestrate exec reviews early.</p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Insights</h3>
            <dl className="mt-4 space-y-3 text-xs text-slate-500">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <dt className="font-semibold text-slate-700">Outstanding obligations</dt>
                <dd className="mt-1">{obligations.length - completedObligations.size} open · {completedObligations.size} complete</dd>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <dt className="font-semibold text-slate-700">Executive summary</dt>
                <dd className="mt-1">{contract.summary ?? 'Keep leadership aligned with proactive highlights.'}</dd>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                <dt className="font-semibold text-slate-700">Next decision</dt>
                <dd className="mt-1">{contract.nextDecision ?? 'Confirm renewal posture and align on success metrics.'}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}

function BadgeMetric({ label, value, tone }) {
  const toneMap = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    purple: 'border-purple-200 bg-purple-50 text-purple-700',
  };
  return (
    <div className={`rounded-2xl border px-4 py-3 text-center text-sm font-semibold ${toneMap[tone] ?? toneMap.indigo}`}>
      <p className="text-xs uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-base">{value}</p>
    </div>
  );
}

function PhaseTimeline({ phases }) {
  const normalised = (phases ?? []).map((phase) => ({
    ...phase,
    status: phase.status ?? (phase.completed ? 'done' : 'pending'),
    key: phase.id ?? phase.label,
  }));
  return (
    <ol className="mt-6 grid gap-4 lg:grid-cols-5">
      {normalised.map((phase) => {
        const phaseStatus = phase.status;
        const isComplete = phaseStatus === 'done';
        const isActive = phaseStatus === 'in_progress';
        return (
          <li
            key={phase.key}
            className={`rounded-2xl border p-4 text-xs transition ${
              isComplete
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : isActive
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}
          >
            <p className="text-sm font-semibold">{phase.label}</p>
            <p className="mt-2 text-xs">{phase.description ?? 'Document requirements, align teams, and secure approvals.'}</p>
            <p className="mt-3 text-[11px]">
              {formatDateLabel(phase.startDate)} – {formatDateLabel(phase.endDate)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

const obligationShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  owner: PropTypes.string,
  dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  type: PropTypes.string,
  severity: PropTypes.oneOf(['low', 'medium', 'high']),
  notes: PropTypes.string,
  completed: PropTypes.bool,
});

const phaseShape = PropTypes.shape({
  id: PropTypes.string,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  status: PropTypes.oneOf(['pending', 'in_progress', 'done']),
  completed: PropTypes.bool,
  startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
});

const deliverableShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  stage: PropTypes.string,
});

ContractTracker.propTypes = {
  contract: PropTypes.shape({
    title: PropTypes.string.isRequired,
    counterpart: PropTypes.string.isRequired,
    value: PropTypes.number,
    currency: PropTypes.string,
    statusKey: PropTypes.string,
    statusLabel: PropTypes.string,
    startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    phases: PropTypes.arrayOf(phaseShape),
    obligations: PropTypes.arrayOf(obligationShape),
    deliverables: PropTypes.arrayOf(deliverableShape),
    financials: PropTypes.shape({
      currency: PropTypes.string,
      totalValue: PropTypes.number,
      paidToDate: PropTypes.number,
      upcoming: PropTypes.number,
      burnRate: PropTypes.string,
    }),
    risks: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        severity: PropTypes.oneOf(['low', 'medium', 'high']),
        owner: PropTypes.string,
        mitigation: PropTypes.string,
      }),
    ),
    touchpoints: PropTypes.arrayOf(PropTypes.string),
    escalationContacts: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        role: PropTypes.string,
        responseSla: PropTypes.string,
      }),
    ),
    analytics: PropTypes.shape({
      renewalProbability: PropTypes.number,
      satisfaction: PropTypes.number,
      compliance: PropTypes.number,
    }),
    activity: PropTypes.arrayOf(
      PropTypes.shape({
        timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
        label: PropTypes.string.isRequired,
        actor: PropTypes.string,
        persona: PropTypes.string,
        details: PropTypes.string,
      }),
    ),
    renewal: PropTypes.shape({
      option: PropTypes.string,
      noticePeriod: PropTypes.string,
      owner: PropTypes.string,
      recommendedAction: PropTypes.string,
      targetDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    }),
    summary: PropTypes.string,
    nextDecision: PropTypes.string,
  }).isRequired,
  persona: PropTypes.string,
  onObligationToggle: PropTypes.func,
  updating: PropTypes.bool,
};

ContractTracker.defaultProps = {
  persona: 'operations',
  onObligationToggle: undefined,
  updating: false,
};

BadgeMetric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  tone: PropTypes.oneOf(['emerald', 'amber', 'rose', 'indigo', 'purple']).isRequired,
};

PhaseTimeline.propTypes = {
  phases: PropTypes.arrayOf(phaseShape),
};

PhaseTimeline.defaultProps = {
  phases: [],
};

export default ContractTracker;

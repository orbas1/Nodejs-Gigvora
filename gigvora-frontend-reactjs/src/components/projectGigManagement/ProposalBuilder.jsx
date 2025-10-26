import { useEffect, useMemo, useReducer, useState } from 'react';
import PropTypes from 'prop-types';
import { formatDateLabel } from '../../utils/date.js';

const STEPS = [
  { id: 'overview', label: 'Narrative & positioning' },
  { id: 'scope', label: 'Scope, timeline & rituals' },
  { id: 'investment', label: 'Investment, approvals & sign-off' },
];

const BILLING_MODELS = [
  { id: 'fixed', label: 'Fixed fee', helper: 'Defined deliverables with milestone-based payments.' },
  { id: 'hourly', label: 'Hourly', helper: 'Time-and-materials with rate transparency and caps.' },
  { id: 'retainer', label: 'Retainer', helper: 'Ongoing partnership with agreed capacity and goals.' },
];

const CADENCE_OPTIONS = [
  'Weekly sync with stakeholder notes within 4h.',
  'Async update twice a week with dashboards.',
  'Monthly executive review with narrative artifacts.',
  'On-demand escalation channel with <2h response SLA.',
];

const INITIAL_STATE = {
  overview: {
    title: '',
    client: '',
    persona: 'operations',
    summary: '',
    goals: ['Accelerate hiring pipeline', 'Ship branded onboarding in 6 weeks'],
    successMetrics: ['Time to hire', 'NPS uplift', 'Revenue impact'],
  },
  scope: {
    deliverables: [
      {
        id: 'del-1',
        title: 'Discovery & workshop',
        outcome: 'Map opportunity, audience, and technical constraints with stakeholders.',
        measurement: 'Workshop playback, alignment score, agreed blueprint.',
      },
      {
        id: 'del-2',
        title: 'MVP build',
        outcome: 'Ship production-ready workspace with analytics instrumentation.',
        measurement: 'Deploy to staging + production with QA sign-off.',
      },
    ],
    milestones: [
      {
        id: 'mil-1',
        label: 'Kickoff & discovery',
        dueDate: new Date(),
        owner: 'Operations lead',
        dependencies: ['Pre-read circulated', 'Stakeholders confirmed'],
      },
      {
        id: 'mil-2',
        label: 'Alpha launch',
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        owner: 'Product lead',
        dependencies: ['Tech spec approved', 'Security review complete'],
      },
    ],
    touchpoints: ['Weekly sync with stakeholder notes within 4h.'],
  },
  investment: {
    billingModel: 'fixed',
    currency: 'USD',
    amount: 85000,
    paymentSchedule: [
      { id: 'pay-1', label: 'Kickoff deposit', percentage: 30, dueOn: 'Contract signature' },
      { id: 'pay-2', label: 'Alpha launch', percentage: 40, dueOn: 'Milestone mil-2' },
      { id: 'pay-3', label: 'Wrap & review', percentage: 30, dueOn: 'Final acceptance' },
    ],
    confidence: 78,
    commercialNotes: 'Includes enablement, analytics setup, and success office hours.',
    approvals: {
      legal: false,
      compliance: false,
      finance: false,
    },
    riskRegister: [
      { id: 'risk-1', label: 'Data migration complexity', mitigation: 'Parallel sandbox + staged import rehearsals.' },
      { id: 'risk-2', label: 'Stakeholder availability', mitigation: 'Executive sponsor weekly cadence confirmed.' },
    ],
  },
  history: [],
};

function appendHistory(history, entry) {
  return [entry, ...history].slice(0, 25);
}

function proposalReducer(state, action) {
  const timestamp = new Date().toISOString();
  switch (action.type) {
    case 'updateOverview':
      return {
        ...state,
        overview: { ...state.overview, [action.field]: action.value },
        history: appendHistory(state.history, {
          timestamp,
          label: `Updated ${action.field}`,
          meta: action.value,
        }),
      };
    case 'updateGoal':
      return {
        ...state,
        overview: {
          ...state.overview,
          goals: state.overview.goals.map((goal, index) => (index === action.index ? action.value : goal)),
        },
        history: appendHistory(state.history, {
          timestamp,
          label: 'Goal adjusted',
          meta: action.value,
        }),
      };
    case 'addGoal':
      return {
        ...state,
        overview: {
          ...state.overview,
          goals: [...state.overview.goals, action.value ?? ''],
        },
        history: appendHistory(state.history, {
          timestamp,
          label: 'Added success goal',
        }),
      };
    case 'updateDeliverable':
      return {
        ...state,
        scope: {
          ...state.scope,
          deliverables: state.scope.deliverables.map((deliverable) =>
            deliverable.id === action.id ? { ...deliverable, [action.field]: action.value } : deliverable,
          ),
        },
        history: appendHistory(state.history, {
          timestamp,
          label: `Deliverable ${action.field} updated`,
          meta: action.value,
        }),
      };
    case 'addDeliverable':
      return {
        ...state,
        scope: {
          ...state.scope,
          deliverables: [
            ...state.scope.deliverables,
            {
              id: `del-${state.scope.deliverables.length + 1}`,
              title: 'New deliverable',
              outcome: '',
              measurement: '',
            },
          ],
        },
        history: appendHistory(state.history, {
          timestamp,
          label: 'Added deliverable',
        }),
      };
    case 'removeDeliverable':
      return {
        ...state,
        scope: {
          ...state.scope,
          deliverables: state.scope.deliverables.filter((deliverable) => deliverable.id !== action.id),
        },
        history: appendHistory(state.history, {
          timestamp,
          label: 'Removed deliverable',
          meta: action.id,
        }),
      };
    case 'updateMilestone':
      return {
        ...state,
        scope: {
          ...state.scope,
          milestones: state.scope.milestones.map((milestone) =>
            milestone.id === action.id ? { ...milestone, [action.field]: action.value } : milestone,
          ),
        },
        history: appendHistory(state.history, {
          timestamp,
          label: `Milestone ${action.field} updated`,
          meta: action.value,
        }),
      };
    case 'addMilestone':
      return {
        ...state,
        scope: {
          ...state.scope,
          milestones: [
            ...state.scope.milestones,
            {
              id: `mil-${state.scope.milestones.length + 1}`,
              label: 'New milestone',
              dueDate: new Date(),
              owner: '',
              dependencies: [],
            },
          ],
        },
        history: appendHistory(state.history, {
          timestamp,
          label: 'Added milestone',
        }),
      };
    case 'updateTouchpoints':
      return {
        ...state,
        scope: {
          ...state.scope,
          touchpoints: action.values,
        },
        history: appendHistory(state.history, {
          timestamp,
          label: 'Touchpoint cadence updated',
        }),
      };
    case 'updateInvestment':
      return {
        ...state,
        investment: { ...state.investment, [action.field]: action.value },
        history: appendHistory(state.history, {
          timestamp,
          label: `Investment ${action.field} updated`,
          meta: action.value,
        }),
      };
    case 'updatePayment':
      return {
        ...state,
        investment: {
          ...state.investment,
          paymentSchedule: state.investment.paymentSchedule.map((payment) =>
            payment.id === action.id ? { ...payment, [action.field]: action.value } : payment,
          ),
        },
        history: appendHistory(state.history, {
          timestamp,
          label: `Payment ${action.field} updated`,
        }),
      };
    case 'toggleApproval':
      return {
        ...state,
        investment: {
          ...state.investment,
          approvals: {
            ...state.investment.approvals,
            [action.field]: !state.investment.approvals[action.field],
          },
        },
        history: appendHistory(state.history, {
          timestamp,
          label: `${action.field} approval toggled`,
          meta: state.investment.approvals[action.field] ? 'revoked' : 'granted',
        }),
      };
    case 'updateRisk':
      return {
        ...state,
        investment: {
          ...state.investment,
          riskRegister: state.investment.riskRegister.map((risk) =>
            risk.id === action.id ? { ...risk, [action.field]: action.value } : risk,
          ),
        },
        history: appendHistory(state.history, {
          timestamp,
          label: 'Risk register updated',
        }),
      };
    case 'reset':
      return INITIAL_STATE;
    default:
      return state;
  }
}

function computeStepProgress(state) {
  const overviewComplete = state.overview.title && state.overview.client && state.overview.summary;
  const scopeComplete = state.scope.deliverables.length > 0 && state.scope.milestones.length > 0;
  const approvalsComplete = Object.values(state.investment.approvals).filter(Boolean).length;
  const investmentComplete = state.investment.amount > 0 && approvalsComplete >= 2;

  return {
    overview: overviewComplete ? 1 : 0.6,
    scope: scopeComplete ? 1 : 0.5,
    investment: investmentComplete ? 1 : 0.4,
  };
}

function computeReadinessScore(state) {
  const progress = computeStepProgress(state);
  const cadenceScore = state.scope.touchpoints.length >= 2 ? 1 : 0.5;
  const approvalsScore = Object.values(state.investment.approvals).filter(Boolean).length / 3;
  const riskScore = state.investment.riskRegister.length ? 1 : 0.7;
  const proposalConfidence = state.investment.confidence / 100;
  const completeness = (progress.overview + progress.scope + progress.investment) / 3;

  return Math.round((completeness * 0.35 + cadenceScore * 0.15 + approvalsScore * 0.2 + riskScore * 0.1 + proposalConfidence * 0.2) * 100);
}

function ProposalBuilder({ initialState, onChange, persona }) {
  const [state, dispatch] = useReducer(proposalReducer, { ...INITIAL_STATE, ...initialState });
  const [activeStep, setActiveStep] = useState(STEPS[0].id);

  useEffect(() => {
    onChange?.(state);
  }, [state, onChange]);

  const progress = useMemo(() => computeStepProgress(state), [state]);
  const readiness = useMemo(() => computeReadinessScore(state), [state]);

  const approvals = state.investment.approvals;
  const approvalsComplete = Object.values(approvals).filter(Boolean).length;

  return (
    <div className="rounded-[40px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100/60 p-10 shadow-soft">
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-purple-500">Proposal experience</p>
          <h2 className="text-3xl font-semibold text-slate-900">Proposal Builder</h2>
          <p className="text-sm text-slate-600">
            Craft decision-ready proposals with structured storytelling, measurable outcomes, and governance signals tuned for
            {` ${persona}`} personas.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <ProgressPill label="Readiness" value={`${readiness}%`} tone={readiness > 80 ? 'emerald' : readiness > 60 ? 'amber' : 'rose'} />
          <ProgressPill label="Approvals" value={`${approvalsComplete}/3`} tone={approvalsComplete === 3 ? 'emerald' : 'indigo'} />
          <ProgressPill label="Confidence" value={`${state.investment.confidence}/100`} tone="purple" />
        </div>
      </header>

      <nav className="mt-8 flex flex-wrap items-center gap-4">
        {STEPS.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => setActiveStep(step.id)}
            className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
              activeStep === step.id
                ? 'bg-purple-600 text-white shadow'
                : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
            }`}
          >
            <span className="block text-xs uppercase tracking-wide text-purple-200">{Math.round(progress[step.id] * 100)}% ready</span>
            <span className="block text-base">{step.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          {activeStep === 'overview' ? (
            <OverviewStep state={state.overview} dispatch={dispatch} />
          ) : null}
          {activeStep === 'scope' ? <ScopeStep state={state.scope} dispatch={dispatch} /> : null}
          {activeStep === 'investment' ? (
            <InvestmentStep state={state.investment} dispatch={dispatch} readiness={readiness} />
          ) : null}
        </div>
        <aside className="space-y-6">
          <SummaryPanel state={state} persona={persona} readiness={readiness} />
          <HistoryPanel history={state.history} />
        </aside>
      </div>
    </div>
  );
}

function ProgressPill({ label, value, tone }) {
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

function OverviewStep({ state, dispatch }) {
  return (
    <section className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Narrative</h3>
      <p className="mt-1 text-sm text-slate-500">Introduce why this proposal matters, the transformation promised, and the personas served.</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          Project title
          <input
            value={state.title}
            onChange={(event) => dispatch({ type: 'updateOverview', field: 'title', value: event.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
            placeholder="Gigvora talent expansion"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          Client / sponsor
          <input
            value={state.client}
            onChange={(event) => dispatch({ type: 'updateOverview', field: 'client', value: event.target.value })}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
            placeholder="Aperture Labs"
          />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
        Executive summary
        <textarea
          value={state.summary}
          onChange={(event) => dispatch({ type: 'updateOverview', field: 'summary', value: event.target.value })}
          className="min-h-[140px] rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
          placeholder="Outline the opportunity, promised outcomes, and how success is measured."
        />
      </label>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          Primary persona focus
          <select
            value={state.persona}
            onChange={(event) => dispatch({ type: 'updateOverview', field: 'persona', value: event.target.value })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            <option value="operations">Operations</option>
            <option value="product">Product</option>
            <option value="marketing">Marketing</option>
            <option value="executive">Executive</option>
          </select>
        </label>
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-700">Persona guidance</p>
          <p className="mt-2">
            Align messaging to persona priorities. Executives expect business cases, operations crave reliability, and product leaders need roadmap clarity.
          </p>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <h4 className="text-sm font-semibold text-slate-900">Goals & success metrics</h4>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {state.goals.map((goal, index) => (
              <label key={goal + index} className="flex flex-col gap-2 text-xs text-slate-600">
                Goal {index + 1}
                <input
                  value={goal}
                  onChange={(event) => dispatch({ type: 'updateGoal', index, value: event.target.value })}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </label>
            ))}
            <button
              type="button"
              onClick={() => dispatch({ type: 'addGoal', value: '' })}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Add goal
            </button>
          </div>
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 text-xs text-purple-700">
            <p className="font-semibold uppercase tracking-wide">Metrics library</p>
            <ul className="mt-3 space-y-2">
              {state.successMetrics.map((metric) => (
                <li key={metric}>• {metric}</li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-purple-600">
              Map each metric to an analytic or KPI so reporting automates once delivery kicks off.
            </p>
          </div>
        </div>
      </section>
    </section>
  );
}

function ScopeStep({ state, dispatch }) {
  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Scope & rituals</h3>
      <p className="mt-1 text-sm text-slate-500">Define what will be delivered, how momentum is maintained, and the cadence stakeholders can expect.</p>

      <div className="mt-6 space-y-4">
        {state.deliverables.map((deliverable) => (
          <div key={deliverable.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-slate-700">{deliverable.title}</h4>
              <button
                type="button"
                onClick={() => dispatch({ type: 'removeDeliverable', id: deliverable.id })}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-500 hover:bg-slate-100"
              >
                Remove
              </button>
            </div>
            <label className="mt-3 flex flex-col gap-2 text-xs text-slate-600">
              Deliverable title
              <input
                value={deliverable.title}
                onChange={(event) =>
                  dispatch({ type: 'updateDeliverable', id: deliverable.id, field: 'title', value: event.target.value })
                }
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </label>
            <label className="mt-3 flex flex-col gap-2 text-xs text-slate-600">
              Outcome & definition of done
              <textarea
                value={deliverable.outcome}
                onChange={(event) =>
                  dispatch({ type: 'updateDeliverable', id: deliverable.id, field: 'outcome', value: event.target.value })
                }
                className="min-h-[100px] rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </label>
            <label className="mt-3 flex flex-col gap-2 text-xs text-slate-600">
              Measurement & evidence
              <textarea
                value={deliverable.measurement}
                onChange={(event) =>
                  dispatch({
                    type: 'updateDeliverable',
                    id: deliverable.id,
                    field: 'measurement',
                    value: event.target.value,
                  })
                }
                className="min-h-[80px] rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </label>
          </div>
        ))}
        <button
          type="button"
          onClick={() => dispatch({ type: 'addDeliverable' })}
          className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
        >
          Add deliverable
        </button>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4">
        <h4 className="text-sm font-semibold text-slate-900">Milestones</h4>
        <p className="mt-1 text-xs text-slate-500">Key gates that unlock payments, storytelling moments, or success reviews.</p>
        <div className="mt-4 space-y-4">
          {state.milestones.map((milestone) => (
            <div key={milestone.id} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                Milestone label
                <input
                  value={milestone.label}
                  onChange={(event) =>
                    dispatch({ type: 'updateMilestone', id: milestone.id, field: 'label', value: event.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                Due date
                <input
                  type="date"
                  value={milestone.dueDate ? new Date(milestone.dueDate).toISOString().slice(0, 10) : ''}
                  onChange={(event) =>
                    dispatch({
                      type: 'updateMilestone',
                      id: milestone.id,
                      field: 'dueDate',
                      value: event.target.value ? new Date(event.target.value) : null,
                    })
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                Owner
                <input
                  value={milestone.owner}
                  onChange={(event) =>
                    dispatch({ type: 'updateMilestone', id: milestone.id, field: 'owner', value: event.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                Dependencies
                <input
                  value={milestone.dependencies.join(', ')}
                  onChange={(event) =>
                    dispatch({
                      type: 'updateMilestone',
                      id: milestone.id,
                      field: 'dependencies',
                      value: event.target.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
            </div>
          ))}
          <button
            type="button"
            onClick={() => dispatch({ type: 'addMilestone' })}
            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Add milestone
          </button>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
        <h4 className="text-sm font-semibold text-emerald-700">Cadence & rituals</h4>
        <p className="mt-1 text-xs text-emerald-600">Select the touchpoints that keep teams aligned. Mix live, async, and executive narratives.</p>
        <div className="mt-3 grid gap-2">
          {CADENCE_OPTIONS.map((option) => {
            const checked = state.touchpoints.includes(option);
            return (
              <label
                key={option}
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-xs transition ${
                  checked ? 'border-emerald-400 bg-white shadow-sm' : 'border-transparent hover:border-emerald-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = checked
                      ? state.touchpoints.filter((value) => value !== option)
                      : [...state.touchpoints, option];
                    dispatch({ type: 'updateTouchpoints', values: next });
                  }}
                  className="mt-1 h-4 w-4 rounded border border-emerald-300 text-emerald-600 focus:ring-emerald-400"
                />
                <span className="text-emerald-700">{option}</span>
              </label>
            );
          })}
        </div>
      </section>
    </section>
  );
}

function InvestmentStep({ state, dispatch, readiness }) {
  const approvalsComplete = Object.values(state.approvals).filter(Boolean).length;
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Commercials & governance</h3>
      <p className="mt-1 text-sm text-slate-500">Calibrate investment structure, schedule, and risk posture so legal and finance can sign off quickly.</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {BILLING_MODELS.map((model) => (
          <button
            key={model.id}
            type="button"
            onClick={() => dispatch({ type: 'updateInvestment', field: 'billingModel', value: model.id })}
            className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
              state.billingModel === model.id
                ? 'border-purple-400 bg-purple-50 text-purple-700 shadow-sm'
                : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-purple-200'
            }`}
          >
            <span className="block text-sm font-semibold">{model.label}</span>
            <span className="mt-2 block text-xs text-slate-500">{model.helper}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          Currency
          <select
            value={state.currency}
            onChange={(event) => dispatch({ type: 'updateInvestment', field: 'currency', value: event.target.value })}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
          >
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="EUR">EUR</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          Investment amount
          <input
            type="number"
            value={state.amount}
            onChange={(event) => dispatch({ type: 'updateInvestment', field: 'amount', value: Number(event.target.value) })}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-600">
          Confidence
          <input
            type="range"
            min="0"
            max="100"
            value={state.confidence}
            onChange={(event) => dispatch({ type: 'updateInvestment', field: 'confidence', value: Number(event.target.value) })}
            className="accent-purple-600"
          />
          <span className="text-xs text-slate-500">{state.confidence}/100 readiness</span>
        </label>
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
        <h4 className="text-sm font-semibold text-slate-900">Payment schedule</h4>
        <div className="mt-3 space-y-3">
          {state.paymentSchedule.map((payment) => (
            <div key={payment.id} className="grid gap-3 lg:grid-cols-3">
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                Label
                <input
                  value={payment.label}
                  onChange={(event) =>
                    dispatch({ type: 'updatePayment', id: payment.id, field: 'label', value: event.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                Percentage
                <input
                  type="number"
                  value={payment.percentage}
                  onChange={(event) =>
                    dispatch({
                      type: 'updatePayment',
                      id: payment.id,
                      field: 'percentage',
                      value: Number(event.target.value),
                    })
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                Due on
                <input
                  value={payment.dueOn}
                  onChange={(event) =>
                    dispatch({ type: 'updatePayment', id: payment.id, field: 'dueOn', value: event.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-700">
          <h4 className="text-sm font-semibold uppercase tracking-wide">Approvals</h4>
          <ul className="mt-3 space-y-2">
            {Object.entries(state.approvals).map(([key, value]) => (
              <li key={key} className="flex items-center justify-between">
                <span className="capitalize">{key}</span>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'toggleApproval', field: key })}
                  className={`rounded-full px-4 py-1 text-xs font-semibold ${
                    value ? 'bg-emerald-500 text-white' : 'bg-white text-purple-600 hover:bg-purple-100'
                  }`}
                >
                  {value ? 'Approved' : 'Pending'}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-purple-600">{approvalsComplete >= 2 ? 'Ready for routing to exec sign-off.' : 'Secure at least two approvals to unlock launch readiness.'}</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <h4 className="text-sm font-semibold uppercase tracking-wide">Risk register</h4>
          <ul className="mt-3 space-y-2">
            {state.riskRegister.map((risk) => (
              <li key={risk.id}>
                <p className="text-sm font-semibold">{risk.label}</p>
                <textarea
                  value={risk.mitigation}
                  onChange={(event) =>
                    dispatch({ type: 'updateRisk', id: risk.id, field: 'mitigation', value: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <label className="mt-6 flex flex-col gap-2 text-sm text-slate-600">
        Commercial notes & inclusions
        <textarea
          value={state.commercialNotes}
          onChange={(event) => dispatch({ type: 'updateInvestment', field: 'commercialNotes', value: event.target.value })}
          className="min-h-[120px] rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
        />
      </label>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className="rounded-full bg-slate-900 px-4 py-2 text-white">Readiness score {readiness}%</span>
        <span className="rounded-full border border-slate-300 px-4 py-2">{approvalsComplete}/3 approvals locked</span>
      </div>
    </section>
  );
}

function SummaryPanel({ state, persona, readiness }) {
  const totalPercentage = state.investment.paymentSchedule.reduce((sum, item) => sum + item.percentage, 0);
  const upcomingMilestones = state.scope.milestones.slice().sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const formattedAmount = Number.isFinite(state.investment.amount)
    ? state.investment.amount.toLocaleString()
    : '—';

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Executive summary</h3>
      <h4 className="mt-3 text-xl font-semibold text-slate-900">{state.overview.title || 'Proposal headline pending'}</h4>
      <p className="mt-2 text-sm text-slate-600">{state.overview.summary || 'Capture the opportunity in two sentences so stakeholders align instantly.'}</p>

      <dl className="mt-4 grid gap-3 text-xs text-slate-500">
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <dt className="font-semibold text-slate-700">Persona focus</dt>
          <dd className="mt-1 capitalize">{state.overview.persona}</dd>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <dt className="font-semibold text-slate-700">Investment</dt>
          <dd className="mt-1">
            {state.investment.currency} {formattedAmount} · {state.investment.billingModel}
          </dd>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <dt className="font-semibold text-slate-700">Touchpoints</dt>
          <dd className="mt-1">
            {state.scope.touchpoints.length ? state.scope.touchpoints.join(' • ') : 'Add rituals to keep teams informed.'}
          </dd>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <dt className="font-semibold text-slate-700">Payment coverage</dt>
          <dd className="mt-1">{totalPercentage}% of contract mapped · {state.investment.paymentSchedule.length} events</dd>
        </div>
      </dl>

      <section className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-4 text-xs text-purple-700">
        <p className="font-semibold uppercase tracking-wide">Upcoming milestones</p>
        <ul className="mt-3 space-y-2">
          {upcomingMilestones.map((milestone) => (
            <li key={milestone.id}>
              <span className="font-semibold text-purple-800">{milestone.label}</span> · {formatDateLabel(milestone.dueDate)} · {milestone.owner || 'Owner TBD'}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600">
        <p className="font-semibold text-slate-700">Persona insight</p>
        <p className="mt-2">
          {persona === 'executive'
            ? 'Executives crave ROI clarity. Keep the hero metrics and risk mitigations front and centre.'
            : persona === 'operations'
              ? 'Highlight process reliability, tooling integrations, and support structures for smooth execution.'
              : 'Ensure narrative ties back to growth levers while keeping governance friction low.'}
        </p>
        <p className="mt-3 text-slate-500">Readiness score {readiness}% — share when approvals cross 80%.</p>
      </section>
    </section>
  );
}

function HistoryPanel({ history }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Collaboration log</h3>
      {history.length === 0 ? (
        <p className="mt-4 text-xs text-slate-500">Updates will appear here as you craft the proposal.</p>
      ) : (
        <ul className="mt-4 space-y-3 text-xs text-slate-500">
          {history.map((entry) => (
            <li key={entry.timestamp + entry.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="font-semibold text-slate-700">{entry.label}</p>
              <p className="mt-1 text-[11px] text-slate-500">{formatDateLabel(entry.timestamp, { includeTime: true })}</p>
              {entry.meta ? <p className="mt-1 text-slate-500">{entry.meta}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

ProposalBuilder.propTypes = {
  initialState: PropTypes.shape({
    overview: PropTypes.object,
    scope: PropTypes.object,
    investment: PropTypes.object,
    history: PropTypes.array,
  }),
  onChange: PropTypes.func,
  persona: PropTypes.string,
};

ProposalBuilder.defaultProps = {
  initialState: undefined,
  onChange: undefined,
  persona: 'operations',
};

ProgressPill.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  tone: PropTypes.oneOf(['emerald', 'amber', 'rose', 'indigo', 'purple']).isRequired,
};

OverviewStep.propTypes = {
  state: PropTypes.shape({
    title: PropTypes.string,
    client: PropTypes.string,
    persona: PropTypes.string,
    summary: PropTypes.string,
    goals: PropTypes.arrayOf(PropTypes.string),
    successMetrics: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  dispatch: PropTypes.func.isRequired,
};

ScopeStep.propTypes = {
  state: PropTypes.shape({
    deliverables: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string,
        outcome: PropTypes.string,
        measurement: PropTypes.string,
      }),
    ),
    milestones: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string,
        dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
        owner: PropTypes.string,
        dependencies: PropTypes.arrayOf(PropTypes.string),
      }),
    ),
    touchpoints: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  dispatch: PropTypes.func.isRequired,
};

InvestmentStep.propTypes = {
  state: PropTypes.shape({
    billingModel: PropTypes.string,
    currency: PropTypes.string,
    amount: PropTypes.number,
    confidence: PropTypes.number,
    paymentSchedule: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string,
        percentage: PropTypes.number,
        dueOn: PropTypes.string,
      }),
    ),
    approvals: PropTypes.object,
    riskRegister: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string,
        mitigation: PropTypes.string,
      }),
    ),
    commercialNotes: PropTypes.string,
  }).isRequired,
  dispatch: PropTypes.func.isRequired,
  readiness: PropTypes.number.isRequired,
};

SummaryPanel.propTypes = {
  state: PropTypes.object.isRequired,
  persona: PropTypes.string.isRequired,
  readiness: PropTypes.number.isRequired,
};

HistoryPanel.propTypes = {
  history: PropTypes.arrayOf(
    PropTypes.shape({
      timestamp: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      meta: PropTypes.string,
    }),
  ).isRequired,
};

export default ProposalBuilder;

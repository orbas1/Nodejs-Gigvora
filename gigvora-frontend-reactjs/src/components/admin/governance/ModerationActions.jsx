import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  BoltIcon,
  ClipboardDocumentListIcon,
  FireIcon,
  FlagIcon,
  InformationCircleIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
  SignalIcon,
  SparklesIcon,
  UserMinusIcon,
} from '@heroicons/react/24/outline';

const SEVERITY_LEVELS = {
  critical: {
    label: 'Critical',
    description: 'Immediate enforcement and legal review recommended.',
    gradient: 'from-rose-500 via-rose-600 to-rose-700',
    badge: 'bg-rose-500/10 text-rose-200 border-rose-400/60',
  },
  high: {
    label: 'High',
    description: 'Act within 30 minutes and notify communications.',
    gradient: 'from-amber-500 via-amber-600 to-amber-700',
    badge: 'bg-amber-500/10 text-amber-200 border-amber-400/60',
  },
  medium: {
    label: 'Medium',
    description: 'Review within the SLA and capture rationale.',
    gradient: 'from-sky-500 via-sky-600 to-sky-700',
    badge: 'bg-sky-500/10 text-sky-200 border-sky-400/60',
  },
  low: {
    label: 'Low',
    description: 'Monitor ongoing behaviour and educate the member.',
    gradient: 'from-emerald-500 via-emerald-600 to-emerald-700',
    badge: 'bg-emerald-500/10 text-emerald-200 border-emerald-400/60',
  },
};

const DEFAULT_ACTIONS = [
  {
    id: 'approve',
    label: 'Approve',
    description: 'Content complies with policy. Restore visibility and close the case.',
    tone: 'emerald',
    icon: ShieldCheckIcon,
  },
  {
    id: 'request_changes',
    label: 'Request edits',
    description: 'Provide revision guidance and keep the case on watch.',
    tone: 'sky',
    icon: ClipboardDocumentListIcon,
  },
  {
    id: 'suspend',
    label: 'Suspend account',
    description: 'Temporarily suspend posting rights while investigating.',
    tone: 'amber',
    icon: UserMinusIcon,
  },
  {
    id: 'escalate',
    label: 'Escalate to legal',
    description: 'Hand over to legal and policy for joint response.',
    tone: 'rose',
    icon: ShieldExclamationIcon,
  },
];

function riskBand(score) {
  const numeric = Number.parseFloat(score);
  if (!Number.isFinite(numeric)) return 'low';
  if (numeric >= 85) return 'critical';
  if (numeric >= 60) return 'high';
  if (numeric >= 35) return 'medium';
  return 'low';
}

function SeverityMeter({ level, score }) {
  const severity = SEVERITY_LEVELS[level] ?? SEVERITY_LEVELS.low;
  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-6 text-xs text-white/70">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
          <FireIcon className="h-5 w-5" aria-hidden="true" /> {severity.label}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-white/70">
          Risk {Number.isFinite(Number(score)) ? Math.round(Number(score)) : '—'}
        </span>
      </div>
      <p>{severity.description}</p>
      <div className={`h-2 w-full overflow-hidden rounded-full bg-white/20`}> 
        <div
          className={`h-full w-full bg-gradient-to-r ${severity.gradient}`}
          style={{ width: `${Math.min(100, Math.max(0, Number(score) || 0))}%` }}
        />
      </div>
    </div>
  );
}

SeverityMeter.propTypes = {
  level: PropTypes.oneOf(Object.keys(SEVERITY_LEVELS)).isRequired,
  score: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

SeverityMeter.defaultProps = {
  score: null,
};

function ActionButton({ action, disabled, onExecute }) {
  const toneClasses = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    sky: 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100',
    amber: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
    rose: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100',
  };
  const Icon = action.icon ?? ShieldCheckIcon;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onExecute?.(action.id)}
      className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 ${toneClasses[action.tone]}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-slate-700">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-slate-900">{action.label}</p>
          <p className="text-xs font-normal text-slate-600">{action.description}</p>
        </div>
      </div>
    </button>
  );
}

ActionButton.propTypes = {
  action: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    tone: PropTypes.string,
    icon: PropTypes.elementType,
  }).isRequired,
  disabled: PropTypes.bool,
  onExecute: PropTypes.func,
};

ActionButton.defaultProps = {
  disabled: false,
  onExecute: undefined,
};

export default function ModerationActions({
  subject,
  templates,
  history,
  analytics,
  onExecute,
  loading,
  onTemplatePreview,
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [notes, setNotes] = useState('');

  const severityLevel = useMemo(() => riskBand(subject?.riskScore ?? subject?.severityScore ?? subject?.score), [subject]);
  const resolvedTemplates = templates?.length ? templates : [];
  const availableActions = subject?.actions?.length ? subject.actions : DEFAULT_ACTIONS;
  const appliedTemplate = useMemo(
    () => resolvedTemplates.find((template) => template.id === selectedTemplateId) ?? null,
    [resolvedTemplates, selectedTemplateId],
  );

  return (
    <section className="space-y-8">
      <header className="rounded-4xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-[0_40px_80px_-40px_rgba(15,23,42,0.8)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.4em] text-white/50">Moderation actions</p>
            <h1 className="text-3xl font-semibold">Resolution control centre</h1>
            <p className="max-w-2xl text-sm text-white/70">
              Apply templated actions, capture rationale, and monitor enforcement impact with premium decision intelligence for
              safety operations teams.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-white/60">
              <span className="inline-flex items-center gap-2">
                <BoltIcon className="h-4 w-4" aria-hidden="true" /> SLA target {subject?.slaMinutes ?? '30'} minutes
              </span>
              <span className="inline-flex items-center gap-2">
                <FlagIcon className="h-4 w-4" aria-hidden="true" /> {subject?.reports ?? 0} community reports
              </span>
              <span className="inline-flex items-center gap-2">
                <SignalIcon className="h-4 w-4" aria-hidden="true" /> {subject?.aiSignals?.length ?? 0} AI signals
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3 text-xs text-white/70">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2">
              <SparklesIcon className="h-4 w-4" aria-hidden="true" /> Suggested template
              {appliedTemplate ? `: ${appliedTemplate.name}` : ': None selected'}
            </span>
            {loading ? (
              <span className="inline-flex items-center gap-2 text-xs text-white/60">
                <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" /> Applying action…
              </span>
            ) : null}
          </div>
        </div>
        <SeverityMeter level={severityLevel} score={subject?.riskScore ?? subject?.severityScore ?? subject?.score} />
      </header>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Case details</p>
                <h2 className="text-xl font-semibold text-slate-900">{subject?.title ?? 'Flagged submission'}</h2>
                <p className="mt-2 text-sm text-slate-600">{subject?.summary ?? subject?.excerpt ?? 'No summary available.'}</p>
              </div>
              <div className="flex flex-col items-end gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                  Reporter {subject?.reporter?.name ?? 'Community'}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                  Account age {subject?.reporter?.accountAge ?? '—'}
                </span>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {Array.isArray(availableActions) && availableActions.length
                ? availableActions.map((action) => (
                    <ActionButton key={action.id} action={action} disabled={loading} onExecute={(actionId) => onExecute?.(actionId, { notes, template: selectedTemplateId, subject })} />
                  ))
                : null}
            </div>
            <div className="space-y-2 text-xs text-slate-500">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-slate-500">Decision rationale</p>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Capture reasoning, policy references, and follow-up tasks."
                className="h-32 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700 shadow-inner focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <p className="text-[0.65rem] text-slate-400">
                Notes are appended to the enforcement record and included in the weekly governance digest.
              </p>
            </div>
          </div>

          <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft md:grid-cols-2">
            <div className="space-y-3 text-xs text-slate-600">
              <h3 className="text-sm font-semibold text-slate-900">Templates</h3>
              <ul className="space-y-2">
                {resolvedTemplates.length
                  ? resolvedTemplates.map((template) => (
                      <li
                        key={template.id}
                        className={`rounded-2xl border p-3 transition ${
                          template.id === selectedTemplateId
                            ? 'border-slate-900 bg-slate-900/90 text-white shadow-[0_25px_60px_-40px_rgba(15,23,42,0.85)]'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:text-slate-900'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{template.name}</p>
                            <p className={`mt-1 text-xs ${template.id === selectedTemplateId ? 'text-white/80' : 'text-slate-500'}`}>
                              {template.description}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em]">
                            <button
                              type="button"
                              onClick={() => setSelectedTemplateId(template.id)}
                              className="rounded-full border border-current px-3 py-1"
                            >
                              Select
                            </button>
                            <button
                              type="button"
                              onClick={() => onTemplatePreview?.(template)}
                              className="rounded-full border border-current px-3 py-1"
                            >
                              Preview
                            </button>
                          </div>
                        </div>
                        {template.metrics ? (
                          <dl className="mt-3 grid grid-cols-2 gap-2 text-[0.65rem] uppercase tracking-[0.3em]">
                            {template.metrics.map((metric) => (
                              <div key={metric.label} className="rounded-2xl border border-white/20 bg-white/10 p-2 text-center">
                                <dt>{metric.label}</dt>
                                <dd className="mt-1 text-xs font-semibold text-white">
                                  {metric.value}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        ) : null}
                      </li>
                    ))
                  : (
                    <li className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-500">
                      No templates configured yet. Add templates for consistency.
                    </li>
                  )}
              </ul>
            </div>
            <div className="space-y-3 text-xs text-slate-600">
              <h3 className="text-sm font-semibold text-slate-900">History</h3>
              <ol className="space-y-2">
                {(history ?? []).map((event) => (
                  <li key={event.id ?? event.timestamp} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-900">{event.actor ?? 'System'}</span>
                      <span className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">{event.action}</span>
                    </div>
                    <p className="mt-1 text-slate-600">{event.notes ?? 'Action recorded.'}</p>
                    <p className="mt-1 text-slate-500">{new Date(event.timestamp).toLocaleString()}</p>
                  </li>
                ))}
              </ol>
              {!history?.length ? <p>No history captured yet.</p> : null}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
            <h3 className="text-sm font-semibold text-slate-900">Policy guardrails</h3>
            <p className="text-xs text-slate-500">
              Reference enforcement ladder stages, appeals protocol, and communication packages before finalising the action.
            </p>
            <ul className="space-y-2 text-xs text-slate-600">
              {(subject?.guidelines ?? []).map((guide) => (
                <li key={guide.id ?? guide.title} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{guide.title}</span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">
                      {guide.category ?? 'Policy'}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-600">{guide.description}</p>
                </li>
              ))}
              {!subject?.guidelines?.length ? <li className="text-xs text-slate-500">No guardrails attached.</li> : null}
            </ul>
          </div>

          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
            <h3 className="text-sm font-semibold text-slate-900">Impact analytics</h3>
            <div className="space-y-3">
              {(analytics ?? []).map((metric) => (
                <div key={metric.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">{metric.label}</span>
                    <span>{metric.value}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full bg-gradient-to-r from-emerald-400 via-sky-400 to-accent`}
                      style={{ width: `${Math.min(100, Math.max(0, metric.progress ?? 0))}%` }}
                    />
                  </div>
                </div>
              ))}
              {!analytics?.length ? <p className="text-xs text-slate-500">No analytics available.</p> : null}
            </div>
          </div>

          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-soft">
            <h3 className="text-sm font-semibold text-slate-900">Risk cues</h3>
            <ul className="space-y-2 text-xs text-slate-600">
              {(subject?.signals ?? []).map((signal) => (
                <li key={signal.id ?? signal.label} className={`rounded-2xl border p-3 ${
                  SEVERITY_LEVELS[signal.level]?.badge ?? 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{signal.label}</span>
                    <span>{signal.score ?? ''}</span>
                  </div>
                  <p className="mt-1 text-xs">
                    {signal.description ?? 'Signal raised by automated classifiers.'}
                  </p>
                </li>
              ))}
              {!subject?.signals?.length ? (
                <li className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-3 text-xs text-slate-500">
                  No risk cues recorded.
                </li>
              ) : null}
            </ul>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-500">
              <div className="flex items-center gap-2 font-semibold text-slate-700">
                <InformationCircleIcon className="h-4 w-4" aria-hidden="true" /> Appeals guidance
              </div>
              <p className="mt-1">
                If enforcement results in suspension, trigger the 24-hour appeal notification and attach evidence bundle for
                audit logs.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

ModerationActions.propTypes = {
  subject: PropTypes.shape({
    title: PropTypes.string,
    summary: PropTypes.string,
    excerpt: PropTypes.string,
    reporter: PropTypes.shape({
      name: PropTypes.string,
      accountAge: PropTypes.string,
    }),
    guidelines: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        title: PropTypes.string,
        description: PropTypes.string,
        category: PropTypes.string,
      }),
    ),
    signals: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        label: PropTypes.string,
        description: PropTypes.string,
        score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        level: PropTypes.oneOf(Object.keys(SEVERITY_LEVELS)),
      }),
    ),
    riskScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    severityScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    reports: PropTypes.number,
    aiSignals: PropTypes.arrayOf(PropTypes.object),
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        description: PropTypes.string,
        tone: PropTypes.string,
        icon: PropTypes.elementType,
      }),
    ),
    slaMinutes: PropTypes.number,
  }),
  templates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      metrics: PropTypes.arrayOf(
        PropTypes.shape({
          label: PropTypes.string.isRequired,
          value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        }),
      ),
    }),
  ),
  history: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
      action: PropTypes.string,
      actor: PropTypes.string,
      notes: PropTypes.string,
    }),
  ),
  analytics: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      progress: PropTypes.number,
    }),
  ),
  onExecute: PropTypes.func,
  loading: PropTypes.bool,
  onTemplatePreview: PropTypes.func,
};

ModerationActions.defaultProps = {
  subject: {},
  templates: [],
  history: [],
  analytics: [],
  onExecute: undefined,
  loading: false,
  onTemplatePreview: undefined,
};


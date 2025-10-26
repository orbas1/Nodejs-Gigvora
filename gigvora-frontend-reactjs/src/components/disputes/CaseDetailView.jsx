import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ArrowUpRightIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  PaperClipIcon,
  PlayCircleIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import ResolutionTimeline from './ResolutionTimeline.jsx';
import { describeTimeSince, formatAbsolute, formatRelativeTime } from '../../utils/date.js';

const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024; // 10MB

function toSentence(value) {
  if (!value) return '';
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatCurrency(value, currency = 'USD') {
  if (!Number.isFinite(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value));
  } catch (error) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
  }
}

async function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const { result } = reader;
      if (typeof result !== 'string') {
        reject(new Error('Unsupported file encoding.'));
        return;
      }
      const base64 = result.includes('base64,') ? result.split('base64,')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Unable to read file.'));
    reader.readAsDataURL(file);
  });
}

function Checklist({ checklist }) {
  if (!checklist?.length) {
    return (
      <p className="rounded-3xl border border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500 shadow-sm">
        Align with stakeholders to generate an action plan.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {checklist.map((item) => (
        <li
          key={item.id ?? item.label}
          className={`flex items-start gap-3 rounded-3xl border px-4 py-3 text-sm shadow-sm transition ${
            item.completed
              ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800'
              : 'border-slate-200 bg-white/70 text-slate-700'
          }`}
        >
          <CheckCircleIcon className={`mt-1 h-5 w-5 ${item.completed ? 'text-emerald-500' : 'text-slate-300'}`} aria-hidden="true" />
          <div>
            <p className="font-semibold">{item.label ?? 'Checklist item'}</p>
            {item.description ? <p className="text-xs text-slate-500">{item.description}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

Checklist.propTypes = {
  checklist: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
      description: PropTypes.string,
      completed: PropTypes.bool,
    }),
  ),
};

Checklist.defaultProps = {
  checklist: undefined,
};

function ParticipantGrid({ participants }) {
  if (!participants?.length) {
    return (
      <p className="rounded-3xl border border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500 shadow-sm">
        Participant roster will surface once collaborators join the case.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {participants.map((participant) => (
        <li
          key={participant.id ?? participant.email ?? participant.name}
          className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm"
        >
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/5 text-sm font-semibold text-slate-600">
            {(participant.name ?? participant.email ?? '?').slice(0, 2).toUpperCase()}
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">{participant.name ?? 'Participant'}</p>
            <p className="text-xs text-slate-500">{participant.role ? toSentence(participant.role) : 'Collaborator'}</p>
            {participant.email ? <p className="text-xs text-slate-400">{participant.email}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

ParticipantGrid.propTypes = {
  participants: PropTypes.arrayOf(PropTypes.object),
};

ParticipantGrid.defaultProps = {
  participants: undefined,
};

function DecisionLog({ decisions }) {
  if (!decisions?.length) {
    return (
      <p className="rounded-3xl border border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500 shadow-sm">
        No resolution entries yet. Capture decisions to keep everyone aligned.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {decisions.map((decision) => (
        <li
          key={decision.id ?? decision.recordedAt ?? Math.random().toString(36).slice(2)}
          className="rounded-3xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-800 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold">{decision.title ?? decision.summary ?? 'Decision captured'}</p>
            <span className="text-xs">{formatAbsolute(decision.recordedAt ?? decision.updatedAt)}</span>
          </div>
          {decision.notes ? <p className="mt-1 text-xs text-emerald-700">{decision.notes}</p> : null}
        </li>
      ))}
    </ol>
  );
}

DecisionLog.propTypes = {
  decisions: PropTypes.arrayOf(PropTypes.object),
};

DecisionLog.defaultProps = {
  decisions: undefined,
};

function EvidenceGallery({ attachments }) {
  if (!attachments?.length) {
    return (
      <p className="rounded-3xl border border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-500 shadow-sm">
        Upload call recordings, signed agreements, or screenshots to build trust quickly.
      </p>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {attachments.map((file) => (
        <li
          key={file.id ?? file.fileName ?? file.url}
          className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900/5">
            <PaperClipIcon className="h-5 w-5 text-slate-500" aria-hidden="true" />
          </span>
          <div className="flex-1 text-sm">
            <p className="font-semibold text-slate-900">{file.label ?? file.fileName ?? 'Attachment'}</p>
            <p className="text-xs text-slate-500">{file.description ?? file.type ?? 'Uploaded evidence'}</p>
          </div>
          {file.url ? (
            <a
              href={file.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              View
              <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

EvidenceGallery.propTypes = {
  attachments: PropTypes.arrayOf(PropTypes.object),
};

EvidenceGallery.defaultProps = {
  attachments: undefined,
};

function buildChecklist(dispute) {
  if (Array.isArray(dispute?.checklist) && dispute.checklist.length) {
    return dispute.checklist;
  }
  return [
    {
      id: 'verify-evidence',
      label: 'Validate submitted evidence',
      description: 'Confirm authenticity of attachments and redact sensitive data.',
      completed: Boolean(dispute?.evidenceReviewedAt),
    },
    {
      id: 'coordinate-call',
      label: 'Schedule mediation touchpoint',
      description: 'Bring both parties into a guided resolution call within 24 hours.',
      completed: Boolean(dispute?.mediationScheduledAt),
    },
    {
      id: 'issue-update',
      label: 'Share next steps with stakeholders',
      description: 'Publish a templated update covering SLA commitments and deliverables.',
      completed: Boolean(dispute?.lastCommunicatedAt),
    },
  ];
}

function buildDecisions(dispute) {
  if (Array.isArray(dispute?.decisionLog) && dispute.decisionLog.length) {
    return dispute.decisionLog;
  }
  if (dispute?.resolutionNotes) {
    return [
      {
        id: 'resolution-notes',
        title: 'Resolution notes',
        notes: dispute.resolutionNotes,
        recordedAt: dispute.resolvedAt ?? dispute.updatedAt,
      },
    ];
  }
  return [];
}

function computeSla(dispute) {
  const now = new Date();
  const deadline = dispute?.customerDeadlineAt ?? dispute?.providerDeadlineAt ?? dispute?.nextSlaAt;
  if (!deadline) {
    return { status: 'tracking', message: 'SLA countdown activates when deadlines are published.' };
  }
  const dueDate = new Date(deadline);
  const diff = dueDate.getTime() - now.getTime();
  if (Number.isNaN(diff)) {
    return { status: 'tracking', message: 'SLA countdown activates when deadlines are published.' };
  }
  const hours = Math.round(diff / (1000 * 60 * 60));
  if (hours < 0) {
    return { status: 'breach', message: `Breach detected ${formatRelativeTime(dueDate, { numeric: 'auto' })}.` };
  }
  if (hours < 12) {
    return { status: 'risk', message: `At risk – ${formatRelativeTime(dueDate, { numeric: 'auto' })}.` };
  }
  return { status: 'tracking', message: `On track – ${formatRelativeTime(dueDate, { numeric: 'auto' })}.` };
}

export default function CaseDetailView({
  dispute,
  metadata,
  busy,
  onAppendEvent,
  onRefresh,
}) {
  const [formState, setFormState] = useState({
    notes: '',
    stage: '',
    status: '',
    actionType: 'comment',
    file: null,
  });
  const [error, setError] = useState(null);

  const stageOptions = metadata?.stages ?? [];
  const statusOptions = metadata?.statuses ?? [];
  const actionTemplates = metadata?.actionTypes ?? [];

  const checklist = useMemo(() => buildChecklist(dispute), [dispute]);
  const decisions = useMemo(() => buildDecisions(dispute), [dispute]);
  const participants = dispute?.participants ?? dispute?.collaborators ?? [];
  const attachments = dispute?.attachments ?? dispute?.evidence ?? [];
  const timeline = dispute?.events ?? [];

  const sla = useMemo(() => computeSla(dispute), [dispute]);

  const summaryMetrics = useMemo(() => {
    const financial = dispute?.financials ?? {};
    return [
      {
        id: 'amount',
        label: 'Contested amount',
        value: formatCurrency(financial.amountDisputed ?? financial.amount ?? dispute?.amountDisputed ?? 0, financial.currency),
      },
      {
        id: 'opened',
        label: 'Opened',
        value: describeTimeSince(dispute?.openedAt ?? dispute?.createdAt),
      },
      {
        id: 'updated',
        label: 'Last touchpoint',
        value: describeTimeSince(dispute?.updatedAt ?? dispute?.lastEventAt),
      },
      {
        id: 'priority',
        label: 'Priority',
        value: toSentence(dispute?.priority ?? 'standard'),
      },
    ];
  }, [dispute]);

  const handleTemplate = (template) => {
    if (!template) return;
    setFormState((previous) => ({
      ...previous,
      notes: `${template.prefill ?? template.description ?? ''}`.trim() || previous.notes,
      stage: template.stage ?? previous.stage,
      status: template.status ?? previous.status,
      actionType: template.actionType ?? previous.actionType,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!dispute) {
      return;
    }
    setError(null);

    const payload = {
      notes: formState.notes.trim(),
      stage: formState.stage || undefined,
      status: formState.status || undefined,
      actionType: formState.actionType,
    };

    if (!payload.notes) {
      setError('Add context to your update before submitting.');
      return;
    }

    if (formState.file) {
      if (formState.file.size > MAX_EVIDENCE_BYTES) {
        setError('Evidence files must be under 10MB.');
        return;
      }
      const base64 = await readFileAsBase64(formState.file);
      payload.evidence = {
        fileName: formState.file.name,
        contentType: formState.file.type,
        content: base64,
      };
    }

    try {
      await onAppendEvent?.(payload);
      setFormState({ notes: '', stage: '', status: '', actionType: 'comment', file: null });
    } catch (submitError) {
      setError(submitError?.message ?? 'We could not record your update.');
    }
  };

  const headerGradient =
    dispute?.severity === 'critical' || dispute?.status === 'escalated'
      ? 'from-rose-500/90 via-rose-500/70 to-rose-400/60'
      : 'from-blue-600/90 via-indigo-500/70 to-sky-500/60';

  return (
    <div className="space-y-6">
      <div className={`relative overflow-hidden rounded-4xl bg-gradient-to-br ${headerGradient} p-6 text-white shadow-xl`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)]" aria-hidden="true" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Case overview</p>
            <h3 className="text-3xl font-semibold leading-snug">
              {dispute?.title ?? dispute?.reference ?? `Case #${dispute?.id ?? '—'}`}
            </h3>
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1">
                <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
                {toSentence(dispute?.status ?? 'open')}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1">
                <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
                {toSentence(dispute?.stage ?? 'intake')}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1">
                Priority {toSentence(dispute?.priority ?? 'standard')}
              </span>
            </div>
          </div>
          <div className="rounded-3xl border border-white/30 bg-white/10 p-4 text-sm backdrop-blur">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/70">
              <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" /> SLA status
            </p>
            <p className={`mt-2 text-lg font-semibold ${
              sla.status === 'breach' ? 'text-rose-100' : sla.status === 'risk' ? 'text-amber-100' : 'text-emerald-50'
            }`}
            >
              {sla.message}
            </p>
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryMetrics.map((metric) => (
          <div
            key={metric.id}
            className="rounded-3xl border border-slate-200 bg-white/80 p-4 text-sm font-semibold text-slate-700 shadow-sm"
          >
            <p className="text-xs uppercase tracking-wide text-slate-400">{metric.label}</p>
            <p className="mt-2 text-lg text-slate-900">{metric.value || '—'}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          <article className="rounded-4xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur">
            <header className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">Resolution timeline</h4>
                <p className="text-sm text-slate-500">Trace every intervention and stakeholder touchpoint.</p>
              </div>
              <button
                type="button"
                onClick={() => onRefresh?.({ force: true })}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
              >
                <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Refresh
              </button>
            </header>
            <div className="mt-4">
              <ResolutionTimeline events={timeline} />
            </div>
          </article>

          <article className="rounded-4xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur">
            <header className="flex items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">Log update</h4>
                <p className="text-sm text-slate-500">Share outcomes, upload evidence, and keep SLAs honest.</p>
              </div>
              {error ? <p className="text-xs font-semibold text-rose-500">{error}</p> : null}
            </header>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Narrative</label>
                <textarea
                  className="mt-1 w-full rounded-3xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-slate-900 focus:outline-none"
                  rows="3"
                  placeholder="Document what changed, who you spoke with, and next commitments."
                  value={formState.notes}
                  onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stage
                  <select
                    className="w-full rounded-3xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-600"
                    value={formState.stage}
                    onChange={(event) => setFormState((prev) => ({ ...prev, stage: event.target.value }))}
                  >
                    <option value="">Keep current</option>
                    {(stageOptions ?? []).map((option) => (
                      <option key={option.value ?? option} value={option.value ?? option}>
                        {toSentence(option.label ?? option.name ?? option.value ?? option)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                  <select
                    className="w-full rounded-3xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-600"
                    value={formState.status}
                    onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value }))}
                  >
                    <option value="">Keep current</option>
                    {(statusOptions ?? []).map((option) => (
                      <option key={option.value ?? option} value={option.value ?? option}>
                        {toSentence(option.label ?? option.name ?? option.value ?? option)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action type
                  <select
                    className="w-full rounded-3xl border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-600"
                    value={formState.actionType}
                    onChange={(event) => setFormState((prev) => ({ ...prev, actionType: event.target.value }))}
                  >
                    {(actionTemplates.length ? actionTemplates : ['comment', 'call', 'escalation']).map((option) => {
                      const value = option.value ?? option.id ?? option;
                      const label = option.label ?? option.name ?? toSentence(option.title ?? value);
                      return (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Evidence upload
                <input
                  type="file"
                  className="mt-1 block w-full rounded-3xl border border-dashed border-slate-300 bg-white/60 px-4 py-3 text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-slate-400"
                  onChange={(event) => setFormState((prev) => ({ ...prev, file: event.target.files?.[0] ?? null }))}
                />
              </label>
              {actionTemplates?.length ? (
                <div className="flex flex-wrap gap-2 text-xs">
                  {actionTemplates.slice(0, 3).map((template) => (
                    <button
                      key={template.id ?? template.value ?? template.name}
                      type="button"
                      onClick={() => handleTemplate(template)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                    >
                      <PlayCircleIcon className="h-4 w-4" aria-hidden="true" />
                      Use template: {template.label ?? template.name ?? template.title}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-slate-500">Updates notify collaborators instantly and refresh SLA monitors.</p>
                <button
                  type="submit"
                  disabled={busy}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-lg transition ${
                    busy ? 'bg-slate-300 text-slate-500' : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  Submit update
                </button>
              </div>
            </form>
          </article>
        </div>

        <div className="space-y-6">
          <article className="rounded-4xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur">
            <header className="flex items-center justify-between gap-2">
              <h4 className="text-lg font-semibold text-slate-900">Action checklist</h4>
              <ClipboardDocumentListIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </header>
            <div className="mt-4">
              <Checklist checklist={checklist} />
            </div>
          </article>

          <article className="rounded-4xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur">
            <header className="flex items-center justify-between gap-2">
              <h4 className="text-lg font-semibold text-slate-900">Participants</h4>
              <UserGroupIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </header>
            <div className="mt-4">
              <ParticipantGrid participants={participants} />
            </div>
          </article>

          <article className="rounded-4xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur">
            <header className="flex items-center justify-between gap-2">
              <h4 className="text-lg font-semibold text-slate-900">Decision log</h4>
              <ShieldCheckIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </header>
            <div className="mt-4">
              <DecisionLog decisions={decisions} />
            </div>
          </article>

          <article className="rounded-4xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur">
            <header className="flex items-center justify-between gap-2">
              <h4 className="text-lg font-semibold text-slate-900">Evidence locker</h4>
              <PaperClipIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </header>
            <div className="mt-4">
              <EvidenceGallery attachments={attachments} />
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

CaseDetailView.propTypes = {
  dispute: PropTypes.object,
  metadata: PropTypes.shape({
    stages: PropTypes.array,
    statuses: PropTypes.array,
    actionTypes: PropTypes.array,
  }),
  busy: PropTypes.bool,
  onAppendEvent: PropTypes.func,
  onRefresh: PropTypes.func,
};

CaseDetailView.defaultProps = {
  dispute: null,
  metadata: null,
  busy: false,
  onAppendEvent: undefined,
  onRefresh: undefined,
};

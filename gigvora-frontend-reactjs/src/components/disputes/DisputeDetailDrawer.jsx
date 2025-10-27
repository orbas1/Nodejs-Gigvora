import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  DocumentArrowDownIcon,
  PaperClipIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { formatRelativeTime } from '../../utils/date.js';
import { readFileAsBase64 } from '../../utils/file.js';

const DEFAULT_STAGE_OPTIONS = ['intake', 'mediation', 'arbitration', 'resolved'];
const DEFAULT_STATUS_OPTIONS = ['open', 'awaiting_customer', 'under_review', 'settled', 'closed'];
const DEFAULT_PRIORITY_OPTIONS = ['urgent', 'high', 'medium', 'low'];

function formatDateInput(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 16);
}

function humanize(value) {
  if (!value) {
    return '';
  }
  return value.replace(/_/g, ' ');
}

function formatCurrency(amount, currency = 'USD') {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return null;
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch (error) {
    return `${amount.toLocaleString()} ${currency}`.trim();
  }
}

export default function DisputeDetailDrawer({
  dispute,
  open,
  loading,
  onClose,
  onUpdate,
  onAddEvent,
  onSubmit,
  templates,
  metadata,
  variant = 'drawer',
  inline = false,
  busy = false,
}) {
  const [formState, setFormState] = useState({});
  const [eventState, setEventState] = useState({ notes: '', stage: '', status: '', file: null });
  const [saving, setSaving] = useState(false);
  const [addingEvent, setAddingEvent] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [eventError, setEventError] = useState(null);

  const isInlineVariant = inline || variant === 'inline';
  const shouldRender = isInlineVariant || open;

  const normalizeOptionList = (options, fallback) => {
    if (!options || (Array.isArray(options) && options.length === 0)) {
      return fallback.map((value) => ({ value, label: humanize(value) }));
    }
    if (!Array.isArray(options)) {
      return fallback.map((value) => ({ value, label: humanize(value) }));
    }
    return options
      .map((option) => {
        if (option == null) {
          return null;
        }
        if (typeof option === 'string') {
          return { value: option, label: humanize(option) };
        }
        const value = option.value ?? option.id ?? option.key ?? option.code;
        if (!value) {
          return null;
        }
        return { value, label: option.label ?? option.name ?? humanize(String(value)) };
      })
      .filter(Boolean);
  };

  const stageOptions = useMemo(
    () => normalizeOptionList(metadata?.stages, DEFAULT_STAGE_OPTIONS),
    [metadata?.stages],
  );
  const statusOptions = useMemo(
    () => normalizeOptionList(metadata?.statuses, DEFAULT_STATUS_OPTIONS),
    [metadata?.statuses],
  );
  const priorityOptions = useMemo(
    () => normalizeOptionList(metadata?.priorities, DEFAULT_PRIORITY_OPTIONS),
    [metadata?.priorities],
  );

  useEffect(() => {
    if (dispute) {
      setFormState({
        assignedToId: dispute.assignedToId ?? '',
        priority: dispute.priority ?? (priorityOptions[0]?.value ?? 'medium'),
        stage: dispute.stage ?? (stageOptions[0]?.value ?? 'intake'),
        status: dispute.status ?? (statusOptions[0]?.value ?? 'open'),
        customerDeadlineAt: formatDateInput(dispute.customerDeadlineAt),
        providerDeadlineAt: formatDateInput(dispute.providerDeadlineAt),
        resolutionNotes: dispute.resolutionNotes ?? '',
        reasonCode: dispute.reasonCode ?? '',
        summary: dispute.summary ?? '',
      });
    } else {
      setFormState({});
    }
    setEventState({ notes: '', stage: '', status: '', file: null });
    setUpdateError(null);
    setEventError(null);
  }, [dispute, priorityOptions, stageOptions, statusOptions]);

  const templateLookup = useMemo(() => {
    const map = new Map();
    (templates ?? []).forEach((template) => {
      map.set(template.id, template);
    });
    return map;
  }, [templates]);

  const handleTemplateApply = (event) => {
    const templateId = Number.parseInt(event.target.value, 10);
    if (!Number.isFinite(templateId)) {
      return;
    }
    const template = templateLookup.get(templateId);
    if (!template) {
      return;
    }
    setFormState((current) => ({
      ...current,
      stage: template.defaultStage ?? current.stage,
      priority: template.defaultPriority ?? current.priority,
      reasonCode: template.reasonCode ?? current.reasonCode,
      resolutionNotes: template.guidance ?? current.resolutionNotes,
    }));
    setEventState((current) => ({
      ...current,
      notes: template.guidance ?? current.notes,
      stage: template.defaultStage ?? current.stage,
    }));
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (!dispute || typeof onUpdate !== 'function') return;
    setSaving(true);
    setUpdateError(null);
    try {
      await onUpdate?.(dispute.id, {
        ...formState,
        customerDeadlineAt: formState.customerDeadlineAt ? new Date(formState.customerDeadlineAt).toISOString() : null,
        providerDeadlineAt: formState.providerDeadlineAt ? new Date(formState.providerDeadlineAt).toISOString() : null,
      });
    } catch (error) {
      setUpdateError(error?.message ?? 'Unable to update dispute.');
    } finally {
      setSaving(false);
    }
  };

  const handleEventSubmit = async (event) => {
    event.preventDefault();
    const logEvent = typeof onAddEvent === 'function' ? onAddEvent : typeof onSubmit === 'function' ? onSubmit : null;
    if (!dispute || !logEvent) return;
    setAddingEvent(true);
    setEventError(null);
    try {
      let evidence = null;
      if (eventState.file) {
        const content = await readFileAsBase64(eventState.file);
        evidence = {
          content,
          fileName: eventState.file.name,
          contentType: eventState.file.type,
        };
      }
      const payload = {
        notes: eventState.notes,
        stage: eventState.stage || undefined,
        status: eventState.status || undefined,
        evidence,
      };
      await logEvent(dispute.id, payload);
      setEventState({ notes: '', stage: '', status: '', file: null });
    } catch (error) {
      setEventError(error?.message ?? 'Unable to log update.');
    } finally {
      setAddingEvent(false);
    }
  };

  const events = dispute?.events ?? [];
  const transaction = dispute?.transaction ?? {};
  const trust = dispute?.trust ?? {};
  const trustScore = typeof trust.score === 'number' ? Math.round(trust.score) : null;
  const riskLevel = trust.riskLevel ?? null;
  const trustDescriptor = (() => {
    if (trustScore == null) {
      return 'Confidence calibrating—log proactive updates to unlock trust insights.';
    }
    if (trustScore >= 85) {
      return 'Concierge updates are landing—keep sharing receipts and next steps.';
    }
    if (trustScore >= 70) {
      return 'Confidence is steady; maintain cadence on promised follow-ups.';
    }
    return 'Confidence is fragile. Pair every update with evidence and customer outreach.';
  })();
  const riskBadgeTone = {
    low: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-rose-100 text-rose-700',
    critical: 'bg-rose-200 text-rose-900',
  };
  const exposureAmount =
    typeof trust.exposureAmount === 'number' ? trust.exposureAmount : trust.exposure?.amount ?? trust.openExposure?.amount;
  const exposureCurrency = trust.exposureCurrency ?? trust.exposure?.currency ?? trust.openExposure?.currency ?? 'USD';
  const exposureValue = formatCurrency(exposureAmount, exposureCurrency);
  const hasTrustInsight =
    trustScore != null ||
    riskLevel ||
    typeof trust.slaBreaches === 'number' ||
    exposureValue ||
    trust.nextAction ||
    trust.lastInteractionAt ||
    trust.autoEscalatedAt;

  if (!shouldRender) {
    return null;
  }

  const disableUpdate = saving || busy;
  const disableEvent = addingEvent || busy;
  const canUpdate = typeof onUpdate === 'function';
  const canLogEvent = typeof onAddEvent === 'function' || typeof onSubmit === 'function';

  const header = (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
      <div className="flex items-center gap-3">
        {isInlineVariant ? null : (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dispute case</p>
          <h3 className="text-lg font-semibold text-slate-900">#{dispute?.id ?? '—'}</h3>
        </div>
      </div>
      {transaction?.reference ? (
        <Link
          to="/finance"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
        >
          View escrow
          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );

  const body = (
    <div className="flex-1 space-y-6 px-6 py-6">
      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : !dispute ? (
        <p className="text-sm text-slate-500">Select a dispute to view details.</p>
      ) : (
        <>
          <section className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Case summary</h4>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reason</p>
                <p className="text-sm text-slate-800">{humanize(dispute.reasonCode)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Opened</p>
                <p className="text-sm text-slate-800">
                  {dispute.openedAt ? new Date(dispute.openedAt).toLocaleString() : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</p>
                <p className="text-sm text-slate-800">{dispute.summary}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Escrow amount</p>
                <p className="text-sm text-slate-800">
                  {transaction?.amount != null
                    ? `${transaction.amount} ${transaction.currencyCode ?? 'USD'}`
                    : '—'}
                </p>
              </div>
            </div>
          </section>

          {hasTrustInsight ? (
            <section className="rounded-2xl border border-blue-200/60 bg-blue-50/60 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-600">Trust & escalation</h4>
                {riskLevel ? (
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                      riskBadgeTone[riskLevel] ?? 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
                    {humanize(String(riskLevel))} risk
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
                    Stable
                  </span>
                )}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Confidence score</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {trustScore != null ? `${trustScore}/100` : 'Calibrating'}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{trustDescriptor}</p>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  {typeof trust.slaBreaches === 'number' ? (
                    <p>
                      {trust.slaBreaches} SLA {trust.slaBreaches === 1 ? 'breach' : 'breaches'} tracked on this case.
                    </p>
                  ) : null}
                  {exposureValue ? <p>Financial exposure {exposureValue}.</p> : null}
                  {trust.owner ? <p>Specialist {trust.owner} owns the next action.</p> : null}
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                {trust.nextAction ? (
                  <div className="rounded-2xl bg-white/70 p-3 shadow-inner">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Next action</p>
                    <p className="mt-1 text-slate-700">{trust.nextAction}</p>
                  </div>
                ) : null}
                {trust.lastInteractionAt ? (
                  <div className="rounded-2xl bg-white/70 p-3 shadow-inner">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Last touch</p>
                    <p className="mt-1 flex items-center gap-2 text-slate-700">
                      <ClockIcon className="h-4 w-4" aria-hidden="true" />
                      {formatRelativeTime(trust.lastInteractionAt)}
                    </p>
                  </div>
                ) : null}
                {trust.autoEscalatedAt ? (
                  <div className="rounded-2xl bg-white/70 p-3 shadow-inner">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Escalation</p>
                    <p className="mt-1 text-slate-700">
                      Auto-escalated {formatRelativeTime(trust.autoEscalatedAt)}.
                    </p>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {canUpdate ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Update dispute</h4>
                {(templates ?? []).length ? (
                  <select
                    onChange={handleTemplateApply}
                    defaultValue=""
                    aria-label="Apply resolution template"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                  >
                    <option value="">Apply template</option>
                    {(templates ?? []).map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
              <form className="mt-4 space-y-4" onSubmit={handleUpdate}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-700">Stage</span>
                    <select
                      name="stage"
                      value={formState.stage ?? stageOptions[0]?.value ?? ''}
                      onChange={handleFieldChange}
                      disabled={disableUpdate}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                    >
                      {stageOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-700">Status</span>
                    <select
                      name="status"
                      value={formState.status ?? statusOptions[0]?.value ?? ''}
                      onChange={handleFieldChange}
                      disabled={disableUpdate}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-700">Priority</span>
                    <select
                      name="priority"
                      value={formState.priority ?? priorityOptions[0]?.value ?? ''}
                      onChange={handleFieldChange}
                      disabled={disableUpdate}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                    >
                      {priorityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-700">Assignee ID</span>
                    <input
                      type="text"
                      name="assignedToId"
                      value={formState.assignedToId ?? ''}
                      onChange={handleFieldChange}
                      placeholder="User ID"
                      disabled={disableUpdate}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-700">Customer deadline</span>
                    <input
                      type="datetime-local"
                      name="customerDeadlineAt"
                      value={formState.customerDeadlineAt ?? ''}
                      onChange={handleFieldChange}
                      disabled={disableUpdate}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-700">Provider deadline</span>
                    <input
                      type="datetime-local"
                      name="providerDeadlineAt"
                      value={formState.providerDeadlineAt ?? ''}
                      onChange={handleFieldChange}
                      disabled={disableUpdate}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                    />
                  </label>
                </div>
                <label className="space-y-1 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Resolution notes</span>
                  <textarea
                    name="resolutionNotes"
                    value={formState.resolutionNotes ?? ''}
                    onChange={handleFieldChange}
                    rows={3}
                    disabled={disableUpdate}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                  />
                </label>
                <label className="space-y-1 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Summary</span>
                  <textarea
                    name="summary"
                    value={formState.summary ?? ''}
                    onChange={handleFieldChange}
                    rows={2}
                    disabled={disableUpdate}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                  />
                </label>
                {updateError ? (
                  <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{updateError}</p>
                ) : null}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={disableUpdate}
                    className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                  >
                    {saving ? 'Saving…' : 'Save updates'}
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Event timeline</h4>
            <div className="mt-4 space-y-4">
              {events.length === 0 ? (
                <p className="text-sm text-slate-500">No updates yet. Add a note, evidence, or change request.</p>
              ) : (
                events.map((eventItem) => (
                  <article key={eventItem.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-600">{humanize(eventItem.actionType)}</span>
                      <span>{eventItem.eventAt ? new Date(eventItem.eventAt).toLocaleString() : '—'}</span>
                    </div>
                    {eventItem.notes ? (
                      <p className="mt-2 text-sm text-slate-700">{eventItem.notes}</p>
                    ) : null}
                    {eventItem.evidenceUrl ? (
                      <a
                        href={eventItem.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                        {eventItem.evidenceFileName ?? 'Download evidence'}
                      </a>
                    ) : null}
                  </article>
                ))
              )}
            </div>
            {canLogEvent ? (
              <form className="mt-4 space-y-3" onSubmit={handleEventSubmit}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add update</p>
                <textarea
                  value={eventState.notes}
                  onChange={(event) => setEventState((current) => ({ ...current, notes: event.target.value }))}
                  rows={3}
                  placeholder="Provide an update, summary of outreach, or next steps."
                  disabled={disableEvent}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  <select
                    value={eventState.stage}
                    onChange={(event) => setEventState((current) => ({ ...current, stage: event.target.value }))}
                    disabled={disableEvent}
                    aria-label="Update stage"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                  >
                    <option value="">Keep stage</option>
                    {stageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={eventState.status}
                    onChange={(event) => setEventState((current) => ({ ...current, status: event.target.value }))}
                    disabled={disableEvent}
                    aria-label="Update status"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                  >
                    <option value="">Keep status</option>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm transition hover:border-blue-300">
                    <PaperClipIcon className="h-4 w-4" />
                    <span>Attach evidence</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(event) =>
                        setEventState((current) => ({ ...current, file: event.target.files?.[0] ?? null }))
                      }
                      disabled={disableEvent}
                    />
                  </label>
                </div>
                {eventError ? (
                  <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{eventError}</p>
                ) : null}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={disableEvent || !eventState.notes.trim()}
                    className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                  >
                    {addingEvent ? 'Logging…' : 'Log update'}
                  </button>
                </div>
              </form>
            ) : null}
          </section>
        </>
      )}
    </div>
  );

  if (isInlineVariant) {
    return (
      <aside className="flex h-full w-full flex-col overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
        {header}
        {body}
      </aside>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex ${open ? '' : 'pointer-events-none'} transition`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-slate-900/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`ml-auto flex h-full w-full max-w-4xl flex-col overflow-y-auto bg-white shadow-2xl transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {header}
        {body}
      </aside>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  BoltIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  PaperClipIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { readFileAsBase64 } from '../../utils/file.js';
import {
  DISPUTE_ACTION_OPTIONS,
  DISPUTE_STAGE_OPTIONS,
  DISPUTE_STATUS_OPTIONS,
} from '../../constants/disputes.js';

const INITIAL_FORM = {
  notes: '',
  actionType: 'comment',
  stage: '',
  status: '',
  customerDeadlineAt: '',
  providerDeadlineAt: '',
  transactionResolution: 'none',
  resolutionNotes: '',
  file: null,
};

function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatRelative(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const diff = Date.now() - date.getTime();
  const abs = Math.abs(diff);
  const minutes = Math.round(abs / (1000 * 60));
  if (minutes < 1) {
    return diff >= 0 ? 'just now' : 'in under a minute';
  }
  if (minutes < 60) {
    const unit = minutes === 1 ? 'min' : 'mins';
    return diff >= 0 ? `${minutes} ${unit} ago` : `in ${minutes} ${unit}`;
  }
  const hours = Math.round(abs / (1000 * 60 * 60));
  if (hours < 24) {
    const unit = hours === 1 ? 'hour' : 'hours';
    return diff >= 0 ? `${hours} ${unit} ago` : `in ${hours} ${unit}`;
  }
  const days = Math.round(abs / (1000 * 60 * 60 * 24));
  const unit = days === 1 ? 'day' : 'days';
  return diff >= 0 ? `${days} ${unit} ago` : `in ${days} ${unit}`;
}

function formatCurrency(amount, currency = 'USD') {
  if (amount == null) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch (error) {
    return `${Number(amount).toFixed(2)} ${currency}`;
  }
}

function FieldLabel({ title, value = '—', emphasis = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className={`mt-2 text-sm font-medium ${emphasis ? 'text-slate-900' : 'text-slate-600'}`}>{value}</p>
    </div>
  );
}

FieldLabel.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.node,
  emphasis: PropTypes.bool,
};

function ChecklistItem({ complete = false, label, helper = null }) {
  return (
    <li
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-soft transition ${
        complete
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-white text-slate-600'
      }`}
    >
      {complete ? <CheckCircleIcon className="mt-0.5 h-5 w-5" /> : <ShieldCheckIcon className="mt-0.5 h-5 w-5" />}
      <div>
        <p className="font-semibold text-slate-700">{label}</p>
        {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
      </div>
    </li>
  );
}

ChecklistItem.propTypes = {
  complete: PropTypes.bool,
  label: PropTypes.string.isRequired,
  helper: PropTypes.string,
};

function OptionSelect({ label, value = '', onChange, options, placeholder = null }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

OptionSelect.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired }),
  ).isRequired,
  placeholder: PropTypes.string,
};

function resolveOptions(options, fallback) {
  if (Array.isArray(options) && options.length > 0) {
    return options.map((option) =>
      typeof option === 'string'
        ? { value: option, label: option.replace(/_/g, ' ') }
        : { value: option.value ?? option.id, label: option.label ?? option.name ?? option.value },
    );
  }
  return fallback;
}

function buildDecisionLog(events = []) {
  return events
    .filter((event) => ['status_change', 'stage_advanced', 'system_notice'].includes(event.actionType))
    .slice()
    .reverse();
}

function buildTouchMap(events = []) {
  const touches = events.reduce(
    (acc, event) => {
      const key = event.actorType ?? 'system';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {},
  );
  return Object.entries(touches).map(([actor, count]) => ({ actor, count }));
}

export default function CaseDetailView({
  detail = null,
  loading = false,
  error = null,
  busy = false,
  onSubmit,
  onClose,
}) {
  const dispute = detail?.dispute ?? null;
  const events = detail?.events ?? [];
  const availableStages = useMemo(
    () => resolveOptions(detail?.availableStages, DISPUTE_STAGE_OPTIONS),
    [detail?.availableStages],
  );
  const availableStatuses = useMemo(
    () => resolveOptions(detail?.availableStatuses, DISPUTE_STATUS_OPTIONS),
    [detail?.availableStatuses],
  );
  const availableActions = useMemo(
    () => resolveOptions(detail?.availableActionTypes, DISPUTE_ACTION_OPTIONS),
    [detail?.availableActionTypes],
  );
  const resolutionOptions = useMemo(
    () =>
      resolveOptions(
        detail?.resolutionOptions,
        [
          { value: 'none', label: 'No fund movement' },
          { value: 'refund', label: 'Refund customer' },
          { value: 'release', label: 'Release funds to provider' },
        ],
      ),
    [detail?.resolutionOptions],
  );

  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!dispute) {
      setForm(INITIAL_FORM);
      setFormError(null);
      return;
    }
    setForm((current) => ({
      ...INITIAL_FORM,
      actionType: current.actionType || availableActions[0]?.value || 'comment',
      stage: dispute.stage || availableStages[0]?.value || '',
      status: dispute.status || availableStatuses[0]?.value || '',
      customerDeadlineAt: dispute.customerDeadlineAt ? dispute.customerDeadlineAt.slice(0, 16) : '',
      providerDeadlineAt: dispute.providerDeadlineAt ? dispute.providerDeadlineAt.slice(0, 16) : '',
      transactionResolution: 'none',
      resolutionNotes: dispute.resolutionNotes ?? '',
    }));
    setFormError(null);
  }, [dispute?.id, dispute?.stage, dispute?.status, dispute?.customerDeadlineAt, dispute?.providerDeadlineAt, availableActions, availableStages, availableStatuses, dispute?.resolutionNotes]);

  const checklist = useMemo(
    () => [
      {
        id: 'owner',
        label: 'Owner assigned',
        complete: Boolean(dispute?.assignedToId),
        helper: dispute?.assignedToId ? `User #${dispute.assignedToId}` : 'Assign a reviewer to accelerate mediation.',
      },
      {
        id: 'sla',
        label: 'SLA in place',
        complete: Boolean(dispute?.customerDeadlineAt || dispute?.providerDeadlineAt),
        helper: dispute?.customerDeadlineAt || dispute?.providerDeadlineAt
          ? 'Deadline captured in timeline.'
          : 'Set customer or provider deadlines to manage expectations.',
      },
      {
        id: 'resolution',
        label: 'Resolution notes captured',
        complete: Boolean(dispute?.resolutionNotes?.trim()),
        helper: dispute?.resolutionNotes ? 'Notes ready for closure review.' : 'Summarise next steps for executive visibility.',
      },
    ],
    [dispute?.assignedToId, dispute?.customerDeadlineAt, dispute?.providerDeadlineAt, dispute?.resolutionNotes],
  );

  const decisionLog = useMemo(() => buildDecisionLog(events), [events]);
  const touches = useMemo(() => buildTouchMap(events), [events]);
  const latestEvent = events.length ? events[events.length - 1] : null;

  const handleInputChange = (field) => (event) => {
    const { value, files } = event.target;
    setForm((current) => ({
      ...current,
      [field]: event.target.type === 'file' ? files?.[0] ?? null : value,
    }));
  };

  const handleSelectChange = (field) => (value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (submitEvent) => {
    submitEvent.preventDefault();
    if (!dispute || typeof onSubmit !== 'function') {
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      let evidence = null;
      if (form.file) {
        const content = await readFileAsBase64(form.file);
        evidence = {
          content,
          encoding: 'base64',
          fileName: form.file.name,
          contentType: form.file.type || 'application/octet-stream',
        };
      }

      const payload = {
        notes: form.notes?.trim() ? form.notes.trim() : undefined,
        actionType: form.actionType || 'comment',
        stage: form.stage || undefined,
        status: form.status || undefined,
        customerDeadlineAt: form.customerDeadlineAt ? new Date(form.customerDeadlineAt).toISOString() : undefined,
        providerDeadlineAt: form.providerDeadlineAt ? new Date(form.providerDeadlineAt).toISOString() : undefined,
        transactionResolution: form.transactionResolution || 'none',
        resolutionNotes: form.resolutionNotes?.trim() ? form.resolutionNotes.trim() : undefined,
        evidence,
      };

      await onSubmit(dispute.id, payload);
      setForm(INITIAL_FORM);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause : new Error('Unable to save update.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-soft">
      <header className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Case detail</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            {dispute ? dispute.summary : 'Select a dispute'}
          </h2>
          {dispute ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-white">{dispute.stage}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                {dispute.status.replace(/_/g, ' ')}
              </span>
              <span className="rounded-full bg-gradient-to-r from-amber-500 to-rose-500 px-3 py-1 text-white">
                {dispute.priority}
              </span>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
            {dispute ? `Updated ${formatRelative(dispute.updatedAt) ?? formatDateTime(dispute.updatedAt)}` : '—'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Close
          </button>
        </div>
      </header>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error.message || 'Unable to load case detail.'}
        </p>
      ) : null}

      {!dispute && !loading ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
          <SparklesIcon className="h-10 w-10 text-slate-300" />
          <div className="space-y-2">
            <p className="text-lg font-semibold text-slate-700">Choose a case to unlock insights</p>
            <p className="text-sm text-slate-500">
              Metrics, decision history, and guided actions will appear as soon as you select a dispute from the queue.
            </p>
          </div>
        </div>
      ) : null}

      {dispute ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FieldLabel
              title="Escrow amount"
              value={formatCurrency(dispute.transaction?.amount, dispute.transaction?.currencyCode)}
              emphasis
            />
            <FieldLabel title="Reason" value={dispute.reasonCode?.replace(/_/g, ' ') ?? '—'} />
            <FieldLabel
              title="Opened"
              value={formatDateTime(dispute.openedAt)}
            />
            <FieldLabel
              title="Customer deadline"
              value={formatDateTime(dispute.customerDeadlineAt)}
              emphasis={Boolean(dispute.customerDeadlineAt)}
            />
            <FieldLabel
              title="Provider deadline"
              value={formatDateTime(dispute.providerDeadlineAt)}
              emphasis={Boolean(dispute.providerDeadlineAt)}
            />
            <FieldLabel
              title="Assigned to"
              value={dispute.assignedToId ? `User #${dispute.assignedToId}` : 'Unassigned'}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-soft">
              <div className="flex items-center gap-3">
                <ClockIcon className="h-6 w-6 text-amber-300" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Engagement health</p>
                  <p className="mt-1 text-lg font-semibold">{events.length} touchpoints logged</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-200">
                {latestEvent
                  ? `Last update ${formatRelative(latestEvent.eventAt) ?? formatDateTime(latestEvent.eventAt)}`
                  : 'Waiting for your first update.'}
              </p>
              <ul className="mt-4 grid gap-2 text-xs text-slate-200 sm:grid-cols-2">
                {touches.map((item) => (
                  <li key={item.actor} className="flex items-center gap-2">
                    <UserCircleIcon className="h-4 w-4 text-amber-200" />
                    <span className="uppercase tracking-wide">{item.actor}</span>
                    <span className="rounded-full bg-amber-300/20 px-2 py-0.5 text-amber-100">{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <BoltIcon className="h-6 w-6 text-blue-500" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Case readiness</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {checklist.filter((item) => item.complete).length}/{checklist.length} checks complete
                  </p>
                </div>
              </div>
              <ol className="mt-4 space-y-2">
                {checklist.map((item) => (
                  <ChecklistItem key={item.id} complete={item.complete} label={item.label} helper={item.helper} />
                ))}
              </ol>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Decision log</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Key moments</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {decisionLog.length}
              </span>
            </div>
            <ol className="mt-4 space-y-3 text-sm text-slate-600">
              {decisionLog.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-xs uppercase tracking-[0.3em] text-slate-300">
                  No strategic moves recorded yet
                </li>
              ) : (
                decisionLog.map((event) => (
                  <li key={event.id} className="rounded-2xl border border-slate-200 px-4 py-3 shadow-soft">
                    <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <span>{event.actionType.replace(/_/g, ' ')}</span>
                      <span>{formatDateTime(event.eventAt)}</span>
                    </div>
                    {event.notes ? <p className="mt-2 text-sm text-slate-700">{event.notes}</p> : null}
                  </li>
                ))
              )}
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <PaperClipIcon className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Log an action</p>
                <p className="text-sm text-slate-600">Capture updates, adjust SLAs, and attach mediation notes.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <OptionSelect
                label="Action type"
                value={form.actionType}
                onChange={handleSelectChange('actionType')}
                options={availableActions}
              />
              <OptionSelect
                label="Stage"
                value={form.stage}
                onChange={handleSelectChange('stage')}
                options={availableStages}
              />
              <OptionSelect
                label="Status"
                value={form.status}
                onChange={handleSelectChange('status')}
                options={availableStatuses}
              />
              <OptionSelect
                label="Resolution"
                value={form.transactionResolution}
                onChange={handleSelectChange('transactionResolution')}
                options={resolutionOptions}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
                <span>Customer deadline</span>
                <input
                  type="datetime-local"
                  value={form.customerDeadlineAt}
                  onChange={handleInputChange('customerDeadlineAt')}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
                <span>Provider deadline</span>
                <input
                  type="datetime-local"
                  value={form.providerDeadlineAt}
                  onChange={handleInputChange('providerDeadlineAt')}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>Notes</span>
              <textarea
                value={form.notes}
                onChange={handleInputChange('notes')}
                rows={4}
                placeholder="Summarise decisions, commitments, or required evidence."
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>Resolution notes</span>
              <textarea
                value={form.resolutionNotes}
                onChange={handleInputChange('resolutionNotes')}
                rows={3}
                placeholder="Provide closure rationale or customer-facing summary."
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-600">
              <span>Attach evidence</span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.heic,.doc,.docx"
                onChange={handleInputChange('file')}
                className="w-full rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              {form.file ? (
                <span className="text-xs text-slate-500">{form.file.name}</span>
              ) : null}
            </label>

            {formError ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
                {formError.message}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Files are encrypted in transit. Attachments sync to the trust desk audit trail.
              </div>
              <button
                type="submit"
                disabled={submitting || busy}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-soft transition ${
                  submitting || busy
                    ? 'bg-slate-300'
                    : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'
                }`}
              >
                <DocumentArrowDownIcon className={`h-4 w-4 ${submitting ? 'animate-pulse' : ''}`} />
                Log update
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

CaseDetailView.propTypes = {
  detail: PropTypes.shape({
    dispute: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      summary: PropTypes.string,
      stage: PropTypes.string,
      status: PropTypes.string,
      priority: PropTypes.string,
      transaction: PropTypes.shape({
        amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        currencyCode: PropTypes.string,
      }),
      reasonCode: PropTypes.string,
      openedAt: PropTypes.string,
      customerDeadlineAt: PropTypes.string,
      providerDeadlineAt: PropTypes.string,
      assignedToId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      resolutionNotes: PropTypes.string,
      updatedAt: PropTypes.string,
    }),
    events: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        actionType: PropTypes.string,
        eventAt: PropTypes.string,
        notes: PropTypes.string,
        actorType: PropTypes.string,
      }),
    ),
    availableStages: PropTypes.array,
    availableStatuses: PropTypes.array,
    availableActionTypes: PropTypes.array,
    resolutionOptions: PropTypes.array,
  }),
  loading: PropTypes.bool,
  error: PropTypes.instanceOf(Error),
  busy: PropTypes.bool,
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
};

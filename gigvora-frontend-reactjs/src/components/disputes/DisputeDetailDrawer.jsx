import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  DocumentArrowDownIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const STAGE_OPTIONS = ['intake', 'mediation', 'arbitration', 'resolved'];
const STATUS_OPTIONS = ['open', 'awaiting_customer', 'under_review', 'settled', 'closed'];
const PRIORITY_OPTIONS = ['urgent', 'high', 'medium', 'low'];

function formatDateInput(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const iso = date.toISOString();
  return iso.slice(0, 16);
}

function humanize(value) {
  if (!value) return '';
  return value.replace(/_/g, ' ');
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64 = result.split(',')[1] ?? result;
        resolve(base64);
      } else {
        reject(new Error('Unsupported file result'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export default function DisputeDetailDrawer({
  dispute,
  open,
  loading,
  onClose,
  onUpdate,
  onAddEvent,
  templates,
}) {
  const [formState, setFormState] = useState({});
  const [eventState, setEventState] = useState({ notes: '', stage: '', status: '', file: null });
  const [saving, setSaving] = useState(false);
  const [addingEvent, setAddingEvent] = useState(false);

  useEffect(() => {
    if (dispute) {
      setFormState({
        assignedToId: dispute.assignedToId ?? '',
        priority: dispute.priority ?? 'medium',
        stage: dispute.stage ?? 'intake',
        status: dispute.status ?? 'open',
        customerDeadlineAt: formatDateInput(dispute.customerDeadlineAt),
        providerDeadlineAt: formatDateInput(dispute.providerDeadlineAt),
        resolutionNotes: dispute.resolutionNotes ?? '',
        reasonCode: dispute.reasonCode ?? '',
        summary: dispute.summary ?? '',
      });
    } else {
      setFormState({});
    }
  }, [dispute]);

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
    if (!dispute) return;
    setSaving(true);
    try {
      await onUpdate?.(dispute.id, {
        ...formState,
        customerDeadlineAt: formState.customerDeadlineAt ? new Date(formState.customerDeadlineAt).toISOString() : null,
        providerDeadlineAt: formState.providerDeadlineAt ? new Date(formState.providerDeadlineAt).toISOString() : null,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEventSubmit = async (event) => {
    event.preventDefault();
    if (!dispute) return;
    setAddingEvent(true);
    try {
      let evidence = null;
      if (eventState.file) {
        const content = await fileToBase64(eventState.file);
        evidence = {
          content,
          fileName: eventState.file.name,
          contentType: eventState.file.type,
        };
      }
      await onAddEvent?.(dispute.id, {
        notes: eventState.notes,
        stage: eventState.stage || undefined,
        status: eventState.status || undefined,
        evidence,
      });
      setEventState({ notes: '', stage: '', status: '', file: null });
    } finally {
      setAddingEvent(false);
    }
  };

  const events = dispute?.events ?? [];
  const transaction = dispute?.transaction ?? {};

  return (
    <div
      className={`fixed inset-0 z-50 flex ${open ? '' : 'pointer-events-none'} transition`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-slate-900/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`ml-auto flex h-full w-full max-w-4xl flex-col overflow-y-auto bg-white shadow-2xl transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center rounded-full border border-slate-200 p-2 text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dispute case</p>
              <h3 className="text-lg font-semibold text-slate-900">#{dispute?.id ?? '—'}</h3>
            </div>
          </div>
          {transaction?.reference ? (
            <Link
              to={`/finance`}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-600"
            >
              View escrow
              <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            </Link>
          ) : null}
        </div>

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
                    <p className="text-sm text-slate-800">{new Date(dispute.openedAt).toLocaleString()}</p>
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

              <section className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Update dispute</h4>
                  <select
                    onChange={handleTemplateApply}
                    defaultValue=""
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                  >
                    <option value="">Apply template</option>
                    {(templates ?? []).map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
                <form className="mt-4 space-y-4" onSubmit={handleUpdate}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-700">Stage</span>
                      <select
                        name="stage"
                        value={formState.stage ?? 'intake'}
                        onChange={handleFieldChange}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        {STAGE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {humanize(option)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-700">Status</span>
                      <select
                        name="status"
                        value={formState.status ?? 'open'}
                        onChange={handleFieldChange}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {humanize(option)}
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
                        value={formState.priority ?? 'medium'}
                        onChange={handleFieldChange}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        {PRIORITY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {humanize(option)}
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
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                    <label className="space-y-1 text-sm text-slate-600">
                      <span className="font-medium text-slate-700">Provider deadline</span>
                      <input
                        type="datetime-local"
                        name="providerDeadlineAt"
                        value={formState.providerDeadlineAt ?? ''}
                        onChange={handleFieldChange}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-600">
                    <span className="font-medium text-slate-700">Summary</span>
                    <textarea
                      name="summary"
                      value={formState.summary ?? ''}
                      onChange={handleFieldChange}
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? 'Saving…' : 'Save updates'}
                    </button>
                  </div>
                </form>
              </section>

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
                          <span>{new Date(eventItem.eventAt).toLocaleString()}</span>
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
                <form className="mt-4 space-y-3" onSubmit={handleEventSubmit}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add update</p>
                  <textarea
                    value={eventState.notes}
                    onChange={(event) => setEventState((current) => ({ ...current, notes: event.target.value }))}
                    rows={3}
                    placeholder="Provide an update, summary of outreach, or next steps."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <select
                      value={eventState.stage}
                      onChange={(event) => setEventState((current) => ({ ...current, stage: event.target.value }))}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">Keep stage</option>
                      {STAGE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {humanize(option)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={eventState.status}
                      onChange={(event) => setEventState((current) => ({ ...current, status: event.target.value }))}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">Keep status</option>
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {humanize(option)}
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
                      />
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={addingEvent}
                      className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {addingEvent ? 'Logging…' : 'Log update'}
                    </button>
                  </div>
                </form>
              </section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  PaperClipIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  ShieldCheckIcon,
  ChevronDoubleUpIcon,
} from '@heroicons/react/24/outline';
import classNames from '../../utils/classNames.js';
import { readFileAsBase64, humanFileSize } from '../../utils/file.js';
import { formatRelativeTime, formatAbsolute } from '../../utils/date.js';

function humanize(value) {
  if (!value) return '';
  return value
    .toString()
    .replace(/[_-]+/g, ' ')
    .replace(/(^|\s)([a-z])/g, (match, boundary, letter) => `${boundary}${letter.toUpperCase()}`)
    .trim();
}

function formatCurrency(amount, currency = 'USD') {
  if (amount == null) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch (error) {
    return `${currency} ${amount}`;
  }
}

const ALLOWED_STATUS_VALUES = new Set(['open', 'awaiting_customer', 'under_review', 'settled']);

export default function DisputeDetailDrawer({ open, inline = false, dispute, metadata, busy, onClose, onSubmit }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState({
    notes: '',
    actionType: 'comment',
    stage: dispute?.stage ?? '',
    status: dispute?.status ?? '',
    customerDeadlineAt: dispute?.customerDeadlineAt ?? '',
    providerDeadlineAt: dispute?.providerDeadlineAt ?? '',
    resolutionNotes: '',
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && dispute) {
      setForm({
        notes: '',
        actionType: 'comment',
        stage: dispute.stage ?? '',
        status: dispute.status ?? '',
        customerDeadlineAt: dispute.customerDeadlineAt ?? '',
        providerDeadlineAt: dispute.providerDeadlineAt ?? '',
        resolutionNotes: '',
      });
      setSelectedFile(null);
      setError(null);
    }
  }, [open, dispute]);

  const stages = useMemo(() => metadata?.stages ?? [], [metadata]);
  const statuses = useMemo(
    () => (metadata?.statuses ?? []).filter((option) => ALLOWED_STATUS_VALUES.has(option.value ?? option)),
    [metadata],
  );
  const actionTypes = useMemo(() => metadata?.actionTypes ?? [], [metadata]);

  const events = useMemo(() => dispute?.events ?? [], [dispute]);
  const attachments = useMemo(() => dispute?.attachments ?? [], [dispute]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.notes.trim() && !selectedFile) {
      setError('Add a note or upload evidence before submitting.');
      return;
    }
    setError(null);
    try {
      let evidence = null;
      if (selectedFile) {
        const content = await readFileAsBase64(selectedFile);
        evidence = {
          content,
          fileName: selectedFile.name,
          contentType: selectedFile.type || 'application/octet-stream',
        };
      }
      await onSubmit({
        notes: form.notes.trim(),
        actionType: form.actionType || 'comment',
        stage: form.stage || undefined,
        status: form.status || undefined,
        customerDeadlineAt: form.customerDeadlineAt || undefined,
        providerDeadlineAt: form.providerDeadlineAt || undefined,
        resolutionNotes: form.resolutionNotes || undefined,
        evidence,
      });
      setForm((previous) => ({ ...previous, notes: '', resolutionNotes: '' }));
      setSelectedFile(null);
    } catch (submissionError) {
      setError(submissionError.message || 'Failed to update dispute.');
    }
  };

  if (!dispute) {
    return null;
  }

  const disputeStatusTone = useMemo(() => {
    const status = dispute?.status;
    if (!status) return 'bg-slate-100 text-slate-600';
    if (status === 'awaiting_customer') return 'bg-amber-100 text-amber-700';
    if (status === 'settled') return 'bg-emerald-100 text-emerald-700';
    if (status === 'closed') return 'bg-slate-100 text-slate-600';
    return 'bg-blue-100 text-blue-700';
  }, [dispute]);

  const TitleElement = inline ? 'h2' : Dialog.Title;

  const panelContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between border-b border-slate-200 p-6">
        <div>
          <TitleElement className="text-xl font-semibold text-slate-900">
            Dispute #{dispute?.id ?? '—'}
          </TitleElement>
          <p className="mt-1 text-sm text-slate-600">
            Stage {humanize(dispute?.stage)} · Status{' '}
            <span className={classNames('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', disputeStatusTone)}>
              {humanize(dispute?.status)}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close"
          disabled={busy}
        >
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:col-span-2">
            <h3 className="text-sm font-semibold text-slate-700">Transaction</h3>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {dispute?.transaction?.displayName ?? `Escrow ${dispute?.transaction?.reference ?? '—'}`}
            </p>
            <dl className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <div>
                <dt className="font-medium text-slate-500">Amount</dt>
                <dd>{formatCurrency(dispute?.transaction?.amount, dispute?.transaction?.currencyCode)}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Reference</dt>
                <dd>{dispute?.transaction?.reference ?? '—'}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Opened</dt>
                <dd>{formatAbsolute(dispute?.openedAt)}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Last update</dt>
                <dd>{formatRelativeTime(dispute?.updatedAt)}</dd>
              </div>
            </dl>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-700">Metrics</h3>
            <ul className="mt-3 space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                <span>{dispute?.metrics?.daysOpen ?? 0} days open</span>
              </li>
              <li className="flex items-center gap-2">
                <ChatBubbleLeftIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                <span>{dispute?.metrics?.eventCount ?? 0} timeline entries</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                <span>{dispute?.metrics?.attachmentCount ?? 0} evidence files</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <section>
            <h3 className="text-sm font-semibold text-slate-700">Summary</h3>
            <p className="mt-2 whitespace-pre-line rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
              {dispute?.summary ?? 'No summary captured.'}
            </p>
          </section>

          {attachments.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-700">Evidence</h3>
              <ul className="mt-2 divide-y divide-slate-200 overflow-hidden rounded-3xl border border-slate-200">
                {attachments.map((attachment) => (
                  <li key={attachment.id} className="flex items-center justify-between gap-4 bg-white px-4 py-3 text-sm text-slate-700">
                    <div className="flex items-center gap-3">
                      <PaperClipIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                      <div>
                        <p className="font-medium text-slate-800">{attachment.fileName}</p>
                        <p className="text-xs text-slate-500">
                          Uploaded {formatRelativeTime(attachment.uploadedAt)} · {attachment.contentType}
                        </p>
                      </div>
                    </div>
                    {attachment.url && (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-accent hover:text-accent"
                      >
                        View
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h3 className="text-sm font-semibold text-slate-700">Timeline</h3>
            <ol className="mt-3 space-y-4">
              {events.map((event) => (
                <li key={event.id} className="relative rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="absolute -left-2 top-4 h-4 w-4 rounded-full border-2 border-white bg-accent" aria-hidden="true" />
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{humanize(event.actionType)}</span>
                    <span>{formatAbsolute(event.eventAt)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{event.notes || 'No notes provided.'}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {event.actor && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                        <ChevronDoubleUpIcon className="h-3 w-3" aria-hidden="true" />
                        {event.actor.firstName ? `${event.actor.firstName} ${event.actor.lastName ?? ''}`.trim() : `Actor ${event.actor.id}`}
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">{humanize(event.actorType)}</span>
                    {event.evidenceFileName && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">Evidence attached</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Stage
              <select
                name="stage"
                value={form.stage}
                onChange={handleChange}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                disabled={busy}
              >
                <option value="">No change</option>
                {stages.map((option) => (
                  <option key={option.value ?? option} value={option.value ?? option}>
                    {humanize(option.label ?? option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Status
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                disabled={busy}
              >
                <option value="">No change</option>
                {statuses.map((option) => (
                  <option key={option.value ?? option} value={option.value ?? option}>
                    {humanize(option.label ?? option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Action type
              <select
                name="actionType"
                value={form.actionType}
                onChange={handleChange}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                disabled={busy}
              >
                {actionTypes.map((option) => (
                  <option key={option.value ?? option} value={option.value ?? option}>
                    {humanize(option.label ?? option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Your deadline
              <input
                type="datetime-local"
                name="customerDeadlineAt"
                value={form.customerDeadlineAt ?? ''}
                onChange={handleChange}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                disabled={busy}
              />
            </label>
            <label className="flex flex-col text-sm font-medium text-slate-700">
              Partner deadline
              <input
                type="datetime-local"
                name="providerDeadlineAt"
                value={form.providerDeadlineAt ?? ''}
                onChange={handleChange}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                disabled={busy}
              />
            </label>
          </div>

          <label className="flex flex-col text-sm font-medium text-slate-700">
            Notes
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Share updates or clarifications."
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              disabled={busy}
            />
          </label>

          <label className="flex flex-col text-sm font-medium text-slate-700">
            Resolution notes
            <textarea
              name="resolutionNotes"
              value={form.resolutionNotes}
              onChange={handleChange}
              rows={2}
              placeholder="Capture agreed outcomes."
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              disabled={busy}
            />
          </label>

          <div className="rounded-3xl border border-dashed border-slate-300 p-4">
            <p className="text-sm font-medium text-slate-700">Attach new evidence</p>
            <div className="mt-3 flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
                <PaperClipIcon className="h-4 w-4" aria-hidden="true" />
                <span>Upload evidence</span>
                <input type="file" className="hidden" onChange={handleFileChange} disabled={busy} />
              </label>
              {selectedFile && <span className="text-xs text-slate-600">{selectedFile.name} · {humanFileSize(selectedFile.size)}</span>}
            </div>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              disabled={busy}
            >
              Close
            </button>
            <button
              type="submit"
              className={classNames(
                'rounded-2xl px-5 py-2 text-sm font-semibold text-white shadow-sm transition',
                form.notes.trim() || selectedFile
                  ? 'bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-accent/40'
                  : 'bg-slate-400 cursor-not-allowed',
              )}
              disabled={busy || (!form.notes.trim() && !selectedFile)}
            >
              {busy ? 'Saving…' : 'Submit update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (inline) {
    return <div className="flex h-full flex-col">{panelContent}</div>;
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={busy ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-200"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-3xl bg-white shadow-2xl">
                  {panelContent}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

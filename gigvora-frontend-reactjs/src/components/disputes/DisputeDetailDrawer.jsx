import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  DocumentArrowDownIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';

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
  return date.toISOString().slice(0, 16);
}

function humanize(value) {
  if (!value) {
    return '';
  }
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
              to="/finance"
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
                        onChange={(event) => setEventState((current) => ({ ...current, file: event.target.files?.[0] ?? null }))}
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
}

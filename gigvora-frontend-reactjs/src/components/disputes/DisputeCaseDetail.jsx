import { useEffect, useMemo, useState } from 'react';
import {
  DISPUTE_ACTION_OPTIONS,
  DISPUTE_PRIORITY_OPTIONS,
  DISPUTE_STAGE_OPTIONS,
  DISPUTE_STATUS_OPTIONS,
  DISPUTE_TRANSACTION_RESOLUTIONS,
} from '../../constants/disputes.js';

const MAX_EVIDENCE_BYTES = 8 * 1024 * 1024; // 8MB
const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'update', label: 'Update' },
  { id: 'timeline', label: 'Timeline' },
];

function toDateTimeLocal(value) {
  if (!value) {
    return '';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (input) => String(input).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

function formatStage(value) {
  if (!value) {
    return '—';
  }
  return value.replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function buildDraft(dispute) {
  return {
    stage: dispute?.stage ?? 'intake',
    status: dispute?.status ?? 'open',
    priority: dispute?.priority ?? 'medium',
    assignedToId: dispute?.assignedToId ?? '',
    reasonCode: dispute?.reasonCode ?? '',
    summary: dispute?.summary ?? '',
    customerDeadlineAt: toDateTimeLocal(dispute?.customerDeadlineAt),
    providerDeadlineAt: toDateTimeLocal(dispute?.providerDeadlineAt),
    resolutionNotes: dispute?.resolutionNotes ?? '',
  };
}

async function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read evidence file'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Unexpected file reader result'));
        return;
      }
      const parts = result.split('base64,');
      resolve(parts.length > 1 ? parts[1] : parts[0]);
    };
    reader.readAsDataURL(file);
  });
}

export default function DisputeCaseDetail({
  dispute,
  updating,
  onUpdate,
  onAddEvent,
  addingEvent,
  onRefresh,
  onExpand,
  variant = 'panel',
  onClose,
}) {
  const [draft, setDraft] = useState(() => buildDraft(dispute));
  const [metadataDraft, setMetadataDraft] = useState(() => JSON.stringify(dispute?.metadata ?? {}, null, 2));
  const [updateError, setUpdateError] = useState(null);
  const [eventError, setEventError] = useState(null);
  const [eventState, setEventState] = useState({
    actionType: 'comment',
    notes: '',
    stage: '',
    status: '',
    transactionResolution: 'none',
    file: null,
  });
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    setDraft(buildDraft(dispute));
    setMetadataDraft(JSON.stringify(dispute?.metadata ?? {}, null, 2));
    setUpdateError(null);
    setEventError(null);
    setEventState({ actionType: 'comment', notes: '', stage: '', status: '', transactionResolution: 'none', file: null });
    setActiveTab('summary');
  }, [dispute?.id]);

  const events = useMemo(() => {
    const list = Array.isArray(dispute?.events) ? [...dispute.events] : [];
    return list.sort((a, b) => new Date(a.eventAt || a.createdAt || 0) - new Date(b.eventAt || b.createdAt || 0));
  }, [dispute?.events]);

  const handleDraftChange = (field) => (event) => {
    const value = event?.target?.value ?? '';
    setDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleMetadataChange = (event) => {
    setMetadataDraft(event?.target?.value ?? '');
  };

  const handleUpdateSubmit = async (event) => {
    event.preventDefault();
    setUpdateError(null);

    let metadata = null;
    if (metadataDraft.trim()) {
      try {
        metadata = JSON.parse(metadataDraft);
      } catch (parseError) {
        setUpdateError('Metadata must be valid JSON.');
        return;
      }
    }

    const payload = {
      stage: draft.stage,
      status: draft.status,
      priority: draft.priority,
      assignedToId: draft.assignedToId ? Number.parseInt(draft.assignedToId, 10) : null,
      reasonCode: draft.reasonCode,
      summary: draft.summary,
      customerDeadlineAt: draft.customerDeadlineAt ? new Date(draft.customerDeadlineAt).toISOString() : null,
      providerDeadlineAt: draft.providerDeadlineAt ? new Date(draft.providerDeadlineAt).toISOString() : null,
      resolutionNotes: draft.resolutionNotes,
      metadata,
    };

    try {
      await onUpdate?.(payload);
    } catch (error) {
      setUpdateError(error?.message ?? 'Unable to update dispute case.');
    }
  };

  const handleEventFieldChange = (field) => (event) => {
    const value = field === 'file' ? event?.target?.files?.[0] ?? null : event?.target?.value ?? '';
    setEventState((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleEventSubmit = async (event) => {
    event.preventDefault();
    setEventError(null);

    const payload = {
      actionType: eventState.actionType,
      notes: eventState.notes.trim(),
      actorType: 'mediator',
    };

    if (eventState.stage) {
      payload.stage = eventState.stage;
    }
    if (eventState.status) {
      payload.status = eventState.status;
    }
    if (eventState.transactionResolution && eventState.transactionResolution !== 'none') {
      payload.transactionResolution = eventState.transactionResolution;
    }

    if (eventState.file) {
      if (eventState.file.size > MAX_EVIDENCE_BYTES) {
        setEventError('Evidence must be under 8MB.');
        return;
      }
      try {
        const base64 = await readFileAsBase64(eventState.file);
        payload.evidence = {
          fileName: eventState.file.name,
          contentType: eventState.file.type,
          content: base64,
        };
      } catch (fileError) {
        setEventError(fileError?.message ?? 'Unable to process evidence file.');
        return;
      }
    }

    try {
      await onAddEvent?.(payload);
      setEventState({ actionType: 'comment', notes: '', stage: '', status: '', transactionResolution: 'none', file: null });
    } catch (error) {
      setEventError(error?.message ?? 'Unable to append event.');
    }
  };

  if (!dispute) {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-soft">
        Select a case to review details and actions.
      </section>
    );
  }

  const transaction = dispute.transaction;
  const openedBy = dispute.openedBy?.name ?? `User #${dispute.openedById ?? '—'}`;
  const assignedTo = dispute.assignedTo?.name ?? (dispute.assignedToId ? `User #${dispute.assignedToId}` : 'Unassigned');

  const panelClass =
    variant === 'modal'
      ? 'rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl'
      : 'rounded-3xl border border-slate-200 bg-white p-6 shadow-soft';

  return (
    <section id="agency-dispute-detail" className="space-y-6">
      <div className={`${panelClass} space-y-6`}> 
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Case #{dispute.id}</h2>
            <p className="text-sm text-slate-500">Opened by {openedBy} • {formatDateTime(dispute.openedAt)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onExpand && variant === 'panel' ? (
              <button
                type="button"
                onClick={onExpand}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
              >
                Expand
              </button>
            ) : null}
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
            >
              Refresh
            </button>
            {variant === 'modal' && onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
              >
                Close
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-full bg-slate-100 p-1 text-sm font-semibold text-slate-600">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-1 transition ${
                  isActive ? 'bg-white text-slate-900 shadow-sm' : 'hover:bg-white/70'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'summary' ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 text-sm text-slate-600">
              <dl className="space-y-2">
                <div>
                  <dt className="font-semibold text-slate-800">Stage</dt>
                  <dd>{formatStage(dispute.stage)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-800">Status</dt>
                  <dd>{formatStage(dispute.status)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-800">Priority</dt>
                  <dd>{formatStage(dispute.priority)}</dd>
                </div>
              </dl>
              <dl className="space-y-2">
                <div>
                  <dt className="font-semibold text-slate-800">Assignee</dt>
                  <dd>{assignedTo}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-800">Customer deadline</dt>
                  <dd>{dispute.customerDeadlineAt ? formatDateTime(dispute.customerDeadlineAt) : '—'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-800">Provider deadline</dt>
                  <dd>{dispute.providerDeadlineAt ? formatDateTime(dispute.providerDeadlineAt) : '—'}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Summary</p>
              <p className="mt-2 whitespace-pre-wrap">{dispute.summary || 'No summary provided yet.'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-800">Escrow</h3>
              {transaction ? (
                <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-slate-800">Reference:</span> {transaction.reference ?? '—'}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">Amount:</span> {transaction.amount} {transaction.currencyCode}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">Status:</span> {formatStage(transaction.status)}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">Initiator:</span>{' '}
                    {transaction.initiator?.name ?? `User #${transaction.initiatedById ?? '—'}`}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">Counterparty:</span>{' '}
                    {transaction.counterparty?.name ?? (transaction.counterpartyId ? `User #${transaction.counterpartyId}` : '—')}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">Scheduled release:</span>{' '}
                    {transaction.scheduledReleaseAt ? formatDateTime(transaction.scheduledReleaseAt) : '—'}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Linked transaction details are unavailable.</p>
              )}
            </div>
          </div>
        ) : null}

        {activeTab === 'update' ? (
          <form className="space-y-5" onSubmit={handleUpdateSubmit}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Update case</h3>
              <button
                type="submit"
                className="rounded-full border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={updating}
              >
                {updating ? 'Saving…' : 'Save changes'}
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Stage
                  <select
                    value={draft.stage}
                    onChange={handleDraftChange('stage')}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {DISPUTE_STAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Status
                  <select
                    value={draft.status}
                    onChange={handleDraftChange('status')}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {DISPUTE_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Priority
                  <select
                    value={draft.priority}
                    onChange={handleDraftChange('priority')}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {DISPUTE_PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Assignee ID
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={draft.assignedToId}
                    onChange={handleDraftChange('assignedToId')}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Summary
                  <textarea
                    value={draft.summary}
                    onChange={handleDraftChange('summary')}
                    rows={4}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Reason code
                  <input
                    type="text"
                    value={draft.reasonCode}
                    onChange={handleDraftChange('reasonCode')}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    Customer deadline
                    <input
                      type="datetime-local"
                      value={draft.customerDeadlineAt}
                      onChange={handleDraftChange('customerDeadlineAt')}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-slate-700">
                    Provider deadline
                    <input
                      type="datetime-local"
                      value={draft.providerDeadlineAt}
                      onChange={handleDraftChange('providerDeadlineAt')}
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                </div>
                <label className="block text-sm font-semibold text-slate-700">
                  Resolution notes
                  <textarea
                    value={draft.resolutionNotes}
                    onChange={handleDraftChange('resolutionNotes')}
                    rows={3}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>
            </div>
            <label className="block text-sm font-semibold text-slate-700">
              Metadata (JSON)
              <textarea
                value={metadataDraft}
                onChange={handleMetadataChange}
                rows={4}
                className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
            {updateError ? <p className="text-sm font-semibold text-rose-600">{updateError}</p> : null}
          </form>
        ) : null}

        {activeTab === 'timeline' ? (
          <div className="space-y-6">
            <form className="space-y-4" onSubmit={handleEventSubmit}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Log event</h3>
                <button
                  type="submit"
                  className="rounded-full border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={addingEvent}
                >
                  {addingEvent ? 'Logging…' : 'Save event'}
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Action
                  <select
                    value={eventState.actionType}
                    onChange={handleEventFieldChange('actionType')}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {DISPUTE_ACTION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Stage update
                  <select
                    value={eventState.stage}
                    onChange={handleEventFieldChange('stage')}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">No change</option>
                    {DISPUTE_STAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Status update
                  <select
                    value={eventState.status}
                    onChange={handleEventFieldChange('status')}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">No change</option>
                    {DISPUTE_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Fund movement
                  <select
                    value={eventState.transactionResolution}
                    onChange={handleEventFieldChange('transactionResolution')}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    {DISPUTE_TRANSACTION_RESOLUTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block text-sm font-semibold text-slate-700">
                Notes
                <textarea
                  value={eventState.notes}
                  onChange={handleEventFieldChange('notes')}
                  rows={4}
                  className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Add case notes"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Evidence
                <input
                  type="file"
                  onChange={handleEventFieldChange('file')}
                  className="mt-1 block w-full text-sm text-slate-600"
                  accept="image/*,application/pdf,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/json,text/plain"
                />
                <span className="mt-1 block text-xs text-slate-500">Max 8MB.</span>
              </label>
              {eventError ? <p className="text-sm font-semibold text-rose-600">{eventError}</p> : null}
            </form>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900">Timeline</h3>
              {events.length === 0 ? (
                <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  No events recorded yet.
                </p>
              ) : (
                <ol className="space-y-3">
                  {events.map((event) => (
                    <li key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                        <span className="font-semibold text-slate-800">{formatStage(event.actionType)}</span>
                        <span>{formatDateTime(event.eventAt ?? event.createdAt)}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{event.notes || 'No notes provided.'}</p>
                      <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                        <p>
                          <span className="font-semibold text-slate-700">Actor:</span>{' '}
                          {event.actor?.name || `User #${event.actorId ?? '—'}`} ({formatStage(event.actorType)})
                        </p>
                        <p>
                          <span className="font-semibold text-slate-700">Status:</span>{' '}
                          {event.status ? formatStage(event.status) : '—'}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-700">Stage:</span>{' '}
                          {event.stage ? formatStage(event.stage) : '—'}
                        </p>
                        {event.transactionResolution ? (
                          <p>
                            <span className="font-semibold text-slate-700">Funds:</span>{' '}
                            {formatStage(event.transactionResolution)}
                          </p>
                        ) : null}
                        {event.evidenceUrl ? (
                          <p>
                            <span className="font-semibold text-slate-700">Evidence:</span>{' '}
                            <a href={event.evidenceUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800">
                              {event.evidenceFileName ?? 'Download'}
                            </a>
                          </p>
                        ) : null}
                      </div>
                      {event.evidenceUrl && event.evidenceContentType?.startsWith('image/') ? (
                        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
                          <img src={event.evidenceUrl} alt={event.evidenceFileName ?? 'Uploaded evidence'} className="h-auto w-full" />
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

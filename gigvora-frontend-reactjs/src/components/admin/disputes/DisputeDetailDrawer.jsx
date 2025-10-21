import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  ArrowDownCircleIcon,
  ArrowDownTrayIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';
import DisputeEventComposer from './DisputeEventComposer.jsx';

const STAGE_OPTIONS = [
  { value: 'intake', label: 'Intake' },
  { value: 'mediation', label: 'Mediation' },
  { value: 'arbitration', label: 'Arbitration' },
  { value: 'resolved', label: 'Resolved' },
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'awaiting_customer', label: 'Awaiting customer' },
  { value: 'under_review', label: 'Under review' },
  { value: 'settled', label: 'Settled' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

function humanize(value) {
  if (!value) {
    return '—';
  }
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount, currencyCode = 'USD') {
  if (!Number.isFinite(Number(amount))) {
    return '—';
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: Number(amount) >= 1000 ? 0 : 2,
  }).format(Number(amount));
}

function formatDurationHours(hours) {
  if (!Number.isFinite(Number(hours))) {
    return '—';
  }
  const value = Number(hours);
  if (value < 24) {
    return `${value.toFixed(1)} hrs`;
  }
  return `${(value / 24).toFixed(1)} days`;
}

function toDateTimeInput(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 16);
}

export default function DisputeDetailDrawer({
  open,
  dispute,
  onClose,
  onUpdateCase,
  updateLoading,
  eventLoading,
  onCreateEvent,
  currentUserId,
}) {
  const [formState, setFormState] = useState(null);
  const [metadataText, setMetadataText] = useState('');
  const [formError, setFormError] = useState(null);
  const [timelineStatus, setTimelineStatus] = useState('');

  useEffect(() => {
    if (!dispute) {
      setFormState(null);
      setMetadataText('');
      setFormError(null);
      return;
    }
    setFormState({
      stage: dispute.stage,
      status: dispute.status,
      priority: dispute.priority,
      assignedToId: dispute.assignedToId ? String(dispute.assignedToId) : '',
      reasonCode: dispute.reasonCode ?? '',
      summary: dispute.summary ?? '',
      customerDeadlineAt: toDateTimeInput(dispute.customerDeadlineAt),
      providerDeadlineAt: toDateTimeInput(dispute.providerDeadlineAt),
      resolutionNotes: dispute.resolutionNotes ?? '',
    });
    setMetadataText(dispute.metadata ? JSON.stringify(dispute.metadata, null, 2) : '');
    setFormError(null);
  }, [dispute]);

  useEffect(() => {
    if (!timelineStatus) {
      return undefined;
    }
    const timeout = setTimeout(() => setTimelineStatus(''), 2500);
    return () => clearTimeout(timeout);
  }, [timelineStatus]);

  const timeline = useMemo(() => {
    if (!dispute?.events) {
      return [];
    }
    return [...dispute.events].sort((a, b) => new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime());
  }, [dispute]);

  const handleDownloadTimeline = () => {
    if (!timeline.length) {
      setTimelineStatus('No timeline events yet.');
      return;
    }
    try {
      const rows = [];
      const pushRow = (values) => {
        const serialised = values.map((value) => {
          if (value == null) {
            return '""';
          }
          const text = `${value}`.replace(/"/g, '""');
          return `"${text}"`;
        });
        rows.push(serialised.join(','));
      };

      pushRow(['Event', 'Actor', 'Actor type', 'Notes', 'Occurred at']);
      timeline.forEach((event) => {
        pushRow([
          event.actionType || 'update',
          event.actor?.displayName || event.actor?.email || event.actorId || 'System',
          event.actorType || 'system',
          event.notes ? event.notes.replace(/\s+/g, ' ').slice(0, 200) : '',
          event.eventAt ? new Date(event.eventAt).toISOString() : '',
        ]);
      });

      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
      anchor.download = `dispute-${dispute?.id ?? 'timeline'}-${timestamp}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setTimelineStatus('Timeline exported.');
    } catch (err) {
      console.error('Unable to export dispute timeline', err);
      setTimelineStatus('Timeline export failed.');
    }
  };

  if (!open) {
    return null;
  }

  const handleFieldChange = (name, value) => {
    setFormState((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formState) {
      return;
    }
    let parsedMetadata = null;
    if (metadataText.trim()) {
      try {
        parsedMetadata = JSON.parse(metadataText);
      } catch (error) {
        setFormError('Metadata must be valid JSON.');
        return;
      }
    }
    setFormError(null);
    const payload = {
      ...formState,
      customerDeadlineAt: formState.customerDeadlineAt || undefined,
      providerDeadlineAt: formState.providerDeadlineAt || undefined,
      metadata: parsedMetadata,
    };
    if (!payload.assignedToId) {
      payload.assignedToId = 'unassigned';
    }
    onUpdateCase?.(payload);
  };

  const handleTransactionAction = (action) => {
    if (!onUpdateCase || !dispute) {
      return;
    }
    const message =
      action === 'release'
        ? 'Release escrow funds to the provider? This will close the financial portion of the case.'
        : 'Refund escrow funds to the customer? This will close the financial portion of the case.';
    if (!window.confirm(message)) {
      return;
    }
    onUpdateCase({ transactionResolution: action });
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="hidden flex-1 bg-slate-900/40 lg:block" onClick={onClose} aria-hidden="true" />
      <aside className="relative flex w-full max-w-3xl flex-col overflow-y-auto bg-white shadow-2xl lg:w-[960px]">
        <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-5">
          <div>
            <button
              type="button"
              onClick={onClose}
              className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-blue-600"
            >
              <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" /> Back
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold text-slate-900">Dispute #{dispute?.id}</h2>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Stage {humanize(dispute?.stage)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                {humanize(dispute?.status)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                {humanize(dispute?.priority)} priority
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{dispute?.summary}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTimeline}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
              >
                <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" /> Download timeline
              </button>
              {timelineStatus ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{timelineStatus}</span>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
            aria-label="Close dispute workspace"
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </header>
        <div className="space-y-8 px-6 py-6">
          <section className="grid gap-4 lg:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <ClockIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />
                Time open
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">{formatDurationHours(dispute?.openDurationHours)}</p>
              <p className="text-xs text-slate-500">Opened {formatDateTime(dispute?.openedAt)}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" aria-hidden="true" />
                Deadlines
              </div>
              <p className={`mt-2 text-sm ${dispute?.overdue ? 'text-rose-600' : 'text-slate-600'}`}>
                Customer: {formatDateTime(dispute?.customerDeadlineAt)}
              </p>
              <p className={`text-sm ${dispute?.overdue ? 'text-rose-600' : 'text-slate-600'}`}>
                Provider: {formatDateTime(dispute?.providerDeadlineAt)}
              </p>
              <p className="text-xs text-slate-500">{dispute?.dueSoon ? 'Due soon' : dispute?.overdue ? 'Overdue' : 'On track'}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <ShieldCheckIcon className="h-5 w-5 text-emerald-500" aria-hidden="true" />
                Assignment
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {dispute?.assignedTo?.displayName || dispute?.assignedTo?.email || 'Unassigned mediator'}
              </p>
              <p className="text-xs text-slate-500">Opened by {dispute?.openedBy?.displayName || dispute?.openedBy?.email}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <BanknotesIcon className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                Escrow
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {formatCurrency(dispute?.transaction?.amount, dispute?.transaction?.currencyCode)}
              </p>
              <p className="text-xs text-slate-500">
                Transaction {dispute?.transaction?.reference || '—'} ({humanize(dispute?.transaction?.status)})
              </p>
            </article>
          </section>

          <section>
            <form
              onSubmit={handleSubmit}
              className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900">Case</h3>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="inline-flex items-center gap-2 rounded-full border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                  {updateLoading ? 'Saving…' : 'Save changes'}
                </button>
              </div>
              {formError ? <p className="text-xs text-rose-600">{formError}</p> : null}
              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stage
                  <select
                    value={formState?.stage || ''}
                    onChange={(event) => handleFieldChange('stage', event.target.value)}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {STAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                  <select
                    value={formState?.status || ''}
                    onChange={(event) => handleFieldChange('status', event.target.value)}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Priority
                  <select
                    value={formState?.priority || ''}
                    onChange={(event) => handleFieldChange('priority', event.target.value)}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Assigned mediator (user ID)
                  <input
                    type="text"
                    value={formState?.assignedToId ?? ''}
                    onChange={(event) => handleFieldChange('assignedToId', event.target.value)}
                    placeholder="Leave blank to keep unassigned"
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Customer deadline
                  <input
                    type="datetime-local"
                    value={formState?.customerDeadlineAt ?? ''}
                    onChange={(event) => handleFieldChange('customerDeadlineAt', event.target.value)}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Provider deadline
                  <input
                    type="datetime-local"
                    value={formState?.providerDeadlineAt ?? ''}
                    onChange={(event) => handleFieldChange('providerDeadlineAt', event.target.value)}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </label>
              </div>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reason code
                <input
                  type="text"
                  value={formState?.reasonCode ?? ''}
                  onChange={(event) => handleFieldChange('reasonCode', event.target.value)}
                  className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Summary
                <textarea
                  rows={3}
                  value={formState?.summary ?? ''}
                  onChange={(event) => handleFieldChange('summary', event.target.value)}
                  className="rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Resolution notes
                <textarea
                  rows={3}
                  value={formState?.resolutionNotes ?? ''}
                  onChange={(event) => handleFieldChange('resolutionNotes', event.target.value)}
                  className="rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Metadata (JSON)
                <textarea
                  rows={6}
                  value={metadataText}
                  onChange={(event) => setMetadataText(event.target.value)}
                  placeholder={'{ "channel": "in-app", "region": "EU" }'}
                  className="font-mono rounded-2xl border border-slate-200 px-3 py-3 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
            </form>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Escrow</h3>
                <CheckCircleIcon className="h-5 w-5 text-emerald-500" aria-hidden="true" />
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => handleTransactionAction('release')}
                  className="inline-flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
                >
                  Release to provider
                  <ArrowDownCircleIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => handleTransactionAction('refund')}
                  className="inline-flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                >
                  Refund customer
                  <ArrowDownCircleIcon className="h-5 w-5 rotate-180" aria-hidden="true" />
                </button>
              </div>
            </div>
            <DisputeEventComposer
              dispute={dispute}
              onSubmit={onCreateEvent}
              loading={eventLoading}
              actorType="admin"
              actorId={currentUserId}
            />
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Timeline</h3>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {timeline.length} events
              </span>
            </div>
            <ol className="space-y-4">
              {timeline.length === 0 ? (
                <li className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 text-sm text-slate-500">No events yet.</li>
              ) : (
                timeline.map((event) => (
                  <li key={event.id} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{humanize(event.actionType)}</p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(event.eventAt)} · {event.actor?.displayName || event.actor?.email || humanize(event.actorType)}
                        </p>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {humanize(event.actorType)}
                      </span>
                    </div>
                    {event.notes ? <p className="mt-3 text-sm text-slate-700">{event.notes}</p> : null}
                    {event.evidenceUrl ? (
                      <a
                        href={event.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-blue-700 hover:border-blue-300 hover:text-blue-600"
                      >
                        <PaperClipIcon className="h-4 w-4" aria-hidden="true" />
                        {event.evidenceFileName || 'Evidence file'}
                      </a>
                    ) : null}
                  </li>
                ))
              )}
            </ol>
          </section>
        </div>
      </aside>
    </div>
  );
}

DisputeDetailDrawer.propTypes = {
  open: PropTypes.bool,
  dispute: PropTypes.object,
  onClose: PropTypes.func,
  onUpdateCase: PropTypes.func,
  updateLoading: PropTypes.bool,
  eventLoading: PropTypes.bool,
  onCreateEvent: PropTypes.func,
  currentUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

DisputeDetailDrawer.defaultProps = {
  open: false,
  dispute: null,
  onClose: undefined,
  onUpdateCase: undefined,
  updateLoading: false,
  eventLoading: false,
  onCreateEvent: undefined,
  currentUserId: null,
};

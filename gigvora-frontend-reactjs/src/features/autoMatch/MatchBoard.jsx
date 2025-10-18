import { useMemo, useState } from 'react';
import DataStatus from '../../components/DataStatus.jsx';
import UserAvatar from '../../components/UserAvatar.jsx';
import { formatRelativeTime } from '../../utils/date.js';

const ACTIVE_STATUSES = new Set(['pending', 'notified']);
const REASON_OPTIONS = [
  { value: 'capacity', label: 'Capacity' },
  { value: 'skill', label: 'Skills' },
  { value: 'budget', label: 'Budget' },
  { value: 'timeline', label: 'Timing' },
  { value: 'other', label: 'Other' },
];

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  notified: 'bg-blue-50 text-blue-700 border-blue-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  declined: 'bg-rose-50 text-rose-600 border-rose-200',
  expired: 'bg-slate-50 text-slate-500 border-slate-200',
  reassigned: 'bg-violet-50 text-violet-600 border-violet-200',
};

const STATUS_LABELS = {
  pending: 'Pending',
  notified: 'Notified',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
  reassigned: 'Reassigned',
};

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toFixed(0)}`;
  }
}

function normalizeStatus(value) {
  if (!value) return '';
  return String(value).toLowerCase();
}

function MatchCard({ entry, onOpen }) {
  const status = normalizeStatus(entry.status);
  const badgeTone = STATUS_STYLES[status] ?? 'bg-slate-50 text-slate-600 border-slate-200';
  const statusLabel = STATUS_LABELS[status] ?? status;

  return (
    <button
      type="button"
      onClick={() => onOpen(entry)}
      className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-5 text-left transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">{entry.projectName ?? `Project ${entry.targetId}`}</h3>
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeTone}`}>
          {statusLabel}
        </span>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-600">
        {entry.client ? (
          <UserAvatar
            name={entry.client.name ?? entry.client.company ?? 'Client'}
            size="sm"
            className="shadow-sm"
          />
        ) : null}
        <span>{formatCurrency(entry.proposedRate ?? entry.budget?.amount, entry.budget?.currency ?? 'USD')}</span>
        <span className="text-slate-400">•</span>
        <span>Score {entry.score != null ? Number(entry.score).toFixed(1) : '—'}</span>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Updated {formatRelativeTime(entry.updatedAt ?? entry.createdAt)}</span>
        <span>{entry.priorityBucket ? `Priority ${entry.priorityBucket}` : ''}</span>
      </div>
    </button>
  );
}

function MatchDetailDrawer({ open, entry, onClose, onRespond, submitting, error }) {
  const status = normalizeStatus(entry?.status);
  const [note, setNote] = useState('');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('capacity');
  const [declineNote, setDeclineNote] = useState('');

  const resetState = () => {
    setNote('');
    setValue('');
    setReason('capacity');
    setDeclineNote('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!open || !entry) {
    return null;
  }

  const canRespond = ACTIVE_STATUSES.has(status);

  const handleAccept = async (event) => {
    event.preventDefault();
    if (!canRespond) return;
    await onRespond({
      status: 'accepted',
      completionValue: value ? Number(value) : undefined,
      responseNotes: note || undefined,
    });
    resetState();
  };

  const handleDecline = async (event) => {
    event.preventDefault();
    if (!canRespond) return;
    await onRespond({
      status: 'declined',
      reasonCode: reason,
      reasonLabel: REASON_OPTIONS.find((option) => option.value === reason)?.label ?? reason,
      responseNotes: declineNote || undefined,
    });
    resetState();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 px-4 py-6 sm:items-center">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Match</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">{entry.projectName ?? `Project ${entry.targetId}`}</h3>
            <p className="mt-1 text-sm text-slate-500">{entry.client?.name ?? entry.client?.company ?? 'Client'}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
            disabled={submitting}
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Rate</p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              {formatCurrency(entry.proposedRate ?? entry.budget?.amount, entry.budget?.currency ?? 'USD')}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Score</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{entry.score != null ? Number(entry.score).toFixed(1) : '—'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Timeline</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{entry.timeline ?? 'Flexible'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Last update</p>
            <p className="mt-2 text-base font-semibold text-slate-900">{formatRelativeTime(entry.updatedAt ?? entry.createdAt)}</p>
          </div>
        </div>

        {canRespond ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <form onSubmit={handleAccept} className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <h4 className="text-sm font-semibold text-emerald-700">Accept</h4>
              <label className="flex flex-col gap-2 text-xs font-semibold text-emerald-700">
                Completion value
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  className="rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-800 focus:border-emerald-400 focus:outline-none"
                  disabled={submitting}
                />
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-emerald-700">
                Note
                <textarea
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="rounded-xl border border-emerald-200 px-3 py-2 text-sm text-emerald-800 focus:border-emerald-400 focus:outline-none"
                  disabled={submitting}
                />
              </label>
              <button
                type="submit"
                className="mt-auto rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Confirm'}
              </button>
            </form>

            <form onSubmit={handleDecline} className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <h4 className="text-sm font-semibold text-rose-700">Decline</h4>
              <label className="flex flex-col gap-2 text-xs font-semibold text-rose-700">
                Reason
                <select
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700 focus:border-rose-400 focus:outline-none"
                  disabled={submitting}
                >
                  {REASON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-xs font-semibold text-rose-700">
                Note
                <textarea
                  rows={3}
                  value={declineNote}
                  onChange={(event) => setDeclineNote(event.target.value)}
                  className="rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700 focus:border-rose-400 focus:outline-none"
                  disabled={submitting}
                />
              </label>
              <button
                type="submit"
                className="mt-auto rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                disabled={submitting}
              >
                {submitting ? 'Saving…' : 'Send'}
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            This match is already resolved.
          </div>
        )}

        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      </div>
    </div>
  );
}

export default function MatchBoard({ entries = [], loading, error, onRefresh, onRespond }) {
  const [filter, setFilter] = useState('active');
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  const normalized = useMemo(() => {
    return entries.map((entry) => ({
      ...entry,
      status: normalizeStatus(entry.status),
    }));
  }, [entries]);

  const filtered = useMemo(() => {
    if (filter === 'active') {
      return normalized.filter((entry) => ACTIVE_STATUSES.has(entry.status));
    }
    if (filter === 'closed') {
      return normalized.filter((entry) => !ACTIVE_STATUSES.has(entry.status));
    }
    return normalized;
  }, [normalized, filter]);

  const handleOpen = (entry) => {
    setActionError(null);
    setSelected(entry);
  };

  const handleClose = () => {
    setSelected(null);
    setActionError(null);
  };

  const handleRespond = async (payload) => {
    if (!selected) return;
    setSubmitting(true);
    setActionError(null);
    try {
      await onRespond?.(selected, payload);
      setSelected(null);
    } catch (responseError) {
      setActionError(responseError?.message ?? 'Unable to update match');
      throw responseError;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Matches</h2>
          <p className="text-sm text-slate-500">Tap a card to decide</p>
        </div>
        <div className="flex items-center gap-2">
          {['active', 'all', 'closed'].map((key) => {
            const isActive = filter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                  isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700'
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((entry) => (
          <MatchCard key={entry.id ?? `${entry.targetId}-${entry.status}`} entry={entry} onOpen={handleOpen} />
        ))}
      </div>

      {!filtered.length && !loading ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          No matches in this view.
        </div>
      ) : null}

      <DataStatus loading={loading} error={error} onRetry={onRefresh} />

      <MatchDetailDrawer
        open={Boolean(selected)}
        entry={selected}
        onClose={handleClose}
        onRespond={handleRespond}
        submitting={submitting}
        error={actionError}
      />
    </section>
  );
}

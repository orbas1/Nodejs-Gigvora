import { useEffect, useMemo, useState } from 'react';
import {
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import SlideOver from './components/SlideOver.jsx';

const REASONS = [
  { value: 'quality_gap', label: 'Quality' },
  { value: 'scope_mismatch', label: 'Scope' },
  { value: 'delay', label: 'Timeline' },
  { value: 'billing', label: 'Billing' },
];

const PRIORITY = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function NewDisputeForm({ transactions, onSubmit, submitting, error }) {
  const eligibleTransactions = useMemo(
    () =>
      transactions.filter((txn) => ['funded', 'in_escrow', 'disputed'].includes((txn?.status ?? '').toString())),
    [transactions],
  );

  const [form, setForm] = useState({
    transactionId: eligibleTransactions[0]?.id ?? '',
    reasonCode: 'quality_gap',
    priority: 'medium',
    summary: '',
  });

  useEffect(() => {
    setForm((previous) => {
      const stillAvailable = eligibleTransactions.some((txn) => txn.id === previous.transactionId);
      if (stillAvailable) {
        return previous;
      }
      return {
        ...previous,
        transactionId: eligibleTransactions[0]?.id ?? '',
      };
    });
  }, [eligibleTransactions]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.transactionId) return;
    try {
      await onSubmit({
        transactionId: Number(form.transactionId),
        reasonCode: form.reasonCode,
        priority: form.priority,
        summary: form.summary.trim(),
      });
      setForm((previous) => ({ ...previous, summary: '' }));
    } catch (error_) {
      // Parent handles error messaging.
    }
  };

  const disabled = submitting || eligibleTransactions.length === 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <label className="flex flex-col text-sm font-medium text-slate-700">
        Transaction
        <select
          value={form.transactionId}
          onChange={(event) => updateField('transactionId', event.target.value)}
          required
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
        >
          {eligibleTransactions.length === 0 ? (
            <option value="" disabled>
              No active transactions eligible
            </option>
          ) : (
            eligibleTransactions.map((txn) => (
              <option key={txn.id} value={txn.id}>
                {txn.reference} · {txn.status}
              </option>
            ))
          )}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Reason
          <select
            value={form.reasonCode}
            onChange={(event) => updateField('reasonCode', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          >
            {REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Priority
          <select
            value={form.priority}
            onChange={(event) => updateField('priority', event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          >
            {PRIORITY.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col text-sm font-medium text-slate-700">
        Notes
        <textarea
          value={form.summary}
          onChange={(event) => updateField('summary', event.target.value)}
          rows={4}
          required
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
        />
      </label>
      {error ? (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={disabled}
          className="rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
      </div>
      {eligibleTransactions.length === 0 ? (
        <p className="text-xs text-slate-500">
          Disputes can only be opened on transactions that are currently funded or held in escrow.
        </p>
      ) : null}
    </form>
  );
}

function DisputeDetail({ dispute, onAddEvent, pending, error }) {
  const [note, setNote] = useState('');
  return (
    <div className="space-y-6 text-sm text-slate-600">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reason</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{dispute.reasonCode?.replace('_', ' ')}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{dispute.priority}</p>
        </div>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</p>
        <p className="mt-2 text-sm text-slate-700">{dispute.summary}</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timeline</p>
        <ul className="mt-3 space-y-3">
          {(dispute.events || []).map((event) => (
            <li key={event.id} className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                <span>{event.actorType}</span>
                <span>{formatDate(event.eventAt)}</span>
              </div>
              <p className="mt-2 text-sm text-slate-700">{event.notes}</p>
            </li>
          ))}
        </ul>
      </div>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (note.trim().length === 0) return;
          try {
            await onAddEvent(note.trim());
            setNote('');
          } catch (error_) {
            // Error surfaced via props.
          }
        }}
        className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4"
      >
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Add note
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          />
        </label>
        {error ? (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={note.trim().length === 0 || pending}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            {pending ? 'Saving…' : 'Log note'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function DisputesPanel({ disputes, transactions, onOpenDispute, onAppendEvent, actionState }) {
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const [createError, setCreateError] = useState(null);
  const [noteError, setNoteError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [notePendingId, setNotePendingId] = useState(null);

  const safeDisputes = useMemo(() => (Array.isArray(disputes) ? disputes.filter(Boolean) : []), [disputes]);
  const safeTransactions = useMemo(
    () => (Array.isArray(transactions) ? transactions.filter(Boolean) : []),
    [transactions],
  );

  const sortedDisputes = useMemo(
    () =>
      [...safeDisputes].sort(
        (a, b) => new Date(b?.openedAt || 0).getTime() - new Date(a?.openedAt || 0).getTime(),
      ),
    [safeDisputes],
  );

  const openDetail = (dispute) => {
    setSelected(dispute);
    setDrawerOpen(true);
    setNoteError(null);
  };

  const handleCreateDispute = async (payload) => {
    setCreateError(null);
    setCreating(true);
    try {
      await onOpenDispute(payload.transactionId, payload);
      setNewOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to open dispute right now.';
      setCreateError(message);
      throw error;
    } finally {
      setCreating(false);
    }
  };

  const handleAppendNote = async (disputeId, note) => {
    setNoteError(null);
    setNotePendingId(disputeId);
    try {
      await onAppendEvent(disputeId, { notes: note });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to record the dispute note.';
      setNoteError(message);
      throw error;
    } finally {
      setNotePendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Disputes</h3>
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
        >
          <PlusIcon className="h-4 w-4" />
          New
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {sortedDisputes.map((dispute) => (
          <button
            key={dispute.id}
            type="button"
            onClick={() => openDetail(dispute)}
            className="flex flex-col items-start gap-3 rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex w-full items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{dispute.transaction?.reference ?? dispute.escrowTransactionId}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{dispute.stage ?? 'open'}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                <ExclamationTriangleIcon className="h-4 w-4" />
                {dispute.priority}
              </span>
            </div>
            <p className="line-clamp-2 text-sm text-slate-600">{dispute.summary}</p>
            <div className="flex w-full items-center justify-between text-xs uppercase tracking-wide text-slate-400">
              <span>{dispute.status}</span>
              <span>{formatDate(dispute.openedAt)}</span>
            </div>
          </button>
        ))}
        {!sortedDisputes.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            No disputes. You are all clear.
          </div>
        ) : null}
      </div>

      <SlideOver
        open={drawerOpen && Boolean(selected)}
        onClose={() => {
          setDrawerOpen(false);
          setSelected(null);
          setNoteError(null);
        }}
        title={selected?.transaction?.reference ?? `Dispute ${selected?.id ?? ''}`}
        description={selected ? `${selected.stage ?? 'open'} · ${selected.status}` : ''}
        wide
      >
        {selected ? (
          <DisputeDetail
            dispute={selected}
            onAddEvent={(note) => handleAppendNote(selected.id, note)}
            pending={notePendingId === selected.id || actionState?.status === 'pending'}
            error={noteError}
          />
        ) : null}
      </SlideOver>

      <SlideOver
        open={newOpen}
        onClose={() => {
          setNewOpen(false);
          setCreateError(null);
        }}
        title="New dispute"
        description="Escalate an issue to the trust desk."
      >
        <NewDisputeForm
          transactions={safeTransactions}
          onSubmit={handleCreateDispute}
          submitting={creating || actionState?.status === 'pending'}
          error={createError}
        />
      </SlideOver>
    </div>
  );
}

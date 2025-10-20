import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { LifebuoyIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const SUPPORT_PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];
const SUPPORT_STATUSES = ['Open', 'Awaiting mentor', 'Awaiting support', 'Resolved'];

const DEFAULT_FORM = {
  subject: '',
  category: 'General',
  priority: 'Normal',
  status: 'Open',
  reference: '',
  notes: '',
};

function formatTimestamp(value) {
  if (!value) {
    return '—';
  }
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch (error) {
    return '—';
  }
}

export default function MentorSupportSection({ tickets, summary, onCreateTicket, onUpdateTicket, onDeleteTicket, saving }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const orderedTickets = useMemo(() => {
    return [...(tickets ?? [])].sort(
      (a, b) => new Date(b.updatedAt ?? b.submittedAt ?? 0).getTime() - new Date(a.updatedAt ?? a.submittedAt ?? 0).getTime(),
    );
  }, [tickets]);

  useEffect(() => {
    if (!editingId) {
      setForm(DEFAULT_FORM);
    }
  }, [editingId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    const payload = {
      subject: form.subject,
      category: form.category,
      priority: form.priority,
      status: form.status,
      reference: form.reference,
      notes: form.notes,
    };
    try {
      if (editingId) {
        await onUpdateTicket?.(editingId, payload);
        setFeedback({ type: 'success', message: 'Support ticket updated.' });
      } else {
        await onCreateTicket?.(payload);
        setFeedback({ type: 'success', message: 'Support ticket created.' });
      }
      setEditingId(null);
      setForm(DEFAULT_FORM);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to save ticket.' });
    }
  };

  const handleEdit = (ticket) => {
    setEditingId(ticket.id);
    setForm({
      subject: ticket.subject || '',
      category: ticket.category || 'General',
      priority: ticket.priority || 'Normal',
      status: ticket.status || 'Open',
      reference: ticket.reference || '',
      notes: ticket.notes || '',
    });
    setFeedback(null);
  };

  const handleDelete = async (ticketId) => {
    if (!ticketId) return;
    setFeedback(null);
    try {
      await onDeleteTicket?.(ticketId);
      if (editingId === ticketId) {
        setEditingId(null);
        setForm(DEFAULT_FORM);
      }
      setFeedback({ type: 'success', message: 'Ticket removed.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to remove ticket.' });
    }
  };

  return (
    <section className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <header className="flex items-start justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Support desk</p>
          <h2 className="text-2xl font-semibold text-slate-900">Resolve issues and unblock mentees quickly</h2>
          <p className="text-sm text-slate-600">
            Escalate billing questions, automation tweaks, and compliance follow-ups. Track ownership and response SLAs without
            leaving the mentor workspace.
          </p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <LifebuoyIcon className="h-7 w-7" aria-hidden="true" />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {editingId ? 'Update support ticket' : 'Create support ticket'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(DEFAULT_FORM);
                setFeedback(null);
              }}
              className="text-xs font-semibold text-accent hover:underline"
            >
              Reset
            </button>
          </div>

          {feedback ? (
            <div
              className={`rounded-2xl px-4 py-2 text-sm ${
                feedback.type === 'success'
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Subject
            <input
              type="text"
              required
              value={form.subject}
              onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Category
              <input
                type="text"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Priority
              <select
                value={form.priority}
                onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {SUPPORT_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Status
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {SUPPORT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Reference
              <input
                type="text"
                value={form.reference}
                placeholder="SUP-4381"
                onChange={(event) => setForm((current) => ({ ...current, reference: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Internal notes
            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Saving ticket…' : editingId ? 'Update ticket' : 'Create ticket'}
          </button>
        </form>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Live support metrics</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Open tickets</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{summary?.open ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Awaiting mentor</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{summary?.awaitingMentor ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Urgent</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{summary?.urgent ?? 0}</p>
              </div>
            </div>
          </div>

          <ul className="space-y-4">
            {orderedTickets.map((ticket) => (
              <li key={ticket.id} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{ticket.subject}</p>
                    <p className="text-sm text-slate-500">{ticket.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {ticket.status}
                    </span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      {ticket.priority}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEdit(ticket)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(ticket.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>
                <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-slate-500">Reference:</span> {ticket.reference || 'Pending'}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Updated:</span> {formatTimestamp(ticket.updatedAt)}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-500">Submitted:</span> {formatTimestamp(ticket.submittedAt)}
                  </p>
                </div>
                {ticket.notes ? <p className="text-sm text-slate-600">{ticket.notes}</p> : null}
              </li>
            ))}
            {!orderedTickets.length ? (
              <li className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                No support tickets logged. Raise your first request to collaborate with the Gigvora support team.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  );
}

MentorSupportSection.propTypes = {
  tickets: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      subject: PropTypes.string,
      category: PropTypes.string,
      priority: PropTypes.string,
      status: PropTypes.string,
      reference: PropTypes.string,
      notes: PropTypes.string,
      submittedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  ),
  summary: PropTypes.shape({
    open: PropTypes.number,
    awaitingMentor: PropTypes.number,
    urgent: PropTypes.number,
  }),
  onCreateTicket: PropTypes.func,
  onUpdateTicket: PropTypes.func,
  onDeleteTicket: PropTypes.func,
  saving: PropTypes.bool,
};

MentorSupportSection.defaultProps = {
  tickets: [],
  summary: null,
  onCreateTicket: undefined,
  onUpdateTicket: undefined,
  onDeleteTicket: undefined,
  saving: false,
};

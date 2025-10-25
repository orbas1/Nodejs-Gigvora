import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { formatMentorName, formatMentorContactLine } from '../../../../../utils/mentoring.js';

const FILTERS = [
  { id: 'upcoming', label: 'Upcoming', predicate: (session) => session.status === 'scheduled' },
  { id: 'requested', label: 'Requested', predicate: (session) => session.status === 'requested' },
  { id: 'completed', label: 'Completed', predicate: (session) => session.status === 'completed' },
  { id: 'cancelled', label: 'Cancelled', predicate: (session) => session.status === 'cancelled' },
  { id: 'all', label: 'All', predicate: () => true },
];

const STATUS_OPTIONS = [
  { value: 'requested', label: 'Requested' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function formatDateTime(value) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    return dateFormatter.format(date);
  } catch (error) {
    return value;
  }
}

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value));
  } catch (error) {
    return `${currency} ${Number(value).toFixed(0)}`;
  }
}

function SessionRow({ session, mentorId, mentorName, mentorSubtitle, onEdit, onOpenMentor }) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-4 py-3 text-sm font-semibold text-slate-900">
        <button
          type="button"
          onClick={() => onOpenMentor(mentorId)}
          className="text-left transition hover:text-blue-700"
        >
          {mentorName}
        </button>
        {mentorSubtitle ? <p className="text-xs text-slate-500">{mentorSubtitle}</p> : null}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{session.topic}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{formatDateTime(session.scheduledAt)}</td>
      <td className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{session.status}</td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {session.pricePaid != null ? formatCurrency(session.pricePaid, session.currency ?? 'USD') : '—'}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={() => onEdit(session)}
          className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
        >
          Edit
        </button>
      </td>
    </tr>
  );
}

SessionRow.propTypes = {
  session: PropTypes.object.isRequired,
  mentorId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  mentorName: PropTypes.string.isRequired,
  mentorSubtitle: PropTypes.string,
  onEdit: PropTypes.func.isRequired,
  onOpenMentor: PropTypes.func.isRequired,
};

function SessionEditRow({ session, onCancel, onSave, pending }) {
  const [form, setForm] = useState(() => ({
    scheduledAt: session.scheduledAt ? session.scheduledAt.slice(0, 16) : '',
    status: session.status,
    meetingUrl: session.meetingUrl ?? '',
    notes: session.notes ?? '',
    pricePaid: session.pricePaid != null ? session.pricePaid : '',
    currency: session.currency ?? 'USD',
  }));
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    const payload = {
      status: form.status,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
      meetingUrl: form.meetingUrl || undefined,
      notes: form.notes || undefined,
      pricePaid: form.pricePaid === '' ? null : Number(form.pricePaid),
      currency: form.currency || undefined,
    };

    try {
      await onSave(payload);
    } catch (saveError) {
      setError(saveError?.message || 'Unable to update session.');
    }
  };

  return (
    <tr className="border-b border-slate-100 bg-slate-50/80">
      <td colSpan={6} className="px-4 py-4">
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm font-semibold text-slate-700">
            Status
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Scheduled at
            <input
              type="datetime-local"
              name="scheduledAt"
              value={form.scheduledAt}
              onChange={handleChange}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Meeting link
            <input
              type="url"
              name="meetingUrl"
              value={form.meetingUrl}
              onChange={handleChange}
              placeholder="https://meet.gigvora.com"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Notes
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Price paid
            <input
              type="number"
              name="pricePaid"
              value={form.pricePaid}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="text-sm font-semibold text-slate-700">
            Currency
            <input
              type="text"
              name="currency"
              value={form.currency}
              onChange={handleChange}
              maxLength={3}
              className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 uppercase tracking-[0.3em] text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="flex items-end justify-end gap-3 sm:col-span-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
              disabled={pending}
            >
              Save changes
            </button>
          </div>
          {error ? <p className="sm:col-span-3 text-sm text-rose-600">{error}</p> : null}
        </form>
      </td>
    </tr>
  );
}

SessionEditRow.propTypes = {
  session: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  pending: PropTypes.bool,
};

export default function MentoringSessionsPanel({
  sessions,
  mentorLookup,
  onUpdate,
  pending,
  loading,
  onOpenMentor,
}) {
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [editingId, setEditingId] = useState(null);

  const filteredSessions = useMemo(() => {
    const filter = FILTERS.find((item) => item.id === activeFilter) ?? FILTERS[FILTERS.length - 1];
    return (sessions ?? []).filter((session) => filter.predicate(session));
  }, [activeFilter, sessions]);

  const handleEdit = (session) => {
    setEditingId(session.id);
  };

  const handleCancelEdit = () => setEditingId(null);

  const renderRows = () => {
    if (!filteredSessions.length) {
      if (loading) {
        return (
          <tr>
            <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
              Refreshing mentoring sessions…
            </td>
          </tr>
        );
      }
      return (
        <tr>
          <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
            No sessions in this view yet. Create a session or adjust the filter.
          </td>
        </tr>
      );
    }

    return filteredSessions.map((session) => {
      const mentorRecord = mentorLookup?.get(session.mentorId);
      const fallbackMentor = session.mentor ?? null;
      const mentorId = session.mentorId ?? mentorRecord?.id ?? fallbackMentor?.id ?? null;
      const mentorName = formatMentorName(mentorRecord ?? fallbackMentor ?? { id: mentorId });
      const mentorSubtitle = formatMentorContactLine(mentorRecord ?? fallbackMentor ?? null);

      if (editingId === session.id) {
        return (
          <SessionEditRow
            key={session.id}
            session={session}
            onCancel={handleCancelEdit}
            onSave={(updates) => onUpdate(session.id, updates).then(() => setEditingId(null))}
            pending={pending}
          />
        );
      }

      return (
        <SessionRow
          key={session.id}
          session={session}
          mentorId={mentorId}
          mentorName={mentorName}
          mentorSubtitle={mentorSubtitle === 'No contact set' ? null : mentorSubtitle}
          onEdit={handleEdit}
          onOpenMentor={onOpenMentor}
        />
      );
    });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Sessions</p>
          <h3 className="text-lg font-semibold text-slate-900">Mentoring sessions booked</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  activeFilter === filter.id
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          {loading ? (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <span className="h-2 w-2 animate-ping rounded-full bg-blue-500" aria-hidden /> Refreshing
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-left" aria-busy={loading}>
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              <th className="px-4 py-2">Mentor</th>
              <th className="px-4 py-2">Topic</th>
              <th className="px-4 py-2">Scheduled</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Spend</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{renderRows()}</tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Tip: click a mentor to open the preview modal and review contact details before your next session.
      </p>
    </div>
  );
}

MentoringSessionsPanel.propTypes = {
  sessions: PropTypes.arrayOf(PropTypes.object),
  mentorLookup: PropTypes.instanceOf(Map),
  onUpdate: PropTypes.func.isRequired,
  pending: PropTypes.bool,
  loading: PropTypes.bool,
  onOpenMentor: PropTypes.func.isRequired,
};

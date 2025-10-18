import { useId, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  parseInteger,
  toDateInput,
  toIsoString,
} from '../utils.js';

const STATUSES = ['registered', 'waitlisted', 'checked_in', 'no_show', 'removed', 'completed'];

export default function NetworkingBookingForm({
  mode,
  initialValue,
  onSubmit,
  busy,
  sessionOptions,
  loadingSessions,
}) {
  const sessionInputId = useId();
  const [form, setForm] = useState(() => ({
    sessionId: initialValue?.sessionId ? String(initialValue.sessionId) : '',
    status: initialValue?.status ?? STATUSES[0],
    seatNumber: initialValue?.seatNumber != null ? String(initialValue.seatNumber) : '',
    joinUrl: initialValue?.joinUrl ?? '',
    checkedInAt: toDateInput(initialValue?.checkedInAt),
    completedAt: toDateInput(initialValue?.completedAt),
    userNotes: initialValue?.userNotes ?? initialValue?.metadata?.userNotes ?? '',
    participantEmail: initialValue?.participantEmail ?? '',
    participantName: initialValue?.participantName ?? '',
  }));

  const catalog = useMemo(() => sessionOptions ?? [], [sessionOptions]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (busy) {
      return;
    }

    const payload = {};

    if (mode === 'create') {
      const sessionId = parseInteger(form.sessionId);
      if (!sessionId) {
        return;
      }
      const participantEmail = form.participantEmail.trim();
      if (!participantEmail) {
        return;
      }
      payload.sessionId = sessionId;
      payload.participantEmail = participantEmail;
      if (form.participantName.trim()) {
        payload.participantName = form.participantName.trim();
      }
    }

    payload.status = form.status;

    const seatNumber = parseInteger(form.seatNumber);
    if (seatNumber !== undefined) {
      payload.seatNumber = seatNumber;
    } else if (mode === 'edit' && form.seatNumber === '') {
      payload.seatNumber = null;
    }

    if (form.joinUrl || mode === 'edit') {
      payload.joinUrl = form.joinUrl || null;
    }

    const checkedInAt = form.checkedInAt ? toIsoString(form.checkedInAt) : null;
    if (checkedInAt || (mode === 'edit' && form.checkedInAt === '')) {
      payload.checkedInAt = checkedInAt;
    }

    const completedAt = form.completedAt ? toIsoString(form.completedAt) : null;
    if (completedAt || (mode === 'edit' && form.completedAt === '')) {
      payload.completedAt = completedAt;
    }

    if (form.userNotes || (mode === 'edit' && form.userNotes === '')) {
      payload.userNotes = form.userNotes || null;
    }

    onSubmit(payload);
  };

  const requiredReady = Boolean(form.sessionId && form.participantEmail);
  const canSubmit = mode === 'edit' ? !busy : requiredReady && !busy;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Session
          <input
            name="sessionId"
            id={`${sessionInputId}-session`}
            type="text"
            inputMode="numeric"
            list={`${sessionInputId}-sessions`}
            value={form.sessionId}
            onChange={handleChange}
            disabled={mode === 'edit'}
            className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:bg-slate-100"
            placeholder="Session ID"
            required={mode === 'create'}
          />
          {catalog.length ? (
            <datalist id={`${sessionInputId}-sessions`}>
              {catalog.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.label}
                </option>
              ))}
            </datalist>
          ) : null}
          {loadingSessions ? (
            <span className="mt-1 text-[11px] font-normal text-slate-400">Loading sessions…</span>
          ) : null}
        </label>

        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Status
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="mt-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </label>
      </div>

      {mode === 'create' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            Email
            <input
              name="participantEmail"
              type="email"
              value={form.participantEmail}
              onChange={handleChange}
              required
              className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="name@email.com"
            />
          </label>
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            Name
            <input
              name="participantName"
              type="text"
              value={form.participantName}
              onChange={handleChange}
              className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="Full name"
            />
          </label>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Seat
          <input
            name="seatNumber"
            type="number"
            min="1"
            value={form.seatNumber}
            onChange={handleChange}
            className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Seat"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Link
          <input
            name="joinUrl"
            type="url"
            value={form.joinUrl}
            onChange={handleChange}
            className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="https://"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Check-in
          <input
            name="checkedInAt"
            type="datetime-local"
            value={form.checkedInAt}
            onChange={handleChange}
            className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Completed
          <input
            name="completedAt"
            type="datetime-local"
            value={form.completedAt}
            onChange={handleChange}
            className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </label>
      </div>

      <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
        Notes
        <textarea
          name="userNotes"
          rows={3}
          value={form.userNotes}
          onChange={handleChange}
          className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
          placeholder="Personal notes"
        />
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!canSubmit}
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

NetworkingBookingForm.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  initialValue: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  busy: PropTypes.bool,
  sessionOptions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  loadingSessions: PropTypes.bool,
};

NetworkingBookingForm.defaultProps = {
  initialValue: null,
  busy: false,
  sessionOptions: [],
  loadingSessions: false,
};

import { useId, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  fieldToTags,
  parseInteger,
  tagsToField,
  toDateInput,
  toIsoString,
} from '../utils.js';

const STATUSES = ['saved', 'requested', 'following', 'connected', 'archived'];

export default function NetworkingConnectionForm({
  mode,
  initialValue,
  onSubmit,
  busy,
  sessionOptions,
  loadingSessions,
}) {
  const sessionInputId = useId();
  const [form, setForm] = useState(() => ({
    connectionName: initialValue?.connectionName ?? '',
    connectionEmail: initialValue?.connectionEmail ?? '',
    connectionHeadline: initialValue?.connectionHeadline ?? '',
    connectionCompany: initialValue?.connectionCompany ?? '',
    followStatus: initialValue?.followStatus ?? STATUSES[0],
    sessionId: initialValue?.sessionId != null ? String(initialValue.sessionId) : '',
    connectionUserId: initialValue?.connectionUserId != null ? String(initialValue.connectionUserId) : '',
    connectedAt: toDateInput(initialValue?.connectedAt),
    lastContactedAt: toDateInput(initialValue?.lastContactedAt),
    tags: tagsToField(initialValue?.tags),
    notes: initialValue?.notes ?? '',
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

    if (!form.connectionName.trim()) {
      return;
    }

    const payload = {
      connectionName: form.connectionName.trim(),
      followStatus: form.followStatus,
    };

    if (form.connectionEmail || mode === 'edit') {
      payload.connectionEmail = form.connectionEmail || null;
    }
    if (form.connectionHeadline || (mode === 'edit' && form.connectionHeadline === '')) {
      payload.connectionHeadline = form.connectionHeadline || null;
    }
    if (form.connectionCompany || (mode === 'edit' && form.connectionCompany === '')) {
      payload.connectionCompany = form.connectionCompany || null;
    }

    const sessionId = parseInteger(form.sessionId);
    if (sessionId !== undefined) {
      payload.sessionId = sessionId;
    } else if (mode === 'edit' && form.sessionId === '') {
      payload.sessionId = null;
    }

    const connectionUserId = parseInteger(form.connectionUserId);
    if (connectionUserId !== undefined) {
      payload.connectionUserId = connectionUserId;
    } else if (mode === 'edit' && form.connectionUserId === '') {
      payload.connectionUserId = null;
    }

    const connectedAt = form.connectedAt ? toIsoString(form.connectedAt) : null;
    if (connectedAt || (mode === 'edit' && form.connectedAt === '')) {
      payload.connectedAt = connectedAt;
    }

    const lastContactedAt = form.lastContactedAt ? toIsoString(form.lastContactedAt) : null;
    if (lastContactedAt || (mode === 'edit' && form.lastContactedAt === '')) {
      payload.lastContactedAt = lastContactedAt;
    }

    const tags = fieldToTags(form.tags);
    if (tags !== undefined) {
      payload.tags = tags;
    }

    if (form.notes || (mode === 'edit' && form.notes === '')) {
      payload.notes = form.notes || null;
    }

    onSubmit(payload);
  };

  const ready = Boolean(form.connectionName.trim()) && !busy;

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Name
          <input
            name="connectionName"
            type="text"
            value={form.connectionName}
            onChange={handleChange}
            required
            className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Contact name"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Email
          <input
            name="connectionEmail"
            type="email"
            value={form.connectionEmail}
            onChange={handleChange}
            className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="name@email.com"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Headline
          <input
            name="connectionHeadline"
            type="text"
            value={form.connectionHeadline}
            onChange={handleChange}
            className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Role"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Company
          <input
            name="connectionCompany"
            type="text"
            value={form.connectionCompany}
            onChange={handleChange}
            className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Organisation"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Status
          <select
            name="followStatus"
            value={form.followStatus}
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
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Session
          <input
            name="sessionId"
            type="text"
            inputMode="numeric"
            list={`${sessionInputId}-connections-sessions`}
            value={form.sessionId}
            onChange={handleChange}
            className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Session ID"
          />
          {catalog.length ? (
            <datalist id={`${sessionInputId}-connections-sessions`}>
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Connected
          <input
            name="connectedAt"
            type="datetime-local"
            value={form.connectedAt}
            onChange={handleChange}
            className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Follow-up
          <input
            name="lastContactedAt"
            type="datetime-local"
            value={form.lastContactedAt}
            onChange={handleChange}
            className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          User
          <input
            name="connectionUserId"
            type="number"
            min="1"
            value={form.connectionUserId}
            onChange={handleChange}
            className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="User ID"
          />
        </label>
        <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
          Tags
          <input
            name="tags"
            type="text"
            value={form.tags}
            onChange={handleChange}
            className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="mentor, intro"
          />
        </label>
      </div>

      <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
        Notes
        <textarea
          name="notes"
          rows={3}
          value={form.notes}
          onChange={handleChange}
          className="mt-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
          placeholder="Notes"
        />
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          disabled={!ready}
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

NetworkingConnectionForm.propTypes = {
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

NetworkingConnectionForm.defaultProps = {
  initialValue: null,
  busy: false,
  sessionOptions: [],
  loadingSessions: false,
};

import { Dialog, Transition } from '@headlessui/react';
import PropTypes from 'prop-types';
import { Fragment, useEffect, useMemo, useState } from 'react';

const SESSION_DEFAULT = {
  mentorId: '',
  mentorName: '',
  mentorEmail: '',
  clientName: '',
  clientEmail: '',
  focusArea: '',
  scheduledAt: '',
  durationMinutes: '60',
  status: 'scheduled',
  meetingUrl: '',
  costAmount: '',
  currency: '',
  purchaseId: '',
  sessionNotes: '',
};

const STATUS_OPTIONS = ['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'];

function toDateTimeInput(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (input) => `${input}`.padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function normaliseString(value) {
  if (value == null) {
    return undefined;
  }
  const trimmed = `${value}`.trim();
  return trimmed || undefined;
}

function buildSessionPayload(form, currencyFallback) {
  const payload = {};

  if (form.mentorId) payload.mentorId = Number(form.mentorId);
  const mentorName = normaliseString(form.mentorName);
  if (mentorName !== undefined) payload.mentorName = mentorName;
  const mentorEmail = normaliseString(form.mentorEmail);
  if (mentorEmail !== undefined) payload.mentorEmail = mentorEmail;
  const clientName = normaliseString(form.clientName);
  if (clientName !== undefined) payload.clientName = clientName;
  const clientEmail = normaliseString(form.clientEmail);
  if (clientEmail !== undefined) payload.clientEmail = clientEmail;
  const focusArea = normaliseString(form.focusArea);
  if (focusArea !== undefined) payload.focusArea = focusArea;

  if (form.scheduledAt) {
    const date = new Date(form.scheduledAt);
    if (!Number.isNaN(date.getTime())) {
      payload.scheduledAt = date.toISOString();
    }
  }

  if (form.durationMinutes) payload.durationMinutes = Number(form.durationMinutes);
  if (form.status) payload.status = form.status;
  const meetingUrl = normaliseString(form.meetingUrl);
  if (meetingUrl !== undefined) payload.meetingUrl = meetingUrl;
  if (form.purchaseId) payload.purchaseId = Number(form.purchaseId);
  if (form.costAmount) payload.costAmount = Number(form.costAmount);
  const currency = normaliseString(form.currency) || currencyFallback;
  if (currency) payload.currency = currency.toUpperCase();
  const notes = normaliseString(form.sessionNotes);
  if (notes !== undefined) payload.sessionNotes = notes;

  return payload;
}

function sessionToForm(session, currencyFallback) {
  if (!session) {
    return { ...SESSION_DEFAULT, currency: currencyFallback ?? 'USD' };
  }
  return {
    mentorId: session.mentorId ? String(session.mentorId) : '',
    mentorName: session.mentorName || session.mentor?.name || '',
    mentorEmail: session.mentorEmail || session.mentor?.email || '',
    clientName: session.clientName || '',
    clientEmail: session.clientEmail || '',
    focusArea: session.focusArea || '',
    scheduledAt: toDateTimeInput(session.scheduledAt),
    durationMinutes: session.durationMinutes ? String(session.durationMinutes) : '60',
    status: session.status || 'scheduled',
    meetingUrl: session.meetingUrl || '',
    costAmount: session.costAmount != null ? String(session.costAmount) : '',
    currency: session.currency || currencyFallback || 'USD',
    purchaseId: session.purchaseId ? String(session.purchaseId) : '',
    sessionNotes: session.sessionNotes || '',
  };
}

function buildMentorOptions(favourites = [], suggestions = []) {
  const map = new Map();
  [...favourites, ...suggestions].forEach((mentor) => {
    const key = mentor.mentorId || mentor.id || mentor.mentorEmail || mentor.mentorName;
    if (!key) {
      return;
    }
    if (!map.has(key)) {
      map.set(key, {
        id: mentor.mentorId || mentor.id || null,
        name: mentor.mentorName || mentor.name || mentor.label || 'Mentor',
        email: mentor.mentorEmail || mentor.email || null,
      });
    }
  });
  return Array.from(map.values());
}

function SessionDrawer({
  open,
  mode,
  form,
  currency,
  mentorOptions,
  purchaseOptions,
  busy,
  error,
  onChange,
  onClose,
  onSubmit,
  onDelete,
}) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-40" onClose={busy ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-end">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="w-full max-w-xl bg-white p-8 shadow-2xl">
                <Dialog.Title className="text-xl font-semibold text-slate-900">
                  {mode === 'edit' ? 'Edit session' : 'New session'}
                </Dialog.Title>
                <p className="mt-1 text-sm text-slate-500">Keep details tight so anyone can jump in with context.</p>

                <form className="mt-6 space-y-5" onSubmit={onSubmit}>
                  <div className="space-y-2">
                    <label htmlFor="mentorId" className="text-sm font-semibold text-slate-700">
                      Mentor
                    </label>
                    <select
                      id="mentorId"
                      name="mentorId"
                      value={form.mentorId}
                      onChange={onChange}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                    >
                      <option value="">Select mentor</option>
                      {mentorOptions.map((option) => (
                        <option key={`${option.id ?? option.email ?? option.name}`} value={option.id ?? ''}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        type="text"
                        name="mentorName"
                        value={form.mentorName}
                        onChange={onChange}
                        placeholder="Mentor name"
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      />
                      <input
                        type="email"
                        name="mentorEmail"
                        value={form.mentorEmail}
                        onChange={onChange}
                        placeholder="Mentor email"
                        className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="clientName" className="text-sm font-semibold text-slate-700">
                        Client name
                      </label>
                      <input
                        type="text"
                        id="clientName"
                        name="clientName"
                        value={form.clientName}
                        onChange={onChange}
                        placeholder="Client contact"
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="clientEmail" className="text-sm font-semibold text-slate-700">
                        Client email
                      </label>
                      <input
                        type="email"
                        id="clientEmail"
                        name="clientEmail"
                        value={form.clientEmail}
                        onChange={onChange}
                        placeholder="client@email.com"
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="focusArea" className="text-sm font-semibold text-slate-700">
                      Focus area
                    </label>
                    <input
                      type="text"
                      id="focusArea"
                      name="focusArea"
                      value={form.focusArea}
                      onChange={onChange}
                      placeholder="Product roadmap, hiring, pricing…"
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1.2fr_1fr]">
                    <div className="space-y-2">
                      <label htmlFor="scheduledAt" className="text-sm font-semibold text-slate-700">
                        Start time
                      </label>
                      <input
                        type="datetime-local"
                        id="scheduledAt"
                        name="scheduledAt"
                        value={form.scheduledAt}
                        onChange={onChange}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label htmlFor="durationMinutes" className="text-sm font-semibold text-slate-700">
                          Duration (min)
                        </label>
                        <input
                          type="number"
                          id="durationMinutes"
                          name="durationMinutes"
                          min="15"
                          step="15"
                          value={form.durationMinutes}
                          onChange={onChange}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="status" className="text-sm font-semibold text-slate-700">
                          Status
                        </label>
                        <select
                          id="status"
                          name="status"
                          value={form.status}
                          onChange={onChange}
                          className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="purchaseId" className="text-sm font-semibold text-slate-700">
                        Package (optional)
                      </label>
                      <select
                        id="purchaseId"
                        name="purchaseId"
                        value={form.purchaseId}
                        onChange={onChange}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      >
                        <option value="">Not linked</option>
                        {purchaseOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="meetingUrl" className="text-sm font-semibold text-slate-700">
                        Meeting link
                      </label>
                      <input
                        type="url"
                        id="meetingUrl"
                        name="meetingUrl"
                        value={form.meetingUrl}
                        onChange={onChange}
                        placeholder="https://"
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
                    <div className="space-y-2">
                      <label htmlFor="sessionNotes" className="text-sm font-semibold text-slate-700">
                        Notes
                      </label>
                      <textarea
                        id="sessionNotes"
                        name="sessionNotes"
                        value={form.sessionNotes}
                        onChange={onChange}
                        rows={3}
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="costAmount" className="text-sm font-semibold text-slate-700">
                        Cost
                      </label>
                      <input
                        type="number"
                        id="costAmount"
                        name="costAmount"
                        value={form.costAmount}
                        onChange={onChange}
                        min="0"
                        className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="currency" className="text-sm font-semibold text-slate-700">
                        Currency
                      </label>
                      <input
                        type="text"
                        id="currency"
                        name="currency"
                        value={form.currency || currency}
                        onChange={onChange}
                        className="w-24 rounded-2xl border border-slate-200 px-3 py-2 text-sm uppercase tracking-[0.3em] text-slate-700 focus:border-slate-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {error ? (
                    <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
                  ) : null}

                  <div className="flex items-center justify-between">
                    {mode === 'edit' ? (
                      <button
                        type="button"
                        onClick={onDelete}
                        disabled={busy}
                        className="text-sm font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-60"
                      >
                        Delete session
                      </button>
                    ) : (
                      <span />
                    )}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={busy}
                        className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={busy}
                        className="rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {busy ? 'Saving…' : 'Save session'}
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

SessionDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  form: PropTypes.object.isRequired,
  currency: PropTypes.string.isRequired,
  mentorOptions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      name: PropTypes.string,
      email: PropTypes.string,
    }),
  ).isRequired,
  purchaseOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ).isRequired,
  busy: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default function MentoringSessionsPanel({ sessions, overview, purchases, suggestions, favourites, actions }) {
  const currency = overview?.workspace?.defaultCurrency ?? 'USD';
  const mentorOptions = useMemo(() => buildMentorOptions(favourites, suggestions, sessions), [favourites, suggestions, sessions]);
  const purchaseOptions = useMemo(
    () =>
      purchases.map((purchase) => ({
        value: String(purchase.id),
        label: `${purchase.packageName || 'Package'} · ${purchase.sessionsUsed ?? 0}/${
          purchase.sessionsIncluded ?? 0
        } used`,
      })),
    [purchases],
  );

  const [drawer, setDrawer] = useState({ open: false, mode: 'create', session: null });
  const [form, setForm] = useState(() => sessionToForm(null, currency));
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!drawer.open) {
      setForm(sessionToForm(null, currency));
      setFormError(null);
      return;
    }
    if (drawer.mode === 'edit' && drawer.session) {
      setForm(sessionToForm(drawer.session, currency));
    } else {
      setForm(sessionToForm(null, currency));
    }
    setFormError(null);
  }, [drawer, currency]);

  const handleOpenCreate = () => setDrawer({ open: true, mode: 'create', session: null });
  const handleOpenEdit = (session) => setDrawer({ open: true, mode: 'edit', session });
  const handleClose = () => {
    if (busy) {
      return;
    }
    setDrawer({ open: false, mode: 'create', session: null });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const payload = buildSessionPayload(form, currency);
      if (drawer.mode === 'edit' && drawer.session) {
        await actions.updateSession(drawer.session.id, payload);
      } else {
        await actions.createSession(payload);
      }
      setDrawer({ open: false, mode: 'create', session: null });
    } catch (error) {
      setFormError(error?.body?.message || error?.message || 'Unable to save session.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!drawer.session) {
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await actions.deleteSession(drawer.session.id);
      setDrawer({ open: false, mode: 'create', session: null });
    } catch (error) {
      setFormError(error?.body?.message || error?.message || 'Unable to remove session.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Sessions</h2>
          <p className="text-sm text-slate-500">Tap any card to expand, edit, or reschedule.</p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          New session
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => handleOpenEdit(session)}
            className="flex h-full flex-col rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              <span>{session.status.replace(/_/g, ' ')}</span>
              <span>{formatDateTime(session.scheduledAt)}</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">{session.clientName || 'Client pending'}</p>
            <p className="text-xs text-slate-500">{session.mentorName || session.mentor?.name || 'Mentor TBD'}</p>
            {session.focusArea ? (
              <p className="mt-3 rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">{session.focusArea}</p>
            ) : null}
            {session.sessionNotes ? (
              <p className="mt-3 line-clamp-3 text-xs text-slate-500">{session.sessionNotes}</p>
            ) : null}
          </button>
        ))}
        {!sessions.length ? (
          <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No sessions logged yet. Create one to kick off the workflow.
          </div>
        ) : null}
      </div>

      <SessionDrawer
        open={drawer.open}
        mode={drawer.mode}
        form={form}
        currency={currency}
        mentorOptions={mentorOptions}
        purchaseOptions={purchaseOptions}
        busy={busy}
        error={formError}
        onChange={handleChange}
        onClose={handleClose}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </section>
  );
}

MentoringSessionsPanel.propTypes = {
  sessions: PropTypes.arrayOf(PropTypes.object).isRequired,
  overview: PropTypes.object,
  purchases: PropTypes.arrayOf(PropTypes.object).isRequired,
  suggestions: PropTypes.arrayOf(PropTypes.object).isRequired,
  favourites: PropTypes.arrayOf(PropTypes.object).isRequired,
  actions: PropTypes.shape({
    createSession: PropTypes.func.isRequired,
    updateSession: PropTypes.func.isRequired,
    deleteSession: PropTypes.func.isRequired,
  }).isRequired,
};

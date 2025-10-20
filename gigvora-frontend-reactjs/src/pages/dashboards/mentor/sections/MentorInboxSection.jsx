import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { EnvelopeOpenIcon, PaperAirplaneIcon, PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const CHANNELS = ['Explorer', 'Email', 'Slack Connect', 'WhatsApp'];
const MESSAGE_STATUSES = ['Unread', 'Read', 'Archived'];

const DEFAULT_FORM = {
  from: '',
  channel: 'Explorer',
  status: 'Unread',
  subject: '',
  preview: '',
  tags: '',
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

export default function MentorInboxSection({ messages, summary, onCreateMessage, onUpdateMessage, onDeleteMessage, saving }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editingId, setEditingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const orderedMessages = useMemo(() => {
    return [...(messages ?? [])].sort((a, b) => new Date(b.receivedAt ?? 0).getTime() - new Date(a.receivedAt ?? 0).getTime());
  }, [messages]);

  useEffect(() => {
    if (!editingId) {
      setForm(DEFAULT_FORM);
    }
  }, [editingId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    const payload = {
      from: form.from,
      channel: form.channel,
      status: form.status,
      subject: form.subject,
      preview: form.preview,
      tags: form.tags,
    };
    try {
      if (editingId) {
        await onUpdateMessage?.(editingId, payload);
        setFeedback({ type: 'success', message: 'Message updated.' });
      } else {
        await onCreateMessage?.(payload);
        setFeedback({ type: 'success', message: 'Message logged.' });
      }
      setEditingId(null);
      setForm(DEFAULT_FORM);
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to save message.' });
    }
  };

  const handleEdit = (message) => {
    setEditingId(message.id);
    setForm({
      from: message.from || '',
      channel: message.channel || 'Explorer',
      status: message.status || 'Unread',
      subject: message.subject || '',
      preview: message.preview || '',
      tags: Array.isArray(message.tags) ? message.tags.join(', ') : message.tags || '',
    });
    setFeedback(null);
  };

  const handleDelete = async (messageId) => {
    if (!messageId) return;
    setFeedback(null);
    try {
      await onDeleteMessage?.(messageId);
      if (editingId === messageId) {
        setEditingId(null);
        setForm(DEFAULT_FORM);
      }
      setFeedback({ type: 'success', message: 'Message removed.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to remove message.' });
    }
  };

  const handleToggleRead = async (message) => {
    const nextStatus = message.status === 'Unread' ? 'Read' : 'Unread';
    try {
      await onUpdateMessage?.(message.id, { status: nextStatus });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Unable to update message.' });
    }
  };

  return (
    <section className="space-y-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <header className="flex items-start justify-between gap-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Mentor inbox</p>
          <h2 className="text-2xl font-semibold text-slate-900">Stay responsive to mentee signals</h2>
          <p className="text-sm text-slate-600">
            Consolidate Explorer DMs, async feedback, and partner nudges. Triage quickly, annotate follow-ups, and mark read when
            actioned.
          </p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <EnvelopeOpenIcon className="h-7 w-7" aria-hidden="true" />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              {editingId ? 'Update message' : 'Log new message'}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              From
              <input
                type="text"
                required
                value={form.from}
                onChange={(event) => setForm((current) => ({ ...current, from: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Channel
              <select
                value={form.channel}
                onChange={(event) => setForm((current) => ({ ...current, channel: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {CHANNELS.map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
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
                {MESSAGE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
              Subject
              <input
                type="text"
                value={form.subject}
                onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Preview
            <textarea
              rows={4}
              value={form.preview}
              onChange={(event) => setForm((current) => ({ ...current, preview: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
            Tags
            <input
              type="text"
              value={form.tags}
              placeholder="Leadership accelerator, async review"
              onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <span className="text-xs font-normal text-slate-500">Comma separated for quick filtering.</span>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Saving message…' : editingId ? 'Update message' : 'Log message'}
          </button>
        </form>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Inbox health</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unread</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{summary?.unread ?? 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{summary?.total ?? 0}</p>
              </div>
            </div>
          </div>

          <ul className="space-y-4">
            {orderedMessages.map((message) => (
              <li key={message.id} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{message.subject || 'No subject'}</p>
                    <p className="text-sm text-slate-500">From {message.from} · {message.channel}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleRead(message)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      <PaperAirplaneIcon className="h-4 w-4" aria-hidden="true" />
                      Mark {message.status === 'Unread' ? 'read' : 'unread'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(message)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(message.id)}
                      className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:text-rose-700"
                    >
                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                      Remove
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-600">{message.preview || 'No preview provided.'}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="font-semibold text-slate-500">Received {formatTimestamp(message.receivedAt)}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{message.status}</span>
                  {message.tags?.length
                    ? message.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                          {tag}
                        </span>
                      ))
                    : null}
                </div>
              </li>
            ))}
            {!orderedMessages.length ? (
              <li className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Inbox is clear. New mentee updates will appear here automatically.
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  );
}

MentorInboxSection.propTypes = {
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      from: PropTypes.string,
      channel: PropTypes.string,
      status: PropTypes.string,
      subject: PropTypes.string,
      preview: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string),
      receivedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  ),
  summary: PropTypes.shape({
    unread: PropTypes.number,
    total: PropTypes.number,
  }),
  onCreateMessage: PropTypes.func,
  onUpdateMessage: PropTypes.func,
  onDeleteMessage: PropTypes.func,
  saving: PropTypes.bool,
};

MentorInboxSection.defaultProps = {
  messages: [],
  summary: null,
  onCreateMessage: undefined,
  onUpdateMessage: undefined,
  onDeleteMessage: undefined,
  saving: false,
};

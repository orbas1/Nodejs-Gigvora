import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

const VISIBILITY_OPTIONS = [
  { value: 'internal', label: 'Internal' },
  { value: 'client', label: 'Client' },
  { value: 'vendor', label: 'Vendor' },
];

function formatTimestamp(value) {
  if (!value) {
    return '—';
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch (error) {
    return '—';
  }
}

const INITIAL_FORM = {
  body: '',
  visibility: 'internal',
};

export default function GigChatSection({ orderDetail, onSendMessage, onAcknowledgeMessage, pending }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [feedback, setFeedback] = useState(null);
  const messages = useMemo(() => orderDetail?.messages ?? [], [orderDetail]);

  if (!orderDetail) {
    return (
      <section id="agency-gig-chat" className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Gig · Chat</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Chat</h2>
        <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-500">
          Pick a gig to open the thread.
        </p>
      </section>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.body.trim()) {
      setFeedback({ status: 'error', message: 'Add a message.' });
      return;
    }
    try {
      await onSendMessage?.({ body: form.body, visibility: form.visibility });
      setForm(INITIAL_FORM);
      setFeedback({ status: 'success', message: 'Sent.' });
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message ?? 'Unable to send.' });
    }
  };

  const handleAcknowledge = async (messageId) => {
    try {
      await onAcknowledgeMessage?.(messageId);
    } catch (error) {
      setFeedback({ status: 'error', message: error?.message ?? 'Unable to mark read.' });
    }
  };

  return (
    <section id="agency-gig-chat" className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Gig · Chat</p>
          <h2 className="text-3xl font-semibold text-slate-900">{orderDetail.serviceName}</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {messages.length}
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-sm text-slate-500">
              No messages yet.
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500">
                  <span className="font-semibold text-slate-600">{message.senderRole ?? 'team'}</span>
                  <span>{formatTimestamp(message.sentAt)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-900">{message.body}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span className="capitalize">{message.visibility?.replace(/_/g, ' ')} visibility</span>
                  <button
                    type="button"
                    onClick={() => handleAcknowledge(message.id)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    {message.acknowledgedAt ? `Read ${formatTimestamp(message.acknowledgedAt)}` : 'Mark read'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-sm font-semibold text-slate-900">Send message</p>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            Body
            <textarea
              name="body"
              value={form.body}
              onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
              rows={4}
              placeholder="Share update"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            Visibility
            <select
              name="visibility"
              value={form.visibility}
              onChange={(event) => setForm((current) => ({ ...current, visibility: event.target.value }))}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {feedback ? (
            <div
              className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                feedback.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {feedback.message}
            </div>
          ) : null}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

GigChatSection.propTypes = {
  orderDetail: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    messages: PropTypes.arrayOf(PropTypes.object),
  }),
  onSendMessage: PropTypes.func,
  onAcknowledgeMessage: PropTypes.func,
  pending: PropTypes.bool,
};

GigChatSection.defaultProps = {
  orderDetail: null,
  onSendMessage: undefined,
  onAcknowledgeMessage: undefined,
  pending: false,
};

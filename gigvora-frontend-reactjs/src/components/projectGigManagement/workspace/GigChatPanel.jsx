import { useState } from 'react';
import PropTypes from 'prop-types';
import { formatRelativeTime } from '../../../utils/date.js';

export default function GigChatPanel({ messages, canManage, onSendMessage, defaultAuthorName }) {
  const [form, setForm] = useState({ body: '', attachmentUrl: '' });
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.body.trim()) {
      setFeedback({ tone: 'error', message: 'Type a message.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      await onSendMessage({
        body: form.body.trim(),
        attachmentUrl: form.attachmentUrl?.trim() || undefined,
        authorName: defaultAuthorName ?? undefined,
      });
      setFeedback({ tone: 'success', message: 'Message sent.' });
      setForm({ body: '', attachmentUrl: '' });
    } catch (error) {
      setFeedback({ tone: 'error', message: error?.message ?? 'Could not send message.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Chat</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{messages.length}</span>
      </header>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5">
        {messages.length ? (
          messages.map((message) => (
            <article key={message.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-900">{message.authorName ?? 'Team'}</span>
                <span>{message.postedAt ? formatRelativeTime(message.postedAt) : 'Now'}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{message.body}</p>
              {Array.isArray(message.attachments) && message.attachments.length ? (
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  {message.attachments.map((attachment) => (
                    <a
                      key={attachment.id ?? attachment.url}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 font-semibold text-slate-600 transition hover:text-slate-900"
                    >
                      {attachment.label ?? 'Attachment'}
                    </a>
                  ))}
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-500">
            No messages yet.
          </div>
        )}
      </div>
      <form className="rounded-3xl border border-slate-200 bg-white p-5" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
          Message
          <textarea
            name="body"
            value={form.body}
            onChange={handleChange}
            rows={4}
            className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="Share an update"
            disabled={!canManage || submitting}
          />
        </label>
        <label className="mt-4 flex flex-col gap-2 text-xs font-semibold text-slate-600">
          Link (optional)
          <input
            name="attachmentUrl"
            value={form.attachmentUrl}
            onChange={handleChange}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="https://"
            disabled={!canManage || submitting}
          />
        </label>
        {feedback ? (
          <p className={`mt-3 text-sm ${feedback.tone === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {feedback.message}
          </p>
        ) : null}
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
            disabled={!canManage || submitting}
          >
            {submitting ? 'Sending…' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}

GigChatPanel.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.object).isRequired,
  canManage: PropTypes.bool,
  onSendMessage: PropTypes.func.isRequired,
  defaultAuthorName: PropTypes.string,
};

GigChatPanel.defaultProps = {
  canManage: false,
  defaultAuthorName: null,
};

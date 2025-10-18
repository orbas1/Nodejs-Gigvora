import { useEffect, useMemo, useState } from 'react';

const PRIORITY_COLORS = {
  urgent: 'bg-rose-100 text-rose-600 border-rose-200',
  high: 'bg-amber-100 text-amber-600 border-amber-200',
  normal: 'bg-blue-100 text-blue-600 border-blue-200',
  low: 'bg-slate-100 text-slate-500 border-slate-200',
};

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function WorkspaceConversationCenter({
  conversations = [],
  onAcknowledge,
  onSendMessage,
  loading = false,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [composer, setComposer] = useState({ authorName: '', authorRole: '', body: '' });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedId && conversations.length) {
      setSelectedId(conversations[0].id);
    }
  }, [selectedId, conversations]);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  async function handleSend(event) {
    event.preventDefault();
    if (!selectedConversation || !onSendMessage) {
      return;
    }
    setSaving(true);
    setFeedback(null);
    setError(null);
    try {
      await onSendMessage(selectedConversation.id, {
        authorName: composer.authorName,
        authorRole: composer.authorRole,
        body: composer.body,
      });
      setFeedback('Message sent.');
      setComposer({ authorName: composer.authorName, authorRole: composer.authorRole, body: '' });
    } catch (sendError) {
      setError(sendError);
    } finally {
      setSaving(false);
    }
  }

  async function handleAcknowledge() {
    if (!selectedConversation || !onAcknowledge) {
      return;
    }
    try {
      await onAcknowledge(selectedConversation.id);
      setFeedback('Conversation marked as read.');
    } catch (ackError) {
      setError(ackError);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">In-project chat</h2>
          <p className="text-sm text-slate-600">Collaborate with clients and teammates directly inside the workspace.</p>
        </div>
        {selectedConversation ? (
          <button
            type="button"
            onClick={handleAcknowledge}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-accent hover:text-accent"
          >
            Mark conversation as read
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
              <span>Conversations</span>
              <span className="text-xs text-slate-500">{loading ? 'Loading…' : `${conversations.length} open`}</span>
            </div>
            <ul className="max-h-[420px] divide-y divide-slate-200 overflow-y-auto">
              {conversations.length ? (
                conversations.map((conversation) => {
                  const selected = conversation.id === selectedId;
                  const badgeClass = PRIORITY_COLORS[conversation.priority] ?? PRIORITY_COLORS.normal;
                  return (
                    <li key={conversation.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(conversation.id)}
                        className={`flex w-full flex-col items-start gap-2 px-4 py-3 text-left transition ${
                          selected ? 'bg-white shadow-inner' : 'hover:bg-white'
                        }`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <span className="font-semibold text-slate-900">{conversation.topic}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${badgeClass}`}>
                            {conversation.priority}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{formatDateTime(conversation.lastMessageAt)}</p>
                        <p className="line-clamp-2 text-xs text-slate-500">{conversation.lastMessagePreview ?? 'No messages yet.'}</p>
                        {conversation.unreadCount ? (
                          <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                            {conversation.unreadCount} unread
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })
              ) : (
                <li className="px-4 py-5 text-sm text-slate-500">No conversations yet.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedConversation ? (
            <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50">
              <div className="border-b border-slate-200 px-5 py-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{selectedConversation.topic}</h3>
                    <p className="text-xs text-slate-500">
                      Participants: {(selectedConversation.participants ?? []).join(', ') || 'Workspace team'}
                    </p>
                  </div>
                  {selectedConversation.externalLink ? (
                    <a
                      href={selectedConversation.externalLink}
                      className="text-xs font-semibold text-accent hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open thread
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                {selectedConversation.messages?.length ? (
                  selectedConversation.messages.map((message) => (
                    <div key={message.id} className="rounded-2xl bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{message.authorName}</span>
                        <span>{formatDateTime(message.postedAt)}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700 whitespace-pre-line">{message.body}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No messages yet.</p>
                )}
              </div>
              <form onSubmit={handleSend} className="border-t border-slate-200 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="composer-author">
                      Your name
                    </label>
                    <input
                      id="composer-author"
                      value={composer.authorName}
                      onChange={(event) => setComposer((prev) => ({ ...prev, authorName: event.target.value }))}
                      required
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="composer-role">
                      Your role
                    </label>
                    <input
                      id="composer-role"
                      value={composer.authorRole}
                      onChange={(event) => setComposer((prev) => ({ ...prev, authorRole: event.target.value }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="composer-body">
                    Message
                  </label>
                  <textarea
                    id="composer-body"
                    value={composer.body}
                    onChange={(event) => setComposer((prev) => ({ ...prev, body: event.target.value }))}
                    required
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                {feedback ? <p className="mt-2 text-sm text-emerald-600">{feedback}</p> : null}
                {error ? (
                  <p className="mt-2 text-sm text-rose-600">{error.message ?? 'Unable to send message.'}</p>
                ) : null}
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {saving ? 'Sending…' : 'Send message'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setComposer({ authorName: '', authorRole: '', body: '' })}
                    className="text-sm font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              Select a conversation to view messages.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

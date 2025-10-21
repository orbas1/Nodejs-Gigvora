import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { formatDate } from './helpers.js';

export default function ChatTab({ conversations, manager, disabled = false, readOnlyReason, loading = false }) {
  const [selectedId, setSelectedId] = useState(null);
  const [messageDraft, setMessageDraft] = useState({ authorName: '', body: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const sortedConversations = useMemo(() => {
    return Array.isArray(conversations)
      ? [...conversations].sort((a, b) => {
          const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
          if (priorityDiff !== 0) {
            return priorityDiff;
          }
          return new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime();
        })
      : [];
  }, [conversations]);

  useEffect(() => {
    if (!selectedId && sortedConversations.length) {
      setSelectedId(sortedConversations[0].id);
      return;
    }
    if (selectedId) {
      const exists = sortedConversations.some((conversation) => conversation.id === selectedId);
      if (!exists && sortedConversations.length) {
        setSelectedId(sortedConversations[0].id);
      }
    }
  }, [selectedId, sortedConversations]);

  const activeConversation = sortedConversations.find((conversation) => conversation.id === selectedId) ?? null;
  const effectiveDisabled = disabled || loading;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!activeConversation || effectiveDisabled) {
      return;
    }
    setSending(true);
    setError(null);
    try {
      await manager.postConversationMessage(activeConversation.id, {
        authorName: messageDraft.authorName || undefined,
        body: messageDraft.body,
      });
      setMessageDraft({ authorName: '', body: '' });
    } catch (sendError) {
      setError(sendError?.message ?? 'Unable to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px,1fr]" aria-busy={loading}>
      <aside className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">In-project conversations</h3>
        <div className="rounded-2xl border border-slate-200 bg-white">
          {sortedConversations.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">No conversations yet. Seed discussions from kickoff or client chat.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {sortedConversations.map((conversation) => (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(conversation.id)}
                    className={`block w-full text-left ${
                      conversation.id === selectedId
                        ? 'bg-blue-50/70'
                        : 'bg-white hover:bg-slate-50'
                    } px-4 py-3`}
                  >
                    <p className="text-sm font-semibold text-slate-800">{conversation.subject ?? 'Conversation'}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {conversation.lastMessagePreview ?? 'No messages yet'}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                      <span>{formatDate(conversation.updatedAt, { withTime: true })}</span>
                      {conversation.priority ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-rose-600">
                          Priority
                        </span>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <section className="flex flex-col rounded-3xl border border-slate-200 bg-white">
        {activeConversation ? (
          <>
            <header className="border-b border-slate-100 px-6 py-4">
              <p className="text-lg font-semibold text-slate-900">{activeConversation.subject ?? 'Conversation'}</p>
              <p className="mt-1 text-xs text-slate-500">
                Last activity {formatDate(activeConversation.updatedAt, { withTime: true })}
              </p>
            </header>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
              {(activeConversation.messages ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">No messages posted yet. Start the discussion below.</p>
              ) : (
                activeConversation.messages.map((message) => (
                  <article key={message.id ?? message.postedAt} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{message.authorName ?? 'Workspace bot'}</span>
                      <span>{formatDate(message.postedAt, { withTime: true })}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{message.body}</p>
                  </article>
                ))
              )}
            </div>
            <footer className="border-t border-slate-100 px-6 py-4">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  {readOnlyReason && disabled ? (
                    <span className="font-semibold uppercase tracking-wide text-amber-600">{readOnlyReason}</span>
                  ) : null}
                  {loading ? (
                    <span className="text-slate-500" aria-live="polite">
                      Syncing latest messages…
                    </span>
                  ) : null}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <label htmlFor="messageAuthor" className="text-sm font-medium text-slate-700">
                      Author name
                    </label>
                    <input
                      id="messageAuthor"
                      value={messageDraft.authorName}
                      onChange={(event) => setMessageDraft((prev) => ({ ...prev, authorName: event.target.value }))}
                      placeholder="Optional"
                      disabled={effectiveDisabled}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="messageBody" className="text-sm font-medium text-slate-700">
                      Message
                    </label>
                    <textarea
                      id="messageBody"
                      value={messageDraft.body}
                      onChange={(event) => setMessageDraft((prev) => ({ ...prev, body: event.target.value }))}
                      required
                      rows={3}
                      disabled={effectiveDisabled}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                </div>
                {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={sending || effectiveDisabled}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? 'Syncing…' : sending ? 'Sending…' : 'Send message'}
                  </button>
                </div>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 py-10 text-sm text-slate-500">
            Select a conversation to view the message history.
          </div>
        )}
      </section>
    </div>
  );
}

ChatTab.propTypes = {
  conversations: PropTypes.array,
  manager: PropTypes.shape({ postConversationMessage: PropTypes.func.isRequired }).isRequired,
  disabled: PropTypes.bool,
  readOnlyReason: PropTypes.string,
  loading: PropTypes.bool,
};

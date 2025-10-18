import { useMemo } from 'react';
import {
  ArrowsPointingOutIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  Squares2X2Icon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import ConversationMessage from '../../../../../components/messaging/ConversationMessage.jsx';
import { buildThreadTitle, formatThreadParticipants } from '../../../../../utils/messaging.js';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

export default function MessagePanel({
  thread,
  messages = [],
  composer,
  onComposerChange,
  onSend,
  sending,
  loading,
  error,
  onRefresh,
  quickReplies = [],
  onSelectQuickReply,
  onOpenPeople,
  onOpenSupport,
  onExpand,
  variant = 'inline',
  actorId,
}) {
  const participantNames = useMemo(() => formatThreadParticipants(thread, actorId), [thread, actorId]);

  const containerClasses = classNames(
    'flex h-full min-h-[32rem] w-full flex-col overflow-hidden',
    variant === 'inline'
      ? 'rounded-3xl bg-white/90 shadow-xl ring-1 ring-slate-100'
      : 'bg-white',
  );

  const headerClasses = classNames(
    'flex items-center justify-between border-b border-slate-100 px-5 py-4',
    variant === 'dialog' ? 'bg-white' : 'bg-white/80 backdrop-blur',
  );

  return (
    <section className={containerClasses}>
      <header className={headerClasses}>
        {thread ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{buildThreadTitle(thread)}</p>
            {participantNames.length ? (
              <p className="truncate text-xs text-slate-400">{participantNames.join(', ')}</p>
            ) : null}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {thread.channelType ? (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {thread.channelType}
                </span>
              ) : null}
              {thread.state ? (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {thread.state}
                </span>
              ) : null}
              {thread.supportCase?.status ? (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                  {thread.supportCase.status.replace(/_/g, ' ')}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="text-sm font-semibold text-slate-500">Pick a conversation</p>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPeople}
            disabled={!thread}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Participants"
          >
            <UsersIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onOpenSupport}
            disabled={!thread}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Support"
          >
            <Squares2X2Icon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRefresh}
            disabled={!thread || loading}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Refresh"
          >
            <ArrowPathIcon className={classNames('h-4 w-4', loading ? 'animate-spin' : '')} />
          </button>
          {variant === 'inline' ? (
            <button
              type="button"
              onClick={onExpand}
              disabled={!thread}
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Expand"
            >
              <ArrowsPointingOutIcon className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </header>
      <div className="flex-1 overflow-hidden bg-slate-50/60">
        {thread ? (
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-200" />
                  ))}
                </div>
              ) : messages.length ? (
                messages.map((message) => (
                  <ConversationMessage key={message.id} message={message} actorId={actorId} />
                ))
              ) : (
                <p className="text-sm text-slate-400">No messages yet</p>
              )}
            </div>
            {quickReplies.length ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-white px-5 py-3">
                {quickReplies.map((template) => (
                  <button
                    key={template.id ?? template.label}
                    type="button"
                    onClick={() => onSelectQuickReply?.(template)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-accent/40 hover:text-accent"
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            ) : null}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                onSend?.();
              }}
              className="border-t border-slate-100 bg-white px-5 py-4"
            >
              <div className="rounded-2xl border border-slate-200 bg-white">
                <textarea
                  rows={3}
                  value={composer}
                  onChange={(event) => onComposerChange?.(event.target.value)}
                  onKeyDown={(event) => {
                    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                      event.preventDefault();
                      onSend?.();
                    }
                  }}
                  className="block w-full resize-none rounded-2xl bg-transparent px-4 py-3 text-sm text-slate-700 focus:outline-none"
                  placeholder="Reply"
                />
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-2">
                  <button
                    type="submit"
                    disabled={!composer?.trim() || sending}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PaperAirplaneIcon className={classNames('h-4 w-4', sending ? 'animate-pulse' : '')} />
                    Send
                  </button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">Select a thread</div>
        )}
      </div>
      {error ? (
        <div className="border-t border-rose-200 bg-rose-50 px-4 py-2 text-center text-xs font-medium text-rose-600">{error}</div>
      ) : null}
    </section>
  );
}


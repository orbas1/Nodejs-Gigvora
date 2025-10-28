import { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { EllipsisHorizontalIcon, PaperAirplaneIcon, PhoneIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';

function formatTime(value) {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatDay(value) {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function MessageBubble({ message, isOwn }) {
  return (
    <div className={classNames('flex items-end gap-2', isOwn ? 'justify-end' : 'justify-start')}>
      {!isOwn ? (
        <img
          src={message.author?.avatarUrl ?? message.author?.photoUrl ?? message.author?.imageUrl ?? ''}
          alt=""
          className="h-9 w-9 rounded-full object-cover"
        />
      ) : null}
      <div
        className={classNames(
          'max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm',
          isOwn ? 'bg-accent text-white' : 'bg-slate-100 text-slate-700',
        )}
      >
        <p className="whitespace-pre-line leading-relaxed">{message.body}</p>
        <span className={classNames('mt-1 block text-[11px]', isOwn ? 'text-white/80' : 'text-slate-400')}>
          {formatTime(message.sentAt ?? message.createdAt ?? message.timestamp)}
        </span>
      </div>
      {isOwn ? (
        <img
          src={message.author?.avatarUrl ?? message.author?.photoUrl ?? message.author?.imageUrl ?? ''}
          alt=""
          className="h-9 w-9 rounded-full object-cover"
        />
      ) : null}
    </div>
  );
}

MessageBubble.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    body: PropTypes.string,
    sentAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    timestamp: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    author: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      avatarUrl: PropTypes.string,
      photoUrl: PropTypes.string,
      imageUrl: PropTypes.string,
    }),
  }).isRequired,
  isOwn: PropTypes.bool,
};

MessageBubble.defaultProps = {
  isOwn: false,
};

function buildTitle(thread) {
  if (!thread) {
    return 'Select a conversation';
  }

  if (thread.title) {
    return thread.title;
  }

  if (Array.isArray(thread.participants) && thread.participants.length > 0) {
    return thread.participants.map((participant) => participant.name ?? participant.email ?? 'Contact').join(', ');
  }

  return 'Conversation';
}

function buildMeta(thread) {
  if (!thread) {
    return '';
  }

  const items = [];

  if (thread.role) {
    items.push(thread.role);
  }

  if (thread.company) {
    items.push(thread.company);
  }

  if (thread.location) {
    items.push(thread.location);
  }

  return items.join(' · ');
}

export default function ConversationView({
  actorId,
  thread,
  messages,
  composerValue,
  onComposerChange,
  onSendMessage,
  sending,
}) {
  const listRef = useRef(null);
  const title = useMemo(() => buildTitle(thread), [thread]);
  const subtitle = useMemo(() => buildMeta(thread), [thread]);

  useEffect(() => {
    if (!listRef.current) {
      return;
    }

    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages?.length, thread?.id]);

  const safeMessages = useMemo(() => {
    if (Array.isArray(messages)) {
      return messages;
    }

    if (Array.isArray(thread?.messages)) {
      return thread.messages;
    }

    if (Array.isArray(thread?.messageHistory)) {
      return thread.messageHistory;
    }

    return [];
  }, [messages, thread?.messageHistory, thread?.messages]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!thread) {
      return;
    }

    const trimmed = composerValue?.trim();
    if (!trimmed) {
      return;
    }

    onSendMessage?.(trimmed);
  };

  if (!thread) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white/80 text-center">
        <h3 className="text-lg font-semibold text-slate-900">Select a conversation</h3>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Choose a thread from the inbox to see the latest messages and keep the conversation going.
        </p>
      </div>
    );
  }

  let lastDay = null;

  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white/90">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <img
            src={thread.avatarUrl ?? thread.participants?.[0]?.avatarUrl ?? ''}
            alt=""
            className="h-12 w-12 rounded-full object-cover"
          />
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-accent/40 hover:text-accent"
            aria-label="Start a voice call"
          >
            <PhoneIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-accent/40 hover:text-accent"
            aria-label="Start a video call"
          >
            <VideoCameraIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-accent/40 hover:text-accent"
            aria-label="Conversation options"
          >
            <EllipsisHorizontalIcon className="h-5 w-5" />
          </button>
        </div>
      </header>
      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
        {safeMessages.length === 0 ? (
          <p className="text-center text-sm text-slate-500">No messages yet. Say hello to get started.</p>
        ) : (
          safeMessages.map((message) => {
            const currentDay = formatDay(message.sentAt ?? message.createdAt ?? message.timestamp);
            const showDivider = currentDay && currentDay !== lastDay;
            lastDay = currentDay || lastDay;

            return (
              <div key={message.id ?? `${message.timestamp}-${message.body}`} className="space-y-3">
                {showDivider ? (
                  <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                    <span className="flex-1 border-t border-slate-200" aria-hidden="true" />
                    {currentDay}
                    <span className="flex-1 border-t border-slate-200" aria-hidden="true" />
                  </div>
                ) : null}
                <MessageBubble message={message} isOwn={`${message.author?.id}` === `${actorId}`} />
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={handleSubmit} className="border-t border-slate-200 px-6 py-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-inner">
          <textarea
            rows={2}
            value={composerValue}
            onChange={(event) => onComposerChange?.(event.target.value)}
            placeholder="Write a message"
            className="h-20 w-full resize-none border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-400">Press Enter to send</span>
            <button
              type="submit"
              disabled={sending || !composerValue?.trim()}
              className={classNames(
                'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
                sending || !composerValue?.trim()
                  ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                  : 'bg-accent text-white hover:bg-accent/90',
              )}
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              Send
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

ConversationView.propTypes = {
  actorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  thread: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    role: PropTypes.string,
    company: PropTypes.string,
    participants: PropTypes.array,
    messages: PropTypes.array,
    messageHistory: PropTypes.array,
    avatarUrl: PropTypes.string,
  }),
  messages: PropTypes.arrayOf(MessageBubble.propTypes.message),
  composerValue: PropTypes.string,
  onComposerChange: PropTypes.func,
  onSendMessage: PropTypes.func,
  sending: PropTypes.bool,
};

ConversationView.defaultProps = {
  actorId: null,
  thread: null,
  messages: undefined,
  composerValue: '',
  onComposerChange: undefined,
  onSendMessage: undefined,
  sending: false,
};

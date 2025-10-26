import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  BoltIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  LinkIcon,
  PhoneIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';
import VirtualizedMessageList from './VirtualizedMessageList.jsx';
import ConversationMessage from './ConversationMessage.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import AgoraCallPanel from './AgoraCallPanel.jsx';
import MessageComposerBar from './MessageComposerBar.jsx';
import {
  buildThreadTitle,
  formatThreadParticipants,
  formatReadReceiptSummary,
  formatTypingParticipants,
} from '../../utils/messaging.js';

function InsightCard({ icon: Icon, title, items, emptyLabel }) {
  if (!items?.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/60 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <Icon className="h-4 w-4" />
          <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
        </div>
        <p className="mt-2 text-xs text-slate-400">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
      </div>
      <ul className="mt-3 space-y-2 text-sm text-slate-600">
        {items.map((item, index) => (
          <li key={item.id ?? index} className="flex items-start gap-2">
            <span className="mt-0.5 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-accent" aria-hidden="true" />
            <span>{item.label ?? item.title ?? item.summary ?? item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

InsightCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  items: PropTypes.array,
  emptyLabel: PropTypes.string,
};

InsightCard.defaultProps = {
  items: [],
  emptyLabel: 'No items available yet.',
};

function mapToInsightItems(source, fallbackKey) {
  if (!source) {
    return [];
  }
  if (Array.isArray(source)) {
    return source
      .map((entry) => {
        if (typeof entry === 'string') {
          return { label: entry };
        }
        if (entry && typeof entry === 'object') {
          return {
            id: entry.id ?? entry[fallbackKey]?.id ?? entry.title,
            label: entry.label ?? entry.title ?? entry.summary ?? entry.text ?? entry[fallbackKey] ?? null,
          };
        }
        return null;
      })
      .filter(Boolean);
  }
  if (typeof source === 'object') {
    return Object.entries(source)
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => ({ id: key, label: typeof value === 'string' ? value : key }));
  }
  return [];
}

export default function ConversationView({
  actorId,
  thread,
  messages,
  messagesLoading,
  messagesError,
  hasMoreHistory,
  onLoadOlder,
  typingParticipants,
  onStartCall,
  onJoinCall,
  onCloseCall,
  callSession,
  callLoading,
  callError,
  composerValue,
  onComposerChange,
  onSendMessage,
  sending,
  savedReplies,
  savedRepliesLoading,
  onSavedReplyUsed,
}) {
  const disabled = !thread;
  const title = thread ? buildThreadTitle(thread, actorId) : 'Conversation';
  const participantSummary = thread ? formatThreadParticipants(thread, actorId).join(', ') : '';
  const readReceipts = useMemo(
    () => (thread ? formatReadReceiptSummary(thread.readReceipts, actorId) : null),
    [actorId, thread],
  );
  const typingSummary = useMemo(
    () => formatTypingParticipants(typingParticipants, actorId),
    [actorId, typingParticipants],
  );

  const highlights = useMemo(() => {
    if (!thread) {
      return [];
    }
    const primary =
      thread.metadata?.highlights ??
      thread.insights?.highlights ??
      thread.summary?.highlights ??
      (thread.summary ? [thread.summary] : []);
    const mapped = mapToInsightItems(primary, 'label');
    if (mapped.length) {
      return mapped.slice(0, 5);
    }
    const fallback = [];
    if (thread.subject) {
      fallback.push({ label: `Focus: ${thread.subject}` });
    }
    if (thread.lastMessagePreview) {
      fallback.push({ label: thread.lastMessagePreview });
    }
    return fallback;
  }, [thread]);

  const nextSteps = useMemo(() => {
    if (!thread) {
      return [];
    }
    const source =
      thread.metadata?.nextSteps ??
      thread.insights?.nextSteps ??
      thread.tasks ??
      thread.metadata?.actionItems ??
      [];
    const mapped = mapToInsightItems(source, 'title');
    if (mapped.length) {
      return mapped;
    }
    if (thread.metadata?.status === 'awaiting_response') {
      return [{ label: 'Awaiting partner response' }];
    }
    if (thread.metadata?.status === 'needs_action') {
      return [{ label: 'Action required from your team' }];
    }
    return [];
  }, [thread]);

  const documents = useMemo(() => {
    if (!thread) {
      return [];
    }
    const source =
      thread.metadata?.documents ??
      thread.metadata?.attachments ??
      thread.attachments ??
      [];
    const mapped = mapToInsightItems(source, 'title');
    if (mapped.length) {
      return mapped.map((item) => ({ ...item, href: item.url ?? item.href ?? item.link }));
    }
    return [];
  }, [thread]);

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-soft backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          {participantSummary ? <p className="text-xs text-slate-500">{participantSummary}</p> : null}
          {readReceipts ? (
            <p className="mt-1 text-[11px] text-slate-400">Read by {readReceipts}</p>
          ) : null}
          {typingSummary ? (
            <p className="mt-1 text-[11px] text-emerald-500">{typingSummary}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onStartCall('video')}
            disabled={disabled || callLoading || Boolean(callSession)}
            className={classNames(
              'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition',
              disabled || callLoading || Boolean(callSession)
                ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'border border-accent bg-accent text-white shadow-soft hover:border-accentDark hover:bg-accentDark',
            )}
          >
            <VideoCameraIcon className={classNames('h-4 w-4', callLoading ? 'animate-spin' : '')} />
            Start video
          </button>
          <button
            type="button"
            onClick={() => onStartCall('voice')}
            disabled={disabled || callLoading || Boolean(callSession)}
            className={classNames(
              'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition',
              disabled || callLoading || Boolean(callSession)
                ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-accent/60 hover:text-accent',
            )}
          >
            <PhoneIcon className={classNames('h-4 w-4', callLoading ? 'animate-spin' : '')} />
            Start voice
          </button>
        </div>
      </div>

      {callError ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-600" role="alert">
          {callError}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2.1fr),minmax(220px,1fr)]">
        <div className="space-y-4">
          {messagesError ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-600" role="alert">
              {messagesError}
            </p>
          ) : null}
          <VirtualizedMessageList
            messages={messages}
            hasMore={hasMoreHistory}
            onLoadMore={onLoadOlder}
            loading={messagesLoading}
            emptyState={
              disabled ? (
                <p className="text-sm text-slate-500">
                  Select a conversation to view the full timeline of approvals, decisions, and updates.
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  No messages yet. Share agendas, approvals, and updates to kick things off.
                </p>
              )
            }
            renderMessage={(message) => (
              <ConversationMessage
                key={message.id}
                message={message}
                actorId={actorId}
                onJoinCall={onJoinCall}
                joiningCall={callLoading}
                activeCallId={callSession?.callId ?? null}
              />
            )}
          />
          {typingParticipants?.length ? <TypingIndicator participants={typingParticipants} actorId={actorId} /> : null}
          {callSession ? <AgoraCallPanel session={callSession} onClose={onCloseCall} /> : null}
          <MessageComposerBar
            threadId={thread?.id ?? null}
            value={composerValue}
            onChange={onComposerChange}
            onSend={onSendMessage}
            sending={sending}
            disabled={disabled}
            savedReplies={savedReplies}
            loadingSavedReplies={savedRepliesLoading}
            messageError={messagesError}
            onSavedReplyUsed={onSavedReplyUsed}
          />
        </div>
        <aside className="space-y-3">
          <InsightCard
            icon={InformationCircleIcon}
            title="Highlights"
            items={highlights}
            emptyLabel="Insights appear once conversations gather momentum."
          />
          <InsightCard
            icon={CheckCircleIcon}
            title="Next steps"
            items={nextSteps}
            emptyLabel="Track decisions, approvals, and owners as workstreams evolve."
          />
          <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <DocumentTextIcon className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wide">Resources</p>
            </div>
            {documents.length ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {documents.map((document, index) => (
                  <li key={document.id ?? document.href ?? index} className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-accent" />
                    {document.href ? (
                      <a
                        href={document.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-accent transition hover:text-accentDark"
                      >
                        {document.label ?? document.title ?? document.href}
                      </a>
                    ) : (
                      <span>{document.label ?? document.title}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-slate-400">Attach links and shared folders to keep everyone aligned.</p>
            )}
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-slate-500">
              <CalendarDaysIcon className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wide">Conversation health</p>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-slate-500">
              <li className="flex items-center gap-2">
                <ClockIcon className="h-3.5 w-3.5 text-emerald-500" />
                {thread?.metadata?.avgResponseMinutes
                  ? `Avg response ${Math.round(thread.metadata.avgResponseMinutes)} minutes`
                  : 'No response-time benchmarks yet'}
              </li>
              <li className="flex items-center gap-2">
                <BoltIcon className="h-3.5 w-3.5 text-amber-500" />
                {thread?.priority === 'high' || thread?.state === 'escalated'
                  ? 'Escalation active — keep leadership informed.'
                  : 'Tracking well — no escalations flagged.'}
              </li>
              <li className="flex items-center gap-2">
                <DocumentTextIcon className="h-3.5 w-3.5 text-slate-400" />
                {documents.length
                  ? `${documents.length} linked resources available.`
                  : 'Link critical docs to power future reviews.'}
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

ConversationView.propTypes = {
  actorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  thread: PropTypes.object,
  messages: PropTypes.arrayOf(PropTypes.object),
  messagesLoading: PropTypes.bool,
  messagesError: PropTypes.string,
  hasMoreHistory: PropTypes.bool,
  onLoadOlder: PropTypes.func,
  typingParticipants: PropTypes.array,
  onStartCall: PropTypes.func,
  onJoinCall: PropTypes.func,
  onCloseCall: PropTypes.func,
  callSession: PropTypes.object,
  callLoading: PropTypes.bool,
  callError: PropTypes.string,
  composerValue: PropTypes.string,
  onComposerChange: PropTypes.func,
  onSendMessage: PropTypes.func,
  sending: PropTypes.bool,
  savedReplies: PropTypes.array,
  savedRepliesLoading: PropTypes.bool,
  onSavedReplyUsed: PropTypes.func,
};

ConversationView.defaultProps = {
  actorId: null,
  thread: null,
  messages: [],
  messagesLoading: false,
  messagesError: null,
  hasMoreHistory: false,
  onLoadOlder: () => {},
  typingParticipants: [],
  onStartCall: () => {},
  onJoinCall: () => {},
  onCloseCall: () => {},
  callSession: null,
  callLoading: false,
  callError: null,
  composerValue: '',
  onComposerChange: () => {},
  onSendMessage: () => Promise.resolve(),
  sending: false,
  savedReplies: [],
  savedRepliesLoading: false,
  onSavedReplyUsed: null,
};

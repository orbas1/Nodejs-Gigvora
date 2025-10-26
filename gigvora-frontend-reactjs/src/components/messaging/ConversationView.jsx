import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  PhoneIcon,
  VideoCameraIcon,
  ChartBarIcon,
  InboxStackIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

import VirtualizedMessageList from './VirtualizedMessageList.jsx';
import ConversationMessage from './ConversationMessage.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import AgoraCallPanel from './AgoraCallPanel.jsx';
import MessageComposerBar from './MessageComposerBar.jsx';
import { classNames } from '../../utils/classNames.js';
import {
  buildThreadTitle,
  formatThreadParticipants,
  formatReadReceiptSummary,
  messageBelongsToUser,
} from '../../utils/messaging.js';

function computeConversationInsights(messages, actorId) {
  let responseSamples = 0;
  let totalResponseMs = 0;
  let attachmentCount = 0;
  let lastExternalMessage = null;

  messages.forEach((message, index) => {
    if (Array.isArray(message.attachments)) {
      attachmentCount += message.attachments.length;
    }
    if (!messageBelongsToUser(message, actorId)) {
      lastExternalMessage = message;
    }
    if (index === 0) {
      return;
    }
    const previous = messages[index - 1];
    if (message.senderId === previous.senderId) {
      return;
    }
    const currentTime = new Date(message.createdAt).getTime();
    const previousTime = new Date(previous.createdAt).getTime();
    if (!Number.isFinite(currentTime) || !Number.isFinite(previousTime)) {
      return;
    }
    if (currentTime <= previousTime) {
      return;
    }
    responseSamples += 1;
    totalResponseMs += currentTime - previousTime;
  });

  const averageResponseMinutes = responseSamples > 0 ? Math.round(totalResponseMs / responseSamples / 60000) : null;

  return {
    averageResponseMinutes,
    attachmentCount,
    lastExternalMessage,
    totalMessages: messages.length,
  };
}

export default function ConversationView({
  thread,
  actorId,
  messages,
  messagesLoading,
  messagesError,
  hasMoreHistory,
  onLoadMore,
  typingParticipants,
  composerValue,
  onComposerChange,
  onSend,
  sending,
  onStartCall,
  callSession,
  callLoading,
  callError,
  onJoinCall,
  onCloseCall,
  savedReplies,
  onInsertSavedReply,
  onShare,
}) {
  const participants = useMemo(() => formatThreadParticipants(thread, actorId), [thread, actorId]);
  const conversationTitle = useMemo(() => buildThreadTitle(thread, actorId), [thread, actorId]);
  const insights = useMemo(() => computeConversationInsights(messages, actorId), [messages, actorId]);
  const readReceipts = useMemo(
    () => formatReadReceiptSummary(thread?.readReceipts ?? thread?.viewerReceipts ?? [], actorId),
    [thread?.readReceipts, thread?.viewerReceipts, actorId],
  );

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{conversationTitle}</h2>
          <p className="text-xs text-slate-500">{participants.join(', ')}</p>
          {readReceipts ? (
            <p className="mt-1 text-[11px] text-slate-400">Read by {readReceipts}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onStartCall?.('video')}
            disabled={callLoading || Boolean(callSession)}
            className={classNames(
              'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              callLoading || callSession
                ? 'border border-slate-200 bg-slate-100 text-slate-400'
                : 'border border-accent bg-accent text-white hover:border-accentDark hover:bg-accentDark',
            )}
          >
            <VideoCameraIcon className={classNames('h-4 w-4', callLoading ? 'animate-spin' : '')} /> Start video call
          </button>
          <button
            type="button"
            onClick={() => onStartCall?.('voice')}
            disabled={callLoading || Boolean(callSession)}
            className={classNames(
              'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              callLoading || callSession
                ? 'border border-slate-200 bg-slate-100 text-slate-400'
                : 'border border-slate-200 bg-white text-slate-700 hover:border-accent/60 hover:text-accent',
            )}
          >
            <PhoneIcon className={classNames('h-4 w-4', callLoading ? 'animate-spin' : '')} /> Start voice call
          </button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <ChartBarIcon className="h-4 w-4" /> Response time
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {insights.averageResponseMinutes !== null ? `${insights.averageResponseMinutes} min avg` : 'Collecting data'}
          </p>
          <p className="text-xs text-slate-500">Across {insights.totalMessages} messages in this view.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <DocumentArrowDownIcon className="h-4 w-4" /> Shared files
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-900">{insights.attachmentCount}</p>
          <p className="text-xs text-slate-500">Documents and media shared in the last 30 messages.</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <InboxStackIcon className="h-4 w-4" /> Latest client activity
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {insights.lastExternalMessage?.createdAt
              ? new Date(insights.lastExternalMessage.createdAt).toLocaleString()
              : 'Awaiting reply'}
          </p>
          <p className="text-xs text-slate-500">Last message from collaborators.</p>
        </div>
      </section>

      {callError ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-600" role="alert">
          {callError}
        </p>
      ) : null}
      {messagesError ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-600" role="alert">
          {messagesError}
        </p>
      ) : null}

      <VirtualizedMessageList
        messages={messages}
        hasMore={hasMoreHistory}
        onLoadMore={onLoadMore}
        loading={messagesLoading}
        emptyState={
          <p className="text-sm text-slate-500">
            No messages yet. Share agendas, approvals, and updates to kick things off.
          </p>
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
        value={composerValue}
        onChange={onComposerChange}
        onSubmit={onSend}
        disabled={!thread?.id || sending}
        sending={sending}
        placeholder={thread?.id ? 'Write your reply…' : 'Select a conversation to reply.'}
        onShare={onShare}
        savedReplies={savedReplies}
        onInsertSavedReply={onInsertSavedReply}
      />
    </div>
  );
}

ConversationView.propTypes = {
  thread: PropTypes.object,
  actorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  messages: PropTypes.arrayOf(PropTypes.object).isRequired,
  messagesLoading: PropTypes.bool,
  messagesError: PropTypes.string,
  hasMoreHistory: PropTypes.bool,
  onLoadMore: PropTypes.func,
  typingParticipants: PropTypes.arrayOf(PropTypes.object),
  composerValue: PropTypes.string.isRequired,
  onComposerChange: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  sending: PropTypes.bool,
  onStartCall: PropTypes.func,
  callSession: PropTypes.object,
  callLoading: PropTypes.bool,
  callError: PropTypes.string,
  onJoinCall: PropTypes.func,
  onCloseCall: PropTypes.func,
  savedReplies: PropTypes.arrayOf(PropTypes.object),
  onInsertSavedReply: PropTypes.func,
  onShare: PropTypes.func,
};

ConversationView.defaultProps = {
  thread: null,
  actorId: null,
  messagesLoading: false,
  messagesError: null,
  hasMoreHistory: false,
  onLoadMore: null,
  typingParticipants: null,
  sending: false,
  onStartCall: null,
  callSession: null,
  callLoading: false,
  callError: null,
  onJoinCall: null,
  onCloseCall: null,
  savedReplies: null,
  onInsertSavedReply: null,
  onShare: null,
};

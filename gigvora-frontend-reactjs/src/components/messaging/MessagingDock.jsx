import { useCallback, useEffect, useState } from 'react';
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  VideoCameraIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import useSession from '../../hooks/useSession.js';
import ConversationMessage from './ConversationMessage.jsx';
import AgoraCallPanel from './AgoraCallPanel.jsx';
import { classNames } from '../../utils/classNames.js';
import { useMessagingStore } from '../../context/MessagingContext.jsx';
import { canAccessMessaging } from '../../constants/access.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import VirtualizedMessageList from './VirtualizedMessageList.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import { buildThreadTitle, formatThreadParticipants, isThreadUnread, describeLastActivity } from '../../utils/messaging.js';

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'flex-1 rounded-full px-3 py-2 text-sm font-semibold transition',
        active ? 'bg-accent text-white shadow-soft' : 'text-slate-600 hover:bg-slate-100',
      )}
    >
      {children}
    </button>
  );
}

function ThreadListItem({ thread, actorId, active, onSelect }) {
  const title = buildThreadTitle(thread, actorId);
  const participants = formatThreadParticipants(thread, actorId);
  const unread = isThreadUnread(thread);
  const lastActivity = describeLastActivity(thread);

  return (
    <button
      type="button"
      onClick={() => onSelect(thread.id)}
      className={classNames(
        'flex w-full flex-col rounded-3xl border px-4 py-3 text-left transition',
        active
          ? 'border-accent bg-accentSoft shadow-soft'
          : unread
          ? 'border-slate-200 bg-white shadow-sm hover:border-accent/60'
          : 'border-slate-200 bg-white hover:border-accent/60',
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <span className="text-xs text-slate-400">{lastActivity}</span>
      </div>
      {participants.length ? (
        <p className="mt-1 text-xs text-slate-500">{participants.join(', ')}</p>
      ) : null}
      {thread.lastMessagePreview ? (
        <p
          data-testid={`thread-preview-${thread.id}`}
          className="mt-2 text-sm text-slate-600 line-clamp-2"
        >
          {thread.lastMessagePreview}
        </p>
      ) : null}
      {unread ? (
        <span className="mt-3 inline-flex w-fit items-center rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Unread
        </span>
      ) : null}
    </button>
  );
}

export default function MessagingDock() {
  const { session, isAuthenticated } = useSession();
  const { t } = useLanguage();
  const {
    threads,
    threadsLoading,
    threadsAppending,
    threadsError,
    hasMoreThreads,
    selectedThreadId,
    selectThread,
    loadThreads,
    messages,
    messagesLoading,
    messagesError,
    sendMessage,
    startCall,
    closeCall,
    callState,
    composerDraft,
    setComposerDraft,
    typingParticipants,
    notifyTyping,
    readReceipts,
    actorId,
    canUseMessaging,
  } = useMessagingStore();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('inbox');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  const canUseDockMessaging = Boolean(isAuthenticated && actorId && canAccessMessaging(session) && canUseMessaging);

  useEffect(() => {
    if (!open || !canUseDockMessaging) {
      return;
    }
    if (!threads.length) {
      void loadThreads({ append: false, preserveSelection: true, silent: false });
    }
  }, [open, canUseDockMessaging, loadThreads, threads.length]);

  useEffect(() => {
    if (!open || tab !== 'inbox' || !selectedThreadId || !composerDraft.trim()) {
      return;
    }
    notifyTyping(selectedThreadId);
  }, [open, tab, selectedThreadId, composerDraft, notifyTyping]);

  const handleToggle = useCallback(() => {
    setOpen((previous) => !previous);
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  const handleSend = useCallback(
    async (event) => {
      event.preventDefault();
      if (!composerDraft.trim() || !selectedThreadId || !canUseDockMessaging) {
        return;
      }
      setSending(true);
      setSendError(null);
      try {
        await sendMessage(selectedThreadId, { body: composerDraft });
      } catch (error) {
        setSendError(error?.body?.message ?? error?.message ?? 'Unable to send message.');
      } finally {
        setSending(false);
      }
    },
    [composerDraft, selectedThreadId, canUseDockMessaging, sendMessage],
  );

  const handleStartCall = useCallback(
    async (type, callId) => {
      if (!selectedThreadId) {
        return;
      }
      await startCall(selectedThreadId, { callType: type, callId });
    },
    [selectedThreadId, startCall],
  );

  const handleJoinCall = useCallback(
    (callMetadata) => {
      if (!callMetadata?.id) {
        return;
      }
      void handleStartCall(callMetadata?.type ?? 'video', callMetadata.id);
    },
    [handleStartCall],
  );

  const callSession = callState.session;
  const callLoading = callState.loading;
  const callError = callState.error;

  const loadMoreThreads = useCallback(() => {
    if (!hasMoreThreads || threadsLoading || threadsAppending) {
      return;
    }
    void loadThreads({ append: true, preserveSelection: true, silent: false });
  }, [hasMoreThreads, threadsLoading, threadsAppending, loadThreads]);

  const refreshInbox = useCallback(() => {
    void loadThreads({ append: false, preserveSelection: true, silent: false });
  }, [loadThreads]);

  const inboxSubtitle =
    tab === 'inbox'
      ? t('assistants.messaging.subtitle', 'Secure messaging, calls, and files for every workspace.')
      : t('assistants.messaging.supportSubtitle', 'Switch to the trust centre for ticket analytics and SLAs.');

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
      {open ? (
        <div className="w-96 max-w-full rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-400/20">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {tab === 'inbox'
                  ? t('assistants.messaging.inboxTab', 'Inbox')
                  : t('assistants.messaging.supportTab', 'Support chat')}
              </p>
              <p className="text-xs text-slate-500">{inboxSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              aria-label="Close messaging"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 px-4 py-3">
            <TabButton active={tab === 'inbox'} onClick={() => setTab('inbox')}>
              {t('assistants.messaging.inboxTab', 'Inbox')}
            </TabButton>
            <TabButton active={tab === 'support'} onClick={() => setTab('support')}>
              {t('assistants.messaging.supportTab', 'Support')}
            </TabButton>
          </div>
          {tab === 'inbox' ? (
            <div className="px-4 pb-4">
              {canUseDockMessaging ? (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    {t('assistants.messaging.syncedCopy', 'Synced across dashboards for teams and partners.')}
                  </p>
                  <button
                    type="button"
                    onClick={refreshInbox}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
                    disabled={threadsLoading}
                  >
                    <ArrowPathIcon className={classNames('h-3.5 w-3.5', threadsLoading ? 'animate-spin' : '')} />
                    {t('assistants.messaging.refresh', 'Refresh')}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  {t(
                    'assistants.messaging.signInPrompt',
                    'Sign in to view your organisation inbox, start calls, and collaborate in real time.',
                  )}
                </p>
              )}
              <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,0.9fr),minmax(0,1.4fr)]">
                <div className="space-y-3">
                  {threadsError ? (
                    <p className="rounded-2xl bg-rose-50 px-4 py-3 text-xs text-rose-600">{threadsError}</p>
                  ) : null}
                  {threadsLoading && !threads.length ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-20 rounded-3xl bg-slate-100" />
                      ))}
                    </div>
                  ) : threads.length ? (
                    threads.map((thread) => (
                      <ThreadListItem
                        key={thread.id}
                        thread={thread}
                        actorId={actorId}
                        active={thread.id === selectedThreadId}
                        onSelect={selectThread}
                      />
                    ))
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                      {t(
                        'assistants.messaging.emptyThreads',
                        'Start a conversation with collaborators or clients. Threads appear here once you create them.',
                      )}
                    </div>
                  )}
                  {threads.length > 0 && hasMoreThreads ? (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={loadMoreThreads}
                        className="w-full rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
                        disabled={threadsAppending}
                      >
                        <ArrowPathIcon
                          className={classNames('mr-1 inline h-3.5 w-3.5 align-middle', threadsAppending ? 'animate-spin' : '')}
                        />
                        {threadsAppending
                          ? t('assistants.messaging.loadingOlder', 'Loading more conversations…')
                          : t('assistants.messaging.loadOlder', 'Load older conversations')}
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
                  {selectedThreadId ? (
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {buildThreadTitle(threads.find((thread) => thread.id === selectedThreadId), actorId)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatThreadParticipants(
                          threads.find((thread) => thread.id === selectedThreadId) ?? {},
                          actorId,
                        ).join(', ') || t('assistants.messaging.privateNotes', 'Private notes')}
                      </p>
                    </div>
                  ) : null}
                  {callError ? (
                    <p className="rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-600">{callError}</p>
                  ) : null}
                  {messagesError ? (
                    <p className="rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-600">{messagesError}</p>
                  ) : null}
                  {messagesLoading && !messages.length ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-16 rounded-2xl bg-slate-100" />
                      ))}
                    </div>
                  ) : null}
                  {!messagesLoading && !messagesError && !messages.length ? (
                    <p className="text-sm text-slate-500">
                      {t(
                        'assistants.messaging.emptyConversation',
                        'No messages yet. Share agendas, approvals, and updates to kick things off.',
                      )}
                    </p>
                  ) : null}
                  <VirtualizedMessageList
                    items={messages}
                    className="max-h-72 pr-1"
                    renderRow={(message) => (
                      <div className="pb-3">
                        <ConversationMessage
                          key={message.id}
                          message={message}
                          actorId={actorId}
                          onJoinCall={handleJoinCall}
                          joiningCall={callLoading}
                          activeCallId={callSession?.callId ?? null}
                          receipts={readReceipts}
                        />
                      </div>
                    )}
                  />
                  {typingParticipants.length ? (
                    <TypingIndicator participants={typingParticipants} />
                  ) : null}
                  {callSession ? <AgoraCallPanel session={callSession} onClose={closeCall} /> : null}
                  <form className="space-y-3" onSubmit={handleSend}>
                    <textarea
                      rows={3}
                      value={composerDraft}
                      onChange={(event) => setComposerDraft(selectedThreadId, event.target.value)}
                      disabled={!selectedThreadId || sending}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                      placeholder={selectedThreadId ? t('assistants.messaging.replyPlaceholder', 'Write your reply…') : t('assistants.messaging.selectThread', 'Select a conversation to reply.')}
                    />
                    {sendError ? (
                      <p className="rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-600" role="alert">
                        {sendError}
                      </p>
                    ) : null}
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="submit"
                        disabled={!selectedThreadId || !composerDraft.trim() || sending}
                        className={classNames(
                          'inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition',
                          !selectedThreadId || !composerDraft.trim() || sending
                            ? 'cursor-not-allowed opacity-60'
                            : 'hover:bg-accentDark',
                        )}
                      >
                        <PaperAirplaneIcon className="h-4 w-4" />
                        {t('assistants.messaging.send', 'Send')}
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartCall('video')}
                          className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-accent/60 hover:text-accent"
                          disabled={!selectedThreadId || callLoading || Boolean(callSession)}
                          aria-label={t('assistants.messaging.videoCall', 'Start video call')}
                        >
                          <VideoCameraIcon className={classNames('h-4 w-4', callLoading ? 'animate-spin' : '')} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartCall('voice')}
                          className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-accent/60 hover:text-accent"
                          disabled={!selectedThreadId || callLoading || Boolean(callSession)}
                          aria-label={t('assistants.messaging.voiceCall', 'Start voice call')}
                        >
                          <PhoneIcon className={classNames('h-4 w-4', callLoading ? 'animate-spin' : '')} />
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 pb-4">
              <p className="text-xs text-slate-500">
                {t(
                  'assistants.messaging.supportPlaceholder',
                  'Open the trust centre dashboard to view ticket analytics, automations, and SLA tracking.',
                )}
              </p>
            </div>
          )}
        </div>
      ) : null}
      <button
        type="button"
        onClick={handleToggle}
        className={classNames(
          'flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-400/30 transition',
          open ? 'opacity-90 hover:opacity-100' : 'hover:bg-accentDark',
        )}
        aria-expanded={open}
      >
        <ChatBubbleLeftRightIcon className="h-4 w-4" />
        {open ? t('assistants.messaging.hide', 'Hide messages') : t('assistants.messaging.show', 'Show messages')}
      </button>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader.jsx';
import useSession from '../hooks/useSession.js';
import {
  buildThreadTitle,
  formatThreadParticipants,
  isThreadUnread,
  describeLastActivity,
  sortThreadsByActivity,
} from '../utils/messaging.js';
import ConversationMessage from '../components/messaging/ConversationMessage.jsx';
import AgoraCallPanel from '../components/messaging/AgoraCallPanel.jsx';
import { classNames } from '../utils/classNames.js';
import { canAccessMessaging, getMessagingMemberships, MESSAGING_ALLOWED_MEMBERSHIPS } from '../constants/access.js';
import { DASHBOARD_LINKS } from '../constants/dashboardLinks.js';
import { useMessagingStore } from '../context/MessagingContext.jsx';
import VirtualizedMessageList from '../components/messaging/VirtualizedMessageList.jsx';
import TypingIndicator from '../components/messaging/TypingIndicator.jsx';

export const INBOX_REFRESH_INTERVAL = 60_000;

export function sortThreads(threads = []) {
  return sortThreadsByActivity(threads);
}

export function formatMembershipLabel(key) {
  return DASHBOARD_LINKS[key]?.label ?? key.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ThreadCard({ thread, actorId, onSelect, selected }) {
  const title = buildThreadTitle(thread, actorId);
  const participants = formatThreadParticipants(thread, actorId);
  const unread = isThreadUnread(thread);
  const activity = describeLastActivity(thread);

  return (
    <button
      type="button"
      onClick={() => onSelect(thread.id)}
      className={classNames(
        'w-full rounded-3xl border px-5 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        selected
          ? 'border-accent bg-accentSoft shadow-soft'
          : unread
          ? 'border-slate-200 bg-white shadow-sm hover:border-accent/60'
          : 'border-slate-200 bg-white hover:border-accent/60',
      )}
      aria-pressed={selected}
      aria-label={`Open conversation ${title}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <span className="text-xs text-slate-400">{activity}</span>
      </div>
      {participants.length ? (
        <p className="mt-1 text-xs text-slate-500">{participants.join(', ')}</p>
      ) : null}
      {thread.lastMessagePreview ? (
        <p className="mt-2 text-sm text-slate-600 line-clamp-2">{thread.lastMessagePreview}</p>
      ) : null}
      {unread ? (
        <span className="mt-3 inline-flex items-center rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Unread
        </span>
      ) : null}
    </button>
  );
}

export default function InboxPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const messagingMemberships = useMemo(() => getMessagingMemberships(session), [session]);
  const allowedMembershipLabels = useMemo(
    () => messagingMemberships.map((membership) => formatMembershipLabel(membership)),
    [messagingMemberships],
  );
  const allowedRoleCatalog = useMemo(
    () => MESSAGING_ALLOWED_MEMBERSHIPS.map((membership) => formatMembershipLabel(membership)),
    [],
  );
  const hasMessagingAccess = useMemo(() => canAccessMessaging(session), [session]);

  const {
    threads,
    threadsLoading,
    threadsError,
    hasMoreThreads,
    selectedThreadId,
    selectThread,
    loadThreads,
    messages,
    messagesLoading,
    messagesError,
    callState,
    sendMessage,
    startCall,
    closeCall,
    composerDraft,
    setComposerDraft,
    typingParticipants,
    notifyTyping,
    readReceipts,
    actorId,
    canUseMessaging,
    refreshPresence,
  } = useMessagingStore();

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [threads, selectedThreadId],
  );

  const handleRefreshThreads = useCallback(() => {
    void loadThreads({ append: false, preserveSelection: true, silent: false });
  }, [loadThreads]);

  const handleSend = useCallback(
    async (event) => {
      event.preventDefault();
      if (!composerDraft.trim() || !selectedThreadId || !canUseMessaging) {
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
    [composerDraft, selectedThreadId, canUseMessaging, sendMessage],
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

  useEffect(() => {
    if (!selectedThreadId || !composerDraft.trim()) {
      return;
    }
    notifyTyping(selectedThreadId);
  }, [selectedThreadId, composerDraft, notifyTyping]);

  const callSession = callState.session;
  const callLoading = callState.loading;
  const callError = callState.error;

  if (isAuthenticated && !hasMessagingAccess) {
    return (
      <section className="relative overflow-hidden py-20">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]"
          aria-hidden="true"
        />
        <div className="absolute -left-12 bottom-6 h-72 w-72 rounded-full bg-emerald-200/40 blur-[120px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-6">
          <PageHeader
            eyebrow="Messaging"
            title="Inbox access pending"
            description="Your account doesn’t currently have an active messaging workspace. Update your memberships or contact Gigvora support to enable secure communications."
            actions={
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent/60 hover:text-accent"
              >
                Manage memberships
              </button>
            }
          />
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
            <h2 className="text-base font-semibold text-slate-900">Workspaces with messaging enabled</h2>
            <p className="mt-2 text-sm text-slate-600">
              Messaging is available to team, talent, and partner roles. Ask an administrator to add one of the roles below to your account.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {allowedRoleCatalog.length ? (
                allowedRoleCatalog.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">Messaging roles are configured by workspace administrators.</span>
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/feed')}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
              >
                Return to feed
              </button>
              <a
                href="mailto:support@gigvora.com"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
              >
                Contact support
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]" aria-hidden="true" />
      <div className="absolute -left-12 bottom-6 h-72 w-72 rounded-full bg-emerald-200/40 blur-[120px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <PageHeader
          eyebrow="Messaging"
          title="Centralised inbox"
          description="Secure messaging, enterprise-grade calling, and approvals across every workspace."
          actions={
            <button
              type="button"
              onClick={handleRefreshThreads}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
              disabled={threadsLoading}
            >
              <ChatBubbleLeftRightIcon className={classNames('h-4 w-4', threadsLoading ? 'animate-spin' : '')} /> Refresh inbox
            </button>
          }
        />
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(260px,0.8fr),minmax(0,2fr)]">
          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">{session?.name ?? 'Gigvora member'}</p>
              <p className="text-xs text-slate-500">Inbox syncs across dashboards, client portals, and partner workspaces.</p>
              {allowedMembershipLabels.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {allowedMembershipLabels.map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Threads</p>
                <button
                  type="button"
                  onClick={handleRefreshThreads}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
                  disabled={threadsLoading}
                >
                  <ArrowPathIcon className={classNames('h-4 w-4', threadsLoading ? 'animate-spin' : '')} /> Sync
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {threadsError ? (
                  <p className="rounded-3xl bg-rose-50 px-4 py-3 text-xs text-rose-600" role="alert">
                    {threadsError}
                  </p>
                ) : null}
                {threadsLoading && !threads.length ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="h-20 rounded-3xl bg-slate-100" />
                    ))}
                  </div>
                ) : threads.length ? (
                  threads.map((thread) => (
                    <ThreadCard
                      key={thread.id}
                      thread={thread}
                      actorId={actorId}
                      selected={selectedThreadId === thread.id}
                      onSelect={selectThread}
                    />
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    No conversations yet. Start a thread from any project or invite collaborators to connect.
                  </div>
                )}
                {threads.length > 0 && hasMoreThreads ? (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => loadThreads({ append: true, preserveSelection: true, silent: false })}
                      className="w-full rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
                      disabled={threadsLoading}
                    >
                      <ArrowPathIcon className={classNames('mr-1 inline h-3.5 w-3.5 align-middle', threadsLoading ? 'animate-spin' : '')} />
                      Load older conversations
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </aside>
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            {selectedThread ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{buildThreadTitle(selectedThread, actorId)}</p>
                  <p className="text-xs text-slate-500">{formatThreadParticipants(selectedThread, actorId).join(', ')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartCall('video')}
                    disabled={!selectedThreadId || callLoading || Boolean(callSession)}
                    className={classNames(
                      'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                      !selectedThreadId || callLoading || Boolean(callSession)
                        ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'border border-accent bg-accent text-white hover:border-accentDark hover:bg-accentDark',
                    )}
                  >
                    <VideoCameraIcon className={classNames('h-4 w-4', callLoading ? 'animate-spin' : '')} /> Start video
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartCall('voice')}
                    disabled={!selectedThreadId || callLoading || Boolean(callSession)}
                    className={classNames(
                      'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                      !selectedThreadId || callLoading || Boolean(callSession)
                        ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'border border-slate-200 bg-white text-slate-700 hover:border-accent/60 hover:text-accent',
                    )}
                  >
                    <PhoneIcon className={classNames('h-4 w-4', callLoading ? 'animate-spin' : '')} /> Start voice
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Select a conversation to view history, share documents, and launch calls.</p>
            )}
            {callError ? (
              <p className="rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-600" role="alert">
                {callError}
              </p>
            ) : null}
            <div className="flex min-h-[20rem] flex-col gap-4">
              {messagesError ? (
                <p className="rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-600" role="alert">
                  {messagesError}
                </p>
              ) : null}
              {messagesLoading && !messages.length ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-16 rounded-2xl bg-slate-100" />
                  ))}
                </div>
              ) : null}
              {!messagesLoading && !messagesError && !messages.length ? (
                <p className="text-sm text-slate-500">No messages yet. Share agendas, approvals, and updates to kick things off.</p>
              ) : null}
              <VirtualizedMessageList
                items={messages}
                className="max-h-[32rem] pr-2"
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
            </div>
            {typingParticipants.length ? (
              <TypingIndicator participants={typingParticipants} />
            ) : null}
            {callSession ? <AgoraCallPanel session={callSession} onClose={closeCall} /> : null}
            <form className="space-y-3" onSubmit={handleSend}>
              <textarea
                rows={4}
                value={composerDraft}
                onChange={(event) => setComposerDraft(selectedThreadId, event.target.value)}
                disabled={!selectedThreadId || sending}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                placeholder={selectedThreadId ? 'Write your reply…' : 'Select a conversation to reply.'}
              />
              {sendError ? (
                <p className="rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-600" role="alert">
                  {sendError}
                </p>
              ) : null}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!selectedThreadId || !composerDraft.trim() || sending}
                  className={classNames(
                    'inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition',
                    !selectedThreadId || !composerDraft.trim() || sending ? 'cursor-not-allowed opacity-60' : 'hover:bg-accentDark',
                  )}
                >
                  Send message
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
                  onClick={() => {
                    if (selectedThreadId) {
                      refreshPresence(selectedThreadId, { force: true });
                    }
                  }}
                  disabled={!selectedThreadId}
                >
                  Update presence
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

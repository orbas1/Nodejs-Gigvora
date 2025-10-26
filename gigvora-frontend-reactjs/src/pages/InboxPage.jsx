import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  VideoCameraIcon,
  StarIcon as StarOutlineIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import PageHeader from '../components/PageHeader.jsx';
import useSession from '../hooks/useSession.js';
import useMessaging from '../hooks/useMessaging.js';
import useFreelancerInboxWorkspace from '../hooks/useFreelancerInboxWorkspace.js';
import {
  buildThreadTitle,
  formatThreadParticipants,
  isThreadUnread,
  describeLastActivity,
  resolveActorId,
} from '../utils/messaging.js';
import ConversationMessage from '../components/messaging/ConversationMessage.jsx';
import AgoraCallPanel from '../components/messaging/AgoraCallPanel.jsx';
import TypingIndicator from '../components/messaging/TypingIndicator.jsx';
import VirtualizedMessageList from '../components/messaging/VirtualizedMessageList.jsx';
import { classNames } from '../utils/classNames.js';
import { getMessagingMemberships, MESSAGING_ALLOWED_MEMBERSHIPS } from '../constants/access.js';
import { DASHBOARD_LINKS } from '../constants/dashboardLinks.js';
import { formatRelativeTime } from '../utils/date.js';

export { sortThreads } from '../utils/messaging.js';
export { INBOX_REFRESH_INTERVAL } from '../context/MessagingContext.jsx';

export function formatMembershipLabel(key) {
  return DASHBOARD_LINKS[key]?.label ?? key.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ThreadCard({ thread, actorId, onSelect, selected, onTogglePin, pinning = false }) {
  const title = buildThreadTitle(thread, actorId);
  const participants = formatThreadParticipants(thread, actorId);
  const unread = isThreadUnread(thread);
  const activity = describeLastActivity(thread);
  const unreadCount = typeof thread.unreadCount === 'number' ? thread.unreadCount : unread ? 1 : 0;

  const handleSelect = useCallback(() => {
    onSelect(thread.id);
  }, [onSelect, thread.id]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleSelect();
      }
    },
    [handleSelect],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={classNames(
        'w-full rounded-3xl border px-5 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        selected
          ? 'border-accent bg-accentSoft shadow-soft'
          : unread
          ? 'border-slate-200 bg-white shadow-sm hover:border-accent/60'
          : 'border-slate-200 bg-white hover:border-accent/60',
        'cursor-pointer',
      )}
      aria-pressed={selected}
      aria-label={`Open conversation ${title}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          {thread.pinned ? (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              Pinned
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 ? (
            <span className="inline-flex min-w-[1.75rem] justify-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              {unreadCount}
            </span>
          ) : null}
          {onTogglePin ? (
            <button
              type="button"
              aria-label={thread.pinned ? `Unpin ${title}` : `Pin ${title}`}
              className={classNames(
                'rounded-full p-1.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                thread.pinned
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'border border-slate-200 text-slate-400 hover:border-accent/60 hover:text-accent',
                pinning ? 'cursor-wait opacity-70' : '',
              )}
              onClick={(event) => {
                event.stopPropagation();
                if (!pinning) {
                  onTogglePin(thread, !thread.pinned);
                }
              }}
              disabled={pinning}
            >
              {thread.pinned ? (
                <StarSolidIcon className="h-4 w-4" />
              ) : (
                <StarOutlineIcon className="h-4 w-4" />
              )}
            </button>
          ) : null}
          <span className="text-xs text-slate-400">{activity}</span>
        </div>
      </div>
      {participants.length ? (
        <p className="mt-1 text-xs text-slate-500">{participants.join(', ')}</p>
      ) : null}
      {thread.lastMessagePreview ? (
        <p className="mt-2 text-sm text-slate-600 line-clamp-2">{thread.lastMessagePreview}</p>
      ) : null}
    </div>
  );
}

export default function InboxPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const actorId = resolveActorId(session);
  const messaging = useMessaging();
  const {
    workspace,
    loading: workspaceLoading,
    pinThread: pinWorkspaceThread,
    unpinThread: unpinWorkspaceThread,
  } = useFreelancerInboxWorkspace({ userId: actorId, enabled: Boolean(isAuthenticated && actorId) });

  const {
    hasMessagingAccess,
    threads,
    loadingThreads,
    threadsError,
    refreshInbox,
    selectedThreadId,
    selectedThread,
    selectThread,
    messages,
    messagesLoading,
    messagesError,
    hasMoreHistory,
    loadOlderMessages,
    composer,
    updateComposer,
    sendMessage,
    sending,
    typingParticipants,
    callSession,
    callLoading,
    callError,
    startCall,
    joinCall,
    closeCall,
    lastSyncedAt,
  } = messaging;
  const [pinningThreadIds, setPinningThreadIds] = useState([]);
  const [pinError, setPinError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const pinningSet = useMemo(() => new Set(pinningThreadIds), [pinningThreadIds]);

  const messagingMemberships = useMemo(() => getMessagingMemberships(session), [session]);
  const allowedMembershipLabels = useMemo(
    () => messagingMemberships.map((membership) => formatMembershipLabel(membership)),
    [messagingMemberships],
  );
  const allowedRoleCatalog = useMemo(
    () => MESSAGING_ALLOWED_MEMBERSHIPS.map((membership) => formatMembershipLabel(membership)),
    [],
  );

  const handleSend = useCallback(
    async (event) => {
      event.preventDefault();
      if (!composer.trim() || !selectedThreadId) {
        return;
      }
      await sendMessage(composer.trim());
    },
    [composer, selectedThreadId, sendMessage],
  );

  const handleComposerChange = useCallback(
    (event) => {
      updateComposer(event.target.value);
    },
    [updateComposer],
  );

  const handleStartCall = useCallback(
    (type) => {
      startCall(type);
    },
    [startCall],
  );

  const handleJoinCall = useCallback((metadata) => {
    joinCall(metadata);
  }, [joinCall]);

  const handleCloseCall = useCallback(() => {
    closeCall();
  }, [closeCall]);

  const handleLoadOlderMessages = useCallback(async () => {
    await loadOlderMessages();
  }, [loadOlderMessages]);

  const handlePinningState = useCallback((threadId, active) => {
    setPinningThreadIds((current) => {
      const next = new Set(current);
      if (active) {
        next.add(threadId);
      } else {
        next.delete(threadId);
      }
      return Array.from(next);
    });
  }, []);

  const handleTogglePin = useCallback(
    async (thread, shouldPin) => {
      if (!thread?.id) {
        return;
      }
      setPinError(null);
      handlePinningState(thread.id, true);
      try {
        if (shouldPin) {
          await pinWorkspaceThread(thread.id);
        } else {
          await unpinWorkspaceThread(thread.id);
        }
        await refreshInbox({ silent: true });
      } catch (error) {
        const message = error?.body?.message ?? error?.message ?? 'Unable to update pin state.';
        setPinError(message);
      } finally {
        handlePinningState(thread.id, false);
      }
    },
    [handlePinningState, pinWorkspaceThread, refreshInbox, unpinWorkspaceThread],
  );

  const savedReplies = useMemo(
    () => (Array.isArray(workspace?.savedReplies) ? workspace.savedReplies : []),
    [workspace?.savedReplies],
  );

  const pinnedThreadList = useMemo(() => threads.filter((thread) => thread.pinned), [threads]);
  const regularThreadList = useMemo(() => threads.filter((thread) => !thread.pinned), [threads]);

  const handleInsertSavedReply = useCallback(
    (reply) => {
      if (!reply || !selectedThreadId) {
        return;
      }
      const snippet = typeof reply.body === 'string' ? reply.body.trim() : '';
      if (!snippet) {
        return;
      }
      const base = composer ?? '';
      if (!base.trim()) {
        updateComposer(snippet);
        return;
      }
      const needsDoubleNewline = !base.endsWith('\n') && !base.endsWith('\n\n');
      const separator = needsDoubleNewline ? '\n\n' : base.endsWith('\n') ? '\n' : '';
      updateComposer(`${base}${separator}${snippet}`);
    },
    [composer, selectedThreadId, updateComposer],
  );

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
              onClick={() => refreshInbox()}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" /> Refresh inbox
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
                {lastSyncedAt ? (
                  <span className="text-[11px] text-slate-400">Synced {formatRelativeTime(lastSyncedAt)}</span>
                ) : null}
                <button
                  type="button"
                  onClick={() => refreshInbox()}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
                  disabled={loadingThreads}
                >
                  <ArrowPathIcon className={classNames('h-4 w-4', loadingThreads ? 'animate-spin' : '')} /> Sync
                </button>
              </div>
              <div className="mt-3 space-y-3">
                {threadsError ? (
                  <p className="rounded-3xl bg-rose-50 px-4 py-3 text-xs text-rose-600" role="alert">
                    {threadsError}
                  </p>
                ) : null}
                {pinError ? (
                  <p className="rounded-3xl bg-amber-50 px-4 py-3 text-xs text-amber-700" role="alert">
                    {pinError}
                  </p>
                ) : null}
                {loadingThreads ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="h-20 rounded-3xl bg-slate-100" />
                    ))}
                  </div>
                ) : threads.length ? (
                  <div className="space-y-3">
                    {pinnedThreadList.length ? (
                      <div className="space-y-2">
                        <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Pinned</p>
                        {pinnedThreadList.map((thread) => (
                          <ThreadCard
                            key={thread.id}
                            thread={thread}
                            actorId={actorId}
                            selected={selectedThreadId === thread.id}
                            onSelect={selectThread}
                            onTogglePin={handleTogglePin}
                            pinning={pinningSet.has(thread.id)}
                          />
                        ))}
                      </div>
                    ) : null}
                    {regularThreadList.map((thread) => (
                      <ThreadCard
                        key={thread.id}
                        thread={thread}
                        actorId={actorId}
                        selected={selectedThreadId === thread.id}
                        onSelect={selectThread}
                        onTogglePin={handleTogglePin}
                        pinning={pinningSet.has(thread.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    No conversations yet. Start a thread from any project or invite collaborators to connect.
                  </div>
                )}
              </div>
            </div>
          </aside>
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
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
                    disabled={!actorId || callLoading || Boolean(callSession)}
                    className={classNames(
                      'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                      !actorId || callLoading || Boolean(callSession)
                        ? 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'border border-accent bg-accent text-white hover:border-accentDark hover:bg-accentDark',
                    )}
                  >
                    <VideoCameraIcon className={classNames('h-4 w-4', callLoading ? 'animate-spin' : '')} /> Start video
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartCall('voice')}
                    disabled={!actorId || callLoading || Boolean(callSession)}
                    className={classNames(
                      'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                      !actorId || callLoading || Boolean(callSession)
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
            <div>
              {messagesError ? (
                <p className="mb-3 rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-600" role="alert">
                  {messagesError}
                </p>
              ) : null}
              <VirtualizedMessageList
                messages={messages}
                hasMore={hasMoreHistory}
                onLoadMore={handleLoadOlderMessages}
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
                    onJoinCall={handleJoinCall}
                    joiningCall={callLoading}
                    activeCallId={callSession?.callId ?? null}
                  />
                )}
              />
            </div>
            {typingParticipants.length ? (
              <TypingIndicator participants={typingParticipants} actorId={actorId} />
            ) : null}
            {callSession ? <AgoraCallPanel session={callSession} onClose={handleCloseCall} /> : null}
            <form className="space-y-3" onSubmit={handleSend}>
              <textarea
                rows={4}
                value={composer}
                onChange={handleComposerChange}
                disabled={!selectedThreadId || sending}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                placeholder={selectedThreadId ? 'Write your reply…' : 'Select a conversation to reply.'}
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={!selectedThreadId || !composer.trim() || sending}
                  className={classNames(
                    'inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition',
                    !selectedThreadId || !composer.trim() || sending ? 'cursor-not-allowed opacity-60' : 'hover:bg-accentDark',
                  )}
                >
                  Send message
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
                  onClick={() => refreshInbox()}
                >
                  Share to team
                </button>
              </div>
            </form>
            {savedReplies.length ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saved replies</p>
                  <span className="text-[11px] text-slate-400">
                    {workspaceLoading ? 'Syncing…' : `${savedReplies.length} templates`}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {savedReplies.map((reply) => (
                    <button
                      key={reply.id}
                      type="button"
                      onClick={() => handleInsertSavedReply(reply)}
                      className="group rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-accent/60 hover:shadow-sm"
                      disabled={!selectedThreadId}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-accent">{reply.title}</p>
                        <span className="text-[11px] text-slate-400">
                          {reply.shortcuts?.length
                            ? reply.shortcuts
                                .slice(0, 2)
                                .map((shortcut) => `/${shortcut}`)
                                .join(' ')
                            : reply.shortcut
                            ? `/${reply.shortcut}`
                            : ''}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-3">{reply.body}</p>
                      {reply.isDefault ? (
                        <span className="mt-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                          Default
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

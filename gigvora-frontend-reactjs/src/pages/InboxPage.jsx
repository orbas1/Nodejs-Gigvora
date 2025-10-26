import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader.jsx';
import useSession from '../hooks/useSession.js';
import useMessaging from '../hooks/useMessaging.js';
import useFreelancerInboxWorkspace from '../hooks/useFreelancerInboxWorkspace.js';
import { resolveActorId } from '../utils/messaging.js';
import { getMessagingMemberships, MESSAGING_ALLOWED_MEMBERSHIPS } from '../constants/access.js';
import { DASHBOARD_LINKS } from '../constants/dashboardLinks.js';
import MessagesInbox, { ThreadCard } from '../components/messaging/MessagesInbox.jsx';
import ConversationView from '../components/messaging/ConversationView.jsx';

export { sortThreads } from '../utils/messaging.js';
export { INBOX_REFRESH_INTERVAL } from '../context/MessagingContext.jsx';

export function formatMembershipLabel(key) {
  return DASHBOARD_LINKS[key]?.label ?? key.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export { ThreadCard } from '../components/messaging/MessagesInbox.jsx';

export default function InboxPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const actorId = resolveActorId(session);
  const messaging = useMessaging();
  const { workspace, pinThread: pinWorkspaceThread, unpinThread: unpinWorkspaceThread } =
    useFreelancerInboxWorkspace({ userId: actorId, enabled: Boolean(isAuthenticated && actorId) });

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
    markThreadAsRead,
    markThreadAsUnread,
    snoozeThread,
    unsnoozeThread,
    snoozedThreads,
    unreadOverrides,
  } = messaging;
  const [pinningThreadIds, setPinningThreadIds] = useState([]);
  const [pinError, setPinError] = useState(null);
  const inboxError = useMemo(() => {
    const combined = [threadsError, pinError].filter(Boolean).join(' ');
    return combined.length ? combined : null;
  }, [threadsError, pinError]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const messagingMemberships = useMemo(() => getMessagingMemberships(session), [session]);
  const allowedMembershipLabels = useMemo(
    () => messagingMemberships.map((membership) => formatMembershipLabel(membership)),
    [messagingMemberships],
  );
  const allowedRoleCatalog = useMemo(
    () => MESSAGING_ALLOWED_MEMBERSHIPS.map((membership) => formatMembershipLabel(membership)),
    [],
  );

  const handleSend = useCallback(async () => {
    if (!composer.trim() || !selectedThreadId) {
      return;
    }
    await sendMessage(composer.trim());
  }, [composer, selectedThreadId, sendMessage]);

  const handleComposerChange = useCallback(
    (value) => {
      updateComposer(value);
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

  const handleShareToTeam = useCallback(() => {
    refreshInbox();
  }, [refreshInbox]);

  const savedReplies = useMemo(
    () => (Array.isArray(workspace?.savedReplies) ? workspace.savedReplies : []),
    [workspace?.savedReplies],
  );

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
          description="Priority triage, rich analytics, and immersive calling keep every relationship on track."
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
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(260px,0.85fr),minmax(0,2.15fr)]">
          <MessagesInbox
            threads={threads}
            actorId={actorId}
            loading={loadingThreads}
            error={inboxError}
            onRefresh={() => refreshInbox()}
            selectedThreadId={selectedThreadId}
            onSelectThread={selectThread}
            onTogglePin={handleTogglePin}
            pinningThreadIds={pinningThreadIds}
            markThreadAsRead={markThreadAsRead}
            markThreadAsUnread={markThreadAsUnread}
            snoozeThread={snoozeThread}
            unsnoozeThread={unsnoozeThread}
            snoozedThreads={snoozedThreads}
            unreadOverrides={unreadOverrides}
            lastSyncedAt={lastSyncedAt}
            viewerName={session?.name ?? 'Gigvora member'}
            membershipLabels={allowedMembershipLabels}
          />
          <ConversationView
            thread={selectedThread}
            actorId={actorId}
            messages={messages}
            messagesLoading={messagesLoading}
            messagesError={messagesError}
            hasMoreHistory={hasMoreHistory}
            onLoadMore={handleLoadOlderMessages}
            typingParticipants={typingParticipants}
            composerValue={composer}
            onComposerChange={handleComposerChange}
            onSend={handleSend}
            sending={sending}
            onStartCall={handleStartCall}
            callSession={callSession}
            callLoading={callLoading}
            callError={callError}
            onJoinCall={handleJoinCall}
            onCloseCall={handleCloseCall}
            savedReplies={savedReplies}
            onInsertSavedReply={handleInsertSavedReply}
            onShare={handleShareToTeam}
          />
        </div>
      </div>
    </section>
  );
}

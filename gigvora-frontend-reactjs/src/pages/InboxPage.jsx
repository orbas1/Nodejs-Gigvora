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
import analytics from '../services/analytics.js';
import MessagesInbox from '../components/messaging/MessagesInbox.jsx';
import ConversationView from '../components/messaging/ConversationView.jsx';

export { sortThreads } from '../utils/messaging.js';
export { INBOX_REFRESH_INTERVAL } from '../context/MessagingContext.jsx';

export function formatMembershipLabel(key) {
  return DASHBOARD_LINKS[key]?.label ?? key.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export { ThreadPreviewCard as ThreadCard } from '../components/messaging/MessagesInbox.jsx';

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

  const messagingMemberships = useMemo(() => getMessagingMemberships(session), [session]);
  const allowedMembershipLabels = useMemo(
    () => messagingMemberships.map((membership) => formatMembershipLabel(membership)),
    [messagingMemberships],
  );
  const allowedRoleCatalog = useMemo(
    () => MESSAGING_ALLOWED_MEMBERSHIPS.map((membership) => formatMembershipLabel(membership)),
    [],
  );

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

  const pinningSet = useMemo(() => new Set(pinningThreadIds), [pinningThreadIds]);

  const inboxError = useMemo(() => threadsError ?? pinError, [threadsError, pinError]);

  const handleRefresh = useCallback(() => {
    refreshInbox();
  }, [refreshInbox]);

  const handleSavedReplyUsed = useCallback(
    (reply) => {
      if (!reply) {
        return;
      }
      analytics.track('messaging.saved_reply_used', {
        surface: 'web_inbox',
        threadId: selectedThreadId ?? null,
        replyId: reply.id ?? null,
        title: reply.title ?? null,
      });
    },
    [selectedThreadId],
  );

  const handleStartCall = useCallback(
    (type) => {
      analytics.track('messaging.start_call', {
        surface: 'web_inbox',
        threadId: selectedThreadId ?? null,
        callType: type,
      });
      return startCall(type);
    },
    [selectedThreadId, startCall],
  );

  const handleJoinCall = useCallback(
    (metadata) => {
      analytics.track('messaging.join_call', {
        surface: 'web_inbox',
        threadId: selectedThreadId ?? null,
        callId: metadata?.id ?? null,
      });
      return joinCall(metadata);
    },
    [joinCall, selectedThreadId],
  );

  const handleCloseCall = useCallback(() => {
    analytics.track('messaging.leave_call', {
      surface: 'web_inbox',
      threadId: selectedThreadId ?? null,
      callId: callSession?.callId ?? null,
    });
    closeCall();
  }, [callSession?.callId, closeCall, selectedThreadId]);

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
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(280px,0.85fr),minmax(0,2fr)]">
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
            <MessagesInbox
              actorId={actorId}
              threads={threads}
              loading={loadingThreads}
              error={inboxError}
              lastSyncedAt={lastSyncedAt}
              onRefresh={handleRefresh}
              onSelectThread={selectThread}
              selectedThreadId={selectedThreadId}
              onTogglePin={handleTogglePin}
              pinningThreadIds={pinningSet}
            />
          </aside>
          <ConversationView
            actorId={actorId}
            thread={selectedThread}
            messages={messages}
            messagesLoading={messagesLoading}
            messagesError={messagesError}
            hasMoreHistory={hasMoreHistory}
            onLoadOlder={loadOlderMessages}
            typingParticipants={typingParticipants}
            onStartCall={handleStartCall}
            onJoinCall={handleJoinCall}
            onCloseCall={handleCloseCall}
            callSession={callSession}
            callLoading={callLoading}
            callError={callError}
            composerValue={composer}
            onComposerChange={updateComposer}
            onSendMessage={sendMessage}
            sending={sending}
            savedReplies={savedReplies}
            savedRepliesLoading={workspaceLoading}
            onSavedReplyUsed={handleSavedReplyUsed}
          />
        </div>
      </div>
    </section>
  );
}

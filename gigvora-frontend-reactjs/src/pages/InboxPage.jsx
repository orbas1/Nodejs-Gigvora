import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import PageHeader from '../components/PageHeader.jsx';
import useSession from '../hooks/useSession.js';
import useMessaging from '../hooks/useMessaging.js';
import { resolveActorId } from '../utils/messaging.js';
import { getMessagingMemberships, MESSAGING_ALLOWED_MEMBERSHIPS } from '../constants/access.js';
import { DASHBOARD_LINKS } from '../constants/dashboardLinks.js';
import MessagingWorkspace from '../components/messaging/MessagingWorkspace.jsx';

export { sortThreads } from '../utils/messaging.js';
export { INBOX_REFRESH_INTERVAL } from '../context/MessagingContext.jsx';
export { ThreadPreviewCard as ThreadCard } from '../components/messaging/MessagesInbox.jsx';

export function formatMembershipLabel(key) {
  return DASHBOARD_LINKS[key]?.label ?? key.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatSyncedTimestamp(timestamp) {
  if (!timestamp) {
    return 'Syncing…';
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'Syncing…';
  }
  return `Synced ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

export default function InboxPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const actorId = resolveActorId(session);
  const {
    hasMessagingAccess,
    threads,
    loadingThreads,
    threadsError,
    refreshInbox,
    selectedThreadId,
    selectThread,
    messages,
    messagesLoading,
    messagesError,
    composer,
    updateComposer,
    sendMessage,
    sending,
    lastSyncedAt,
  } = useMessaging();

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

  const inboxError = useMemo(() => threadsError ?? messagesError ?? null, [threadsError, messagesError]);
  const loading = loadingThreads || messagesLoading;

  const handleRefresh = useCallback(() => {
    refreshInbox({ silent: false });
  }, [refreshInbox]);

  const handleSelectThread = useCallback(
    (threadId) => {
      if (!threadId) {
        return;
      }
      selectThread(threadId);
    },
    [selectThread],
  );

  const handleSendMessage = useCallback(
    async (threadId, body) => {
      const text = typeof body === 'string' ? body.trim() : '';
      if (!threadId || !text) {
        return;
      }
      if (threadId !== selectedThreadId) {
        selectThread(threadId);
      }
      await sendMessage(text);
    },
    [selectThread, selectedThreadId, sendMessage],
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
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,219,254,0.35),_transparent_65%)]"
        aria-hidden="true"
      />
      <div className="absolute -left-12 bottom-6 h-72 w-72 rounded-full bg-emerald-200/40 blur-[120px]" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-6">
        <PageHeader
          eyebrow="Messaging"
          title="Centralised inbox"
          description="Secure messaging, social-style conversations, and rapid approvals in one streamlined workspace."
          actions={
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" /> Refresh inbox
            </button>
          }
          meta={
            <span className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
              {formatSyncedTimestamp(lastSyncedAt)}
            </span>
          }
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(280px,0.9fr),minmax(0,2.1fr)]">
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
          </aside>
          <MessagingWorkspace
            actorId={actorId}
            threads={threads}
            loading={loading}
            error={inboxError}
            selectedThreadId={selectedThreadId}
            onSelectThread={handleSelectThread}
            onSendMessage={handleSendMessage}
            messages={messages}
            sending={sending}
            composerValue={composer}
            onComposerChange={updateComposer}
          />
        </div>
      </div>
    </section>
  );
}

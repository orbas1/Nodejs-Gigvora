import { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import DataStatus from '../../DataStatus.jsx';
import MessagingWorkspace from '../../messaging/MessagingWorkspace.jsx';
import useMessaging from '../../../hooks/useMessaging.js';
import useSession from '../../../hooks/useSession.js';
import { resolveActorId } from '../../../utils/session.js';
import { formatRelativeTime } from '../../../utils/date.js';

function formatSyncedMeta(timestamp) {
  if (!timestamp) {
    return null;
  }
  return formatRelativeTime(timestamp);
}

export default function DashboardInboxSection({
  id,
  eyebrow,
  title,
  description,
  statusLabel,
  className,
}) {
  const { session } = useSession();
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

  const loading = loadingThreads || messagesLoading;
  const combinedError = useMemo(() => messagesError ?? threadsError ?? null, [messagesError, threadsError]);

  const statusMeta = useMemo(() => {
    const value = formatSyncedMeta(lastSyncedAt);
    return value ? [{ label: 'Last sync', value }] : undefined;
  }, [lastSyncedAt]);

  const insights = useMemo(() => {
    if (combinedError) {
      return [combinedError];
    }
    if (!hasMessagingAccess) {
      return ['Messaging access is disabled for this workspace. Update memberships to enable inbox sync.'];
    }
    return undefined;
  }, [combinedError, hasMessagingAccess]);

  const handleRefresh = useCallback(() => {
    if (!hasMessagingAccess) {
      return;
    }
    refreshInbox({ silent: false });
  }, [hasMessagingAccess, refreshInbox]);

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
      const trimmed = typeof body === 'string' ? body.trim() : '';
      if (!threadId || !trimmed) {
        return;
      }
      if (threadId !== selectedThreadId) {
        selectThread(threadId);
      }
      await sendMessage(trimmed);
    },
    [selectedThreadId, selectThread, sendMessage],
  );

  const handleComposerChange = useCallback(
    (value) => {
      updateComposer(value ?? '');
    },
    [updateComposer],
  );

  return (
    <section id={id} className={`space-y-6 ${className ?? ''}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{eyebrow}</p>
          ) : null}
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">{title}</h2>
            {description ? <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/inbox"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-accent hover:text-accent"
          >
            Open inbox
          </Link>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || !hasMessagingAccess}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <DataStatus
        loading={loading}
        error={combinedError}
        statusLabel={statusLabel}
        meta={statusMeta}
        insights={insights}
        onRefresh={handleRefresh}
      />

      {hasMessagingAccess ? (
        <div className="rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-soft sm:p-6">
          <MessagingWorkspace
            actorId={actorId}
            threads={threads}
            loading={loading}
            error={combinedError}
            selectedThreadId={selectedThreadId}
            onSelectThread={handleSelectThread}
            onSendMessage={handleSendMessage}
            messages={messages}
            sending={sending}
            composerValue={composer ?? ''}
            onComposerChange={handleComposerChange}
          />
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-10 text-center shadow-soft">
          <p className="text-sm font-semibold text-slate-800">Messaging access pending</p>
          <p className="mt-2 text-sm text-slate-600">
            Activate a messaging-enabled membership or contact support to enable live inbox syncing on this dashboard.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              to="/settings"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent hover:text-accent"
            >
              Manage memberships
            </Link>
            <a
              href="mailto:support@gigvora.com"
              className="inline-flex items-center gap-2 rounded-full border border-transparent bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700"
            >
              Contact support
            </a>
          </div>
        </div>
      )}
    </section>
  );
}

DashboardInboxSection.propTypes = {
  id: PropTypes.string,
  eyebrow: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  statusLabel: PropTypes.string,
  className: PropTypes.string,
};

DashboardInboxSection.defaultProps = {
  id: 'dashboard-inbox',
  eyebrow: 'Messaging',
  title: 'Messaging inbox',
  description: 'Stay connected with clients, teammates, and partners in a focused two-pane workspace.',
  statusLabel: 'Inbox status',
  className: '',
};

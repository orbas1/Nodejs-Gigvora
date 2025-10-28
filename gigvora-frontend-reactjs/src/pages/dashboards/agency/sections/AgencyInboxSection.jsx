import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import DataStatus from '../../../../components/DataStatus.jsx';
import MessagingWorkspace from '../../../../components/messaging/MessagingWorkspace.jsx';
import useSession from '../../../../hooks/useSession.js';
import useAgencyInboxWorkspace from '../../../../hooks/useAgencyInboxWorkspace.js';
import { resolveActorId } from '../../../../utils/session.js';
import { sendMessage } from '../../../../services/messaging.js';

export default function AgencyInboxSection({ workspaceId, statusLabel }) {
  const { session } = useSession();
  const actorId = useMemo(() => resolveActorId(session), [session]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [sending, setSending] = useState(false);

  const { workspace, loading, error, fromCache, lastUpdated, refresh } = useAgencyInboxWorkspace({
    workspaceId,
    enabled: Boolean(workspaceId),
  });

  const threads = useMemo(
    () =>
      (workspace?.activeThreads ?? workspace?.threads ?? []).map((thread) => ({
        ...thread,
        id: thread.id ?? thread.threadId ?? thread.conversationId,
      })),
    [workspace?.activeThreads, workspace?.threads],
  );

  useEffect(() => {
    if (!threads.length) {
      setSelectedThreadId(null);
      return;
    }

    if (!selectedThreadId || !threads.some((thread) => `${thread.id}` === `${selectedThreadId}`)) {
      setSelectedThreadId(threads[0].id);
    }
  }, [threads, selectedThreadId]);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setStatusMessage(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  useEffect(() => {
    if (!errorMessage) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setErrorMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [errorMessage]);

  const handleSelectThread = useCallback((threadId) => setSelectedThreadId(threadId), []);

  const handleSendMessage = useCallback(
    async (threadId, body) => {
      if (!threadId || !body?.trim()) {
        return;
      }

      setSending(true);
      try {
        await sendMessage(threadId, { userId: actorId, body: body.trim() });
        setStatusMessage('Message sent');
        await refresh?.({ force: true });
      } catch (sendError) {
        console.error('Failed to send message', sendError);
        setErrorMessage('Unable to send message. Please try again.');
      } finally {
        setSending(false);
      }
    },
    [actorId, refresh],
  );

  const metaEntries = useMemo(
    () => (statusMessage ? [{ label: 'Latest activity', value: statusMessage }] : undefined),
    [statusMessage],
  );

  const insightEntries = useMemo(() => (errorMessage ? [errorMessage] : undefined), [errorMessage]);

  return (
    <section className="space-y-6">
      <header className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Agency workspace</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Messaging inbox</h2>
        </div>
        <p className="max-w-3xl text-sm text-slate-500">
          Manage client and talent conversations in a clean, LinkedIn-style layout. Search threads, jump between unread
          conversations, and respond instantly without leaving the dashboard.
        </p>
      </header>
      <DataStatus
        loading={loading}
        fromCache={fromCache}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        error={error}
        statusLabel={statusLabel ?? 'Live messaging data'}
        meta={metaEntries}
        insights={insightEntries}
      />
      <MessagingWorkspace
        actorId={actorId}
        threads={threads}
        loading={loading}
        error={errorMessage ?? (typeof error === 'string' ? error : error?.message ?? null)}
        selectedThreadId={selectedThreadId}
        onSelectThread={handleSelectThread}
        onSendMessage={handleSendMessage}
        sending={sending}
      />
    </section>
  );
}

AgencyInboxSection.propTypes = {
  workspaceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  statusLabel: PropTypes.string,
};

AgencyInboxSection.defaultProps = {
  workspaceId: null,
  statusLabel: undefined,
};

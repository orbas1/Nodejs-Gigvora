import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import SectionShell from '../SectionShell.jsx';
import DataStatus from '../../../../components/DataStatus.jsx';
import MessagingWorkspace from '../../../../components/messaging/MessagingWorkspace.jsx';
import useSession from '../../../../hooks/useSession.js';
import useFreelancerInboxWorkspace from '../../../../hooks/useFreelancerInboxWorkspace.js';
import { resolveActorId } from '../../../../utils/session.js';
import { sendMessage } from '../../../../services/messaging.js';

export default function InboxSection({ userId }) {
  const { session } = useSession();
  const actorId = useMemo(() => userId ?? resolveActorId(session), [session, userId]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [sending, setSending] = useState(false);

  const { workspace, loading, error, fromCache, lastSyncedAt, refresh } = useFreelancerInboxWorkspace({
    userId: actorId,
    enabled: Boolean(actorId),
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
    <SectionShell
      id="messaging"
      title="Messages"
      description="Stay on top of recruiter and client conversations in a focused, social-style inbox."
    >
      <DataStatus
        loading={loading}
        fromCache={fromCache}
        lastUpdated={lastSyncedAt}
        onRefresh={refresh}
        error={error}
        statusLabel="Inbox health"
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
    </SectionShell>
  );
}

InboxSection.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

InboxSection.defaultProps = {
  userId: undefined,
};

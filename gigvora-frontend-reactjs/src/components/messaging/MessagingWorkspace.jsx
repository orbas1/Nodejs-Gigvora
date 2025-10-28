import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import MessagesInbox, { INBOX_FILTERS } from './MessagesInbox.jsx';
import ConversationView from './ConversationView.jsx';
import { buildThreadTitle, formatThreadParticipants } from '../../utils/messaging.js';

function normaliseThreads(threads, actorId) {
  return (threads ?? []).map((thread) => {
    const baseMessages = Array.isArray(thread.messages)
      ? thread.messages
      : Array.isArray(thread.messageHistory)
      ? thread.messageHistory
      : [];

    const title = buildThreadTitle(thread, actorId);
    const participants = formatThreadParticipants(thread, actorId);
    const previewSource =
      thread.preview ??
      thread.lastMessagePreview ??
      thread.lastMessage?.body ??
      baseMessages[baseMessages.length - 1]?.body ??
      thread.snippet;

    return {
      ...thread,
      id: thread.id ?? thread.threadId ?? thread.conversationId,
      title,
      participants,
      preview: previewSource || 'Start the conversation with a friendly hello.',
      lastActivityAt:
        thread.lastActivityAt ||
        thread.lastMessageAt ||
        thread.updatedAt ||
        baseMessages[baseMessages.length - 1]?.createdAt,
      unread:
        Boolean(thread.unread) ||
        Boolean(thread.metrics?.unreadCount) ||
        Boolean(thread.state === 'unread') ||
        Boolean(thread.read === false),
      starred: Boolean(thread.starred),
      meta:
        thread.meta ||
        thread.jobTitle ||
        (thread.role && thread.company
          ? `${thread.role} · ${thread.company}`
          : thread.company || thread.role || (participants.length ? participants.join(', ') : null)),
      avatarUrl:
        thread.avatarUrl ||
        thread.photoUrl ||
        thread.imageUrl ||
        thread.participants?.find((participant) => participant.avatarUrl || participant.photoUrl || participant.imageUrl)
          ?.avatarUrl ||
        thread.participants?.find((participant) => participant.avatarUrl || participant.photoUrl || participant.imageUrl)
          ?.photoUrl ||
        thread.participants?.find((participant) => participant.avatarUrl || participant.photoUrl || participant.imageUrl)
          ?.imageUrl ||
        null,
      messages: baseMessages,
    };
  });
}

export default function MessagingWorkspace({
  actorId,
  threads,
  loading,
  error,
  selectedThreadId,
  onSelectThread,
  onSendMessage,
  messages,
  sending,
  composerValue,
  onComposerChange,
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(INBOX_FILTERS[0].key);
  const [internalSelectedId, setInternalSelectedId] = useState(null);
  const [localEchoes, setLocalEchoes] = useState({});
  const [internalComposer, setInternalComposer] = useState('');

  const composer = composerValue ?? internalComposer;
  const updateComposer = onComposerChange ?? setInternalComposer;

  const normalisedThreads = useMemo(() => normaliseThreads(threads, actorId), [actorId, threads]);

  useEffect(() => {
    if (selectedThreadId) {
      setInternalSelectedId(selectedThreadId);
      return;
    }

    if (!internalSelectedId && normalisedThreads.length > 0) {
      setInternalSelectedId(normalisedThreads[0].id);
    }
  }, [internalSelectedId, normalisedThreads, selectedThreadId]);

  useEffect(() => {
    if (!selectedThreadId && internalSelectedId && normalisedThreads.every((thread) => `${thread.id}` !== `${internalSelectedId}`)) {
      setInternalSelectedId(normalisedThreads[0]?.id ?? null);
    }
  }, [internalSelectedId, normalisedThreads, selectedThreadId]);

  const threadsWithEchoes = useMemo(
    () =>
      normalisedThreads.map((thread) => ({
        ...thread,
        messages: [
          ...thread.messages,
          ...(localEchoes[thread.id] ?? []),
        ],
      })),
    [localEchoes, normalisedThreads],
  );

  const filteredThreads = useMemo(() => {
    const query = search.trim().toLowerCase();

    return threadsWithEchoes.filter((thread) => {
      const matchesQuery =
        !query ||
        thread.title.toLowerCase().includes(query) ||
        thread.preview?.toLowerCase().includes(query) ||
        thread.meta?.toLowerCase().includes(query);

      if (!matchesQuery) {
        return false;
      }

      if (filter === 'unread') {
        return Boolean(thread.unread);
      }

      if (filter === 'starred') {
        return Boolean(thread.starred);
      }

      return true;
    });
  }, [filter, search, threadsWithEchoes]);

  const activeThreadId = selectedThreadId ?? internalSelectedId;
  const activeThread = useMemo(
    () => threadsWithEchoes.find((thread) => `${thread.id}` === `${activeThreadId}`) ?? null,
    [activeThreadId, threadsWithEchoes],
  );

  const activeMessages = useMemo(() => {
    if (Array.isArray(messages)) {
      return messages;
    }

    return activeThread?.messages ?? [];
  }, [activeThread?.messages, messages]);

  const handleSelectThread = (threadId) => {
    if (!selectedThreadId) {
      setInternalSelectedId(threadId);
    }

    updateComposer('');
    onSelectThread?.(threadId);
  };

  const handleSendMessage = async (body) => {
    if (!activeThread) {
      return;
    }

    const trimmed = body?.trim();
    if (!trimmed) {
      return;
    }

    if (onSendMessage) {
      await onSendMessage(activeThread.id, trimmed);
      updateComposer('');
      return;
    }

    setLocalEchoes((previous) => ({
      ...previous,
      [activeThread.id]: [
        ...(previous[activeThread.id] ?? []),
        {
          id: `local-${Date.now()}`,
          body: trimmed,
          author: { id: actorId },
          createdAt: new Date().toISOString(),
        },
      ],
    }));
    updateComposer('');
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <div className="min-h-[520px]">
        <MessagesInbox
          threads={filteredThreads}
          selectedThreadId={activeThreadId}
          onSelectThread={handleSelectThread}
          filter={filter}
          onFilterChange={setFilter}
          searchTerm={search}
          onSearchChange={setSearch}
        />
      </div>
      <div className="relative min-h-[520px]">
        {loading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl border border-slate-200 bg-white/80">
            <p className="text-sm font-medium text-slate-500">Loading conversations…</p>
          </div>
        ) : null}
        {error ? (
          <div className="absolute inset-x-6 top-6 z-10 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 shadow-sm">
            {error}
          </div>
        ) : null}
        <ConversationView
          actorId={actorId}
          thread={activeThread}
          messages={activeMessages}
          composerValue={composer}
          onComposerChange={updateComposer}
          onSendMessage={handleSendMessage}
          sending={sending}
        />
      </div>
    </div>
  );
}

MessagingWorkspace.propTypes = {
  actorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  threads: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  selectedThreadId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectThread: PropTypes.func,
  onSendMessage: PropTypes.func,
  messages: PropTypes.arrayOf(PropTypes.object),
  sending: PropTypes.bool,
  composerValue: PropTypes.string,
  onComposerChange: PropTypes.func,
};

MessagingWorkspace.defaultProps = {
  actorId: null,
  threads: [],
  loading: false,
  error: null,
  selectedThreadId: null,
  onSelectThread: undefined,
  onSendMessage: undefined,
  messages: undefined,
  sending: false,
  composerValue: undefined,
  onComposerChange: undefined,
};


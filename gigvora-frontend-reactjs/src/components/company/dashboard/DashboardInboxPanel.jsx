import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeOpenIcon,
  PaperAirplaneIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import DataStatus from '../../DataStatus.jsx';
import {
  fetchCompanyInboxOverview,
  fetchCompanyInboxThreads,
  fetchCompanyInboxThread,
} from '../../../services/companyInbox.js';
import { createThread, sendMessage, markThreadRead } from '../../../services/messaging.js';

function InboxMetric({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-xl font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function Message({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
          isOwn ? 'bg-indigo-600 text-white shadow-soft' : 'bg-slate-100 text-slate-700'
        }`}
      >
        <p className="font-semibold">
          {message.author?.firstName || message.author?.email || (isOwn ? 'You' : 'Teammate')}
        </p>
        <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
        <p className={`mt-1 text-xs ${isOwn ? 'text-indigo-100' : 'text-slate-500'}`}>
          {new Date(message.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default function DashboardInboxPanel({ workspaceId, workspaceSlug, session }) {
  const numericWorkspaceId = workspaceId ? Number(workspaceId) : null;
  const actorId = session?.id ?? null;

  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState(null);

  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState(null);

  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [threadDetail, setThreadDetail] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState(null);
  const [messages, setMessages] = useState([]);

  const [composer, setComposer] = useState('');
  const [sending, setSending] = useState(false);

  const [newThread, setNewThread] = useState({ subject: '', participantId: '' });
  const [creating, setCreating] = useState(false);
  const [creationStatus, setCreationStatus] = useState(null);

  const loadOverview = useCallback(async () => {
    if (!numericWorkspaceId) {
      return;
    }
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const response = await fetchCompanyInboxOverview({ workspaceId: numericWorkspaceId, lookbackDays: 30 });
      setOverview(response);
    } catch (error) {
      setOverviewError(error);
    } finally {
      setOverviewLoading(false);
    }
  }, [numericWorkspaceId]);

  const loadThreads = useCallback(async () => {
    if (!numericWorkspaceId) {
      setThreads([]);
      return;
    }
    setThreadsLoading(true);
    setThreadsError(null);
    try {
      const response = await fetchCompanyInboxThreads({
        workspaceId: numericWorkspaceId,
        lookbackDays: 30,
        filters: { channelTypes: ['direct', 'group', 'project'] },
        pagination: { pageSize: 12 },
      });
      setThreads(response?.threads ?? []);
      if (!selectedThreadId && response?.threads?.length) {
        setSelectedThreadId(response.threads[0].id);
      }
    } catch (error) {
      setThreadsError(error);
    } finally {
      setThreadsLoading(false);
    }
  }, [numericWorkspaceId, selectedThreadId]);

  const loadThread = useCallback(
    async (threadId) => {
      if (!numericWorkspaceId || !threadId) {
        return;
      }
      setThreadLoading(true);
      setThreadError(null);
      try {
        const response = await fetchCompanyInboxThread(threadId, { workspaceId: numericWorkspaceId, workspaceSlug });
        setThreadDetail(response?.thread ?? null);
        setMessages(response?.messages ?? []);
        if (actorId) {
          await markThreadRead(threadId, { userId: actorId });
        }
      } catch (error) {
        setThreadError(error);
      } finally {
        setThreadLoading(false);
      }
    },
    [numericWorkspaceId, workspaceSlug, actorId],
  );

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (selectedThreadId) {
      loadThread(selectedThreadId);
    } else {
      setThreadDetail(null);
      setMessages([]);
    }
  }, [selectedThreadId, loadThread]);

  const members = overview?.members ?? [];
  const participantOptions = useMemo(
    () => members.map((member) => ({ value: member.userId, label: `${member.name} (${member.email})` })),
    [members],
  );

  const handleSendMessage = async () => {
    if (!selectedThreadId || !composer.trim()) {
      return;
    }
    setSending(true);
    try {
      await sendMessage(selectedThreadId, { userId: actorId ?? undefined, body: composer.trim() });
      setComposer('');
      await loadThread(selectedThreadId);
    } catch (error) {
      setThreadError(error);
    } finally {
      setSending(false);
    }
  };

  const handleCreateThread = async (event) => {
    event.preventDefault();
    if (!numericWorkspaceId || !newThread.subject.trim() || !newThread.participantId) {
      return;
    }
    setCreating(true);
    setCreationStatus(null);
    try {
      const thread = await createThread({
        userId: actorId ?? undefined,
        subject: newThread.subject.trim(),
        channelType: 'direct',
        participantIds: [Number(newThread.participantId)],
        metadata: { workspaceId: numericWorkspaceId, origin: 'dashboard_inbox' },
      });
      if (thread?.id) {
        setNewThread({ subject: '', participantId: '' });
        setCreationStatus({ type: 'success', message: 'Conversation started.' });
        setSelectedThreadId(thread.id);
        await loadThreads();
      }
    } catch (error) {
      const message = error?.body?.message ?? error?.message ?? 'Unable to start conversation.';
      setCreationStatus({ type: 'error', message });
    } finally {
      setCreating(false);
    }
  };

  const metrics = overview?.metrics ?? {};

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Workspace inbox</h3>
          <p className="text-sm text-slate-600">
            Stay current on project updates, recruiter conversations, and stakeholder loops across the workspace.
          </p>
        </div>
        <button
          type="button"
          onClick={loadOverview}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
        >
          <ArrowPathIcon className="h-4 w-4" /> Refresh
        </button>
      </div>

      <DataStatus loading={overviewLoading} error={overviewError}>
        <div className="grid gap-4 md:grid-cols-3">
          <InboxMetric label="Threads" value={metrics.totalThreads ?? 0} icon={ChatBubbleLeftRightIcon} />
          <InboxMetric label="Unread" value={metrics.unreadThreads ?? 0} icon={EnvelopeOpenIcon} />
          <InboxMetric label="Awaiting response" value={metrics.awaitingResponse ?? 0} icon={ChatBubbleLeftRightIcon} />
        </div>
      </DataStatus>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <DataStatus loading={threadsLoading} error={threadsError} empty={!threadsLoading && !threads.length}>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-900">Start conversation</h4>
              <p className="mt-1 text-xs text-slate-500">Ping a teammate or recruiter without leaving the dashboard.</p>
              {creationStatus ? (
                <div
                  className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${
                    creationStatus.type === 'error'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  {creationStatus.message}
                </div>
              ) : null}
              <form className="mt-3 space-y-3" onSubmit={handleCreateThread}>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</label>
                  <input
                    value={newThread.subject}
                    onChange={(event) => setNewThread((prev) => ({ ...prev, subject: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="Conversation topic"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Participant</label>
                  <select
                    value={newThread.participantId}
                    onChange={(event) => setNewThread((prev) => ({ ...prev, participantId: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    required
                  >
                    <option value="">Select workspace member</option>
                    {participantOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                >
                  <PlusIcon className="h-4 w-4" />
                  {creating ? 'Creating…' : 'Start thread'}
                </button>
              </form>
            </div>

            <div className="space-y-3">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    thread.id === selectedThreadId
                      ? 'border-indigo-400 bg-indigo-50 shadow-soft'
                      : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{thread.subject ?? 'Conversation'}</p>
                      <p className="mt-1 text-xs text-slate-500">{thread.lastMessagePreview || 'No updates yet'}</p>
                    </div>
                    {thread.unread ? (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                        Unread
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>{thread.channelType}</span>
                    <span aria-hidden="true">•</span>
                    <span>{new Date(thread.lastMessageAt ?? thread.createdAt).toLocaleString()}</span>
                    {thread.workspaceParticipants?.[0]?.user?.firstName ? (
                      <span>
                        With {thread.workspaceParticipants[0].user.firstName}{' '}
                        {thread.workspaceParticipants[0].user.lastName}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DataStatus>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          {threadError ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
              {threadError.body?.message ?? threadError.message ?? 'Unable to load conversation.'}
            </div>
          ) : null}

          {threadLoading ? <p className="text-sm text-slate-500">Loading thread…</p> : null}

          {!threadLoading && !threadDetail ? (
            <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500">
              Select a thread to view the conversation.
            </div>
          ) : null}

          {threadDetail ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-slate-900">{threadDetail.subject ?? 'Conversation'}</h4>
                <p className="text-xs text-slate-500">Thread #{threadDetail.id}</p>
              </div>

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
                {messages.length ? (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <Message key={message.id} message={message} isOwn={message.author?.id === actorId} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">No messages yet.</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reply</label>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <textarea
                    value={composer}
                    onChange={(event) => setComposer(event.target.value)}
                    className="min-h-[120px] flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    placeholder="Share an update with the conversation participants."
                  />
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={sending || !composer.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                    {sending ? 'Sending…' : 'Send message'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

DashboardInboxPanel.defaultProps = {
  workspaceId: null,
  workspaceSlug: null,
  session: null,
};

DashboardInboxPanel.propTypes = {
  workspaceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  workspaceSlug: PropTypes.string,
  session: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
};


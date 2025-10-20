import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon, PlusIcon } from '@heroicons/react/24/outline';
import DataStatus from '../../DataStatus.jsx';
import {
  fetchCompanyInboxOverview,
  fetchCompanyInboxThreads,
  fetchCompanyInboxThread,
} from '../../../services/companyInbox.js';
import {
  assignSupport,
  createThread,
  sendMessage,
  updateSupportStatus,
  markThreadRead,
} from '../../../services/messaging.js';

const SUPPORT_STATUS_OPTIONS = [
  { value: 'triage', label: 'Triage' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'waiting_on_customer', label: 'Waiting on customer' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_LABELS = {
  low: { label: 'Low', tone: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  medium: { label: 'Medium', tone: 'bg-amber-50 text-amber-600 border-amber-100' },
  high: { label: 'High', tone: 'bg-rose-50 text-rose-600 border-rose-100' },
};

function SupportMetric({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}

function MessageBubble({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
          isOwn ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
        }`}
      >
        <p className="font-semibold">
          {message.author?.firstName || message.author?.email || (isOwn ? 'You' : 'Support agent')}
        </p>
        <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
        <p className={`mt-1 text-xs ${isOwn ? 'text-blue-100' : 'text-slate-500'}`}>
          {new Date(message.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default function DashboardSupportPanel({ workspaceId, workspaceSlug, session }) {
  const numericWorkspaceId = workspaceId ? Number(workspaceId) : null;
  const actorId = session?.id ?? null;

  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState(null);

  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState(null);

  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState(null);
  const [threadDetail, setThreadDetail] = useState(null);
  const [messages, setMessages] = useState([]);

  const [composer, setComposer] = useState('');
  const [sending, setSending] = useState(false);

  const [creating, setCreating] = useState(false);
  const [newCase, setNewCase] = useState({ subject: '', message: '', priority: 'medium' });
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
        filters: { channelTypes: ['support'] },
        pagination: { pageSize: 10 },
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

  const loadThreadDetail = useCallback(
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
      loadThreadDetail(selectedThreadId);
    } else {
      setThreadDetail(null);
      setMessages([]);
    }
  }, [selectedThreadId, loadThreadDetail]);

  const members = overview?.members ?? [];
  const agentOptions = useMemo(
    () => members.map((member) => ({ value: member.userId, label: `${member.name} (${member.email})` })),
    [members],
  );

  const handleUpdateStatus = async (status) => {
    if (!selectedThreadId || !status) {
      return;
    }
    try {
      await updateSupportStatus(selectedThreadId, { userId: actorId ?? undefined, status });
      await Promise.all([loadThreadDetail(selectedThreadId), loadOverview(), loadThreads()]);
    } catch (error) {
      setThreadError(error);
    }
  };

  const handleAssignAgent = async (agentId) => {
    if (!selectedThreadId) {
      return;
    }
    try {
      await assignSupport(selectedThreadId, { userId: actorId ?? undefined, agentId: agentId ? Number(agentId) : null });
      await Promise.all([loadThreadDetail(selectedThreadId), loadOverview(), loadThreads()]);
    } catch (error) {
      setThreadError(error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedThreadId || !composer.trim()) {
      return;
    }
    setSending(true);
    try {
      await sendMessage(selectedThreadId, { userId: actorId ?? undefined, body: composer.trim() });
      setComposer('');
      await loadThreadDetail(selectedThreadId);
    } catch (error) {
      setThreadError(error);
    } finally {
      setSending(false);
    }
  };

  const handleCreateCase = async (event) => {
    event.preventDefault();
    if (!numericWorkspaceId || !newCase.subject.trim() || !newCase.message.trim()) {
      return;
    }
    setCreating(true);
    setCreationStatus(null);
    try {
      const thread = await createThread({
        userId: actorId ?? undefined,
        subject: newCase.subject.trim(),
        channelType: 'support',
        metadata: {
          workspaceId: numericWorkspaceId,
          priority: newCase.priority,
          createdVia: 'dashboard',
        },
      });
      if (thread?.id) {
        await sendMessage(thread.id, {
          userId: actorId ?? undefined,
          body: newCase.message.trim(),
          metadata: { origin: 'dashboard_support' },
        });
        setSelectedThreadId(thread.id);
        setNewCase({ subject: '', message: '', priority: 'medium' });
        setCreationStatus({ type: 'success', message: 'Support case created.' });
        await Promise.all([loadThreads(), loadOverview()]);
      }
    } catch (error) {
      const message = error?.body?.message ?? error?.message ?? 'Unable to create support case.';
      setCreationStatus({ type: 'error', message });
    } finally {
      setCreating(false);
    }
  };

  const supportMetrics = overview?.metrics ?? {};

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Support desk</h3>
          <p className="text-sm text-slate-600">
            Track escalations, SLA risk, and team responsiveness across the company workspace support queue.
          </p>
        </div>
        <button
          type="button"
          onClick={loadOverview}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
        >
          <ArrowPathIcon className="h-4 w-4" /> Refresh
        </button>
      </div>

      <DataStatus loading={overviewLoading} error={overviewError}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <SupportMetric label="Open cases" value={supportMetrics.supportOpen ?? 0} helper="Across all support queues" />
          <SupportMetric
            label="Waiting on customer"
            value={supportMetrics.supportWaiting ?? 0}
            helper="Awaiting requester response"
          />
          <SupportMetric
            label="Resolved (7d)"
            value={supportMetrics.supportResolvedLast7Days ?? 0}
            helper="Cases closed in the last 7 days"
          />
          <SupportMetric
            label="Avg first response"
            value={supportMetrics.averageFirstResponseMinutes ? `${Math.round(supportMetrics.averageFirstResponseMinutes)} min` : '—'}
            helper="Median minutes to first reply"
          />
        </div>
      </DataStatus>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <DataStatus loading={threadsLoading} error={threadsError} empty={!threadsLoading && !threads.length}>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-900">Create new case</h4>
              <p className="mt-1 text-xs text-slate-500">Log an escalation and assign it without leaving the dashboard.</p>
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
              <form className="mt-4 space-y-3" onSubmit={handleCreateCase}>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</label>
                  <input
                    type="text"
                    value={newCase.subject}
                    onChange={(event) => setNewCase((prev) => ({ ...prev, subject: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Request title"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</label>
                  <select
                    value={newCase.priority}
                    onChange={(event) => setNewCase((prev) => ({ ...prev, priority: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {Object.entries(PRIORITY_LABELS).map(([key, meta]) => (
                      <option key={key} value={key}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message</label>
                  <textarea
                    value={newCase.message}
                    onChange={(event) => setNewCase((prev) => ({ ...prev, message: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    rows={3}
                    placeholder="Describe the issue, timeline, and desired outcome."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  <PlusIcon className="h-4 w-4" />
                  {creating ? 'Submitting…' : 'Submit case'}
                </button>
              </form>
            </div>

            <div className="space-y-3">
              {threads.map((thread) => {
                const priority = thread.supportCase?.priority ?? 'medium';
                const tone = PRIORITY_LABELS[priority] ?? PRIORITY_LABELS.medium;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      thread.id === selectedThreadId
                        ? 'border-blue-400 bg-blue-50 shadow-soft'
                        : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{thread.subject ?? 'Support case'}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {thread.lastMessagePreview || 'No updates yet'}
                        </p>
                      </div>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone.tone}`}>
                        {tone.label}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>{thread.supportCase?.status?.replace(/_/g, ' ') ?? 'New'}</span>
                      <span aria-hidden="true">•</span>
                      <span>{new Date(thread.lastMessageAt ?? thread.createdAt).toLocaleString()}</span>
                      {thread.unread ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                          <ChatBubbleLeftRightIcon className="h-3 w-3" /> Awaiting reply
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </DataStatus>

        <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          {threadError ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
              {threadError.body?.message ?? threadError.message ?? 'Unable to load support case.'}
            </div>
          ) : null}
          {threadLoading ? <p className="text-sm text-slate-500">Loading support case…</p> : null}
          {!threadLoading && !threadDetail ? (
            <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500">
              Select a support case to view details.
            </div>
          ) : null}

          {threadDetail ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">{threadDetail.subject ?? 'Support case'}</h4>
                  <p className="text-xs text-slate-500">Thread #{threadDetail.id}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={threadDetail.supportCase?.status ?? 'triage'}
                    onChange={(event) => handleUpdateStatus(event.target.value)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {SUPPORT_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={threadDetail.supportCase?.assignedTo ?? ''}
                    onChange={(event) => handleAssignAgent(event.target.value)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Unassigned</option>
                    {agentOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
                {messages.length ? (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} isOwn={message.author?.id === actorId} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">No messages yet. Start the conversation below.</p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reply</label>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <textarea
                    value={composer}
                    onChange={(event) => setComposer(event.target.value)}
                    className="min-h-[120px] flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Share an update, request details, or confirm resolution."
                  />
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={sending || !composer.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                    {sending ? 'Sending…' : 'Send reply'}
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

DashboardSupportPanel.defaultProps = {
  workspaceId: null,
  workspaceSlug: null,
  session: null,
};


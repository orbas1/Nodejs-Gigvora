import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowPathIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  InboxArrowDownIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import {
  fetchAdminInbox,
  updateAdminThreadState,
  escalateAdminThread,
  createAdminThread,
  listSupportAgents,
} from '../../../services/adminMessaging.js';
import AdminInboxCreateThreadForm from './AdminInboxCreateThreadForm.jsx';
import { classNames } from '../../../utils/classNames.js';

const THREAD_STATES = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'locked', label: 'Locked' },
];

const PRIORITY_OPTIONS = [
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

function resolveAgentName(agentLookup, supportCase) {
  if (!supportCase) {
    return 'Unassigned';
  }
  if (supportCase.assignedAgentId && agentLookup.has(supportCase.assignedAgentId)) {
    return agentLookup.get(supportCase.assignedAgentId);
  }
  if (supportCase.assignedAgentName) {
    return supportCase.assignedAgentName;
  }
  if (supportCase.assignedAgentEmail) {
    return supportCase.assignedAgentEmail;
  }
  return 'Unassigned';
}

function SupportBadge({ status }) {
  if (!status) {
    return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">No case</span>;
  }
  const tone = {
    triage: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-sky-100 text-sky-700',
    waiting_on_customer: 'bg-violet-100 text-violet-700',
    resolved: 'bg-emerald-100 text-emerald-700',
    closed: 'bg-slate-200 text-slate-600',
  }[status];
  return (
    <span className={classNames('rounded-full px-2 py-0.5 text-xs font-semibold capitalize', tone ?? 'bg-slate-100 text-slate-600')}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function PriorityBadge({ priority }) {
  if (!priority) {
    return null;
  }
  const tone = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-amber-100 text-amber-700',
    urgent: 'bg-rose-100 text-rose-700',
  }[priority];
  return (
    <span className={classNames('rounded-full px-2 py-0.5 text-xs font-semibold capitalize', tone ?? 'bg-slate-100 text-slate-600')}>
      {priority}
    </span>
  );
}

function formatRelativeTime(value) {
  if (!value) {
    return '—';
  }
  const timestamp = new Date(value);
  const diff = Date.now() - timestamp.getTime();
  const minutes = Math.round(diff / (1000 * 60));
  if (minutes < 1) {
    return 'moments ago';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.round(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  return timestamp.toLocaleDateString();
}

export default function AdminInboxQueueSnapshot({ onThreadCreated }) {
  const [threadsState, setThreadsState] = useState({ items: [], loading: false, error: null, metrics: null });
  const [escalationDrafts, setEscalationDrafts] = useState(new Map());
  const [feedback, setFeedback] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [agents, setAgents] = useState([]);

  const agentLookup = useMemo(() => {
    const map = new Map();
    agents.forEach((agent) => {
      const name = `${agent.firstName ?? ''} ${agent.lastName ?? ''}`.trim();
      map.set(agent.id, name || agent.email || `Agent ${agent.id}`);
    });
    return map;
  }, [agents]);

  const loadAgents = useCallback(async () => {
    try {
      const response = await listSupportAgents();
      setAgents(response ?? []);
    } catch (error) {
      // ignore agent lookup errors
    }
  }, []);

  const loadThreads = useCallback(async () => {
    setThreadsState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetchAdminInbox({ page: 1, pageSize: 6 });
      setThreadsState({
        items: response?.data ?? [],
        loading: false,
        error: null,
        metrics: response?.metrics ?? null,
      });
    } catch (error) {
      setThreadsState((prev) => ({
        ...prev,
        loading: false,
        error: error?.body?.message ?? error?.message ?? 'Unable to load inbox snapshot.',
      }));
    }
  }, []);

  useEffect(() => {
    loadThreads();
    loadAgents();
  }, [loadThreads, loadAgents]);

  const updateThread = useCallback((threadId, patch) => {
    setThreadsState((prev) => ({
      ...prev,
      items: prev.items.map((thread) => (thread.id === threadId ? { ...thread, ...patch } : thread)),
    }));
  }, []);

  const handleStateChange = useCallback(
    async (threadId, state) => {
      if (!state) {
        return;
      }
      try {
        const thread = await updateAdminThreadState(threadId, { state });
        updateThread(threadId, thread);
        setFeedback({ type: 'success', message: 'Thread state updated.' });
      } catch (error) {
        setFeedback({ type: 'error', message: error?.body?.message ?? error?.message ?? 'Unable to update state.' });
      }
    },
    [updateThread],
  );

  const handleEscalationDraftChange = useCallback((threadId, patch) => {
    setEscalationDrafts((previous) => {
      const next = new Map(previous);
      const current = next.get(threadId) ?? { reason: '', priority: 'high' };
      next.set(threadId, { ...current, ...patch });
      return next;
    });
  }, []);

  const handleEscalate = useCallback(
    async (threadId) => {
      const draft = escalationDrafts.get(threadId) ?? { reason: '', priority: 'high' };
      try {
        const supportCase = await escalateAdminThread(threadId, {
          reason: draft.reason?.trim() || 'Admin escalation from dashboard',
          priority: draft.priority || 'high',
        });
        updateThread(threadId, { supportCase, escalatedAt: supportCase?.escalatedAt ?? new Date().toISOString() });
        setFeedback({ type: 'success', message: 'Thread escalated to support.' });
      } catch (error) {
        setFeedback({ type: 'error', message: error?.body?.message ?? error?.message ?? 'Unable to escalate thread.' });
      }
    },
    [escalationDrafts, updateThread],
  );

  const handleCreateThread = useCallback(
    async (payload) => {
      setCreating(true);
      try {
        const thread = await createAdminThread(payload);
        setFeedback({ type: 'success', message: 'Conversation created.' });
        setShowCreateForm(false);
        setThreadsState((prev) => ({
          ...prev,
          items: [thread, ...prev.items].slice(0, 6),
        }));
        if (typeof onThreadCreated === 'function') {
          onThreadCreated(thread);
        }
      } catch (error) {
        setFeedback({ type: 'error', message: error?.body?.message ?? error?.message ?? 'Unable to create conversation.' });
      } finally {
        setCreating(false);
        loadThreads();
      }
    },
    [loadThreads, onThreadCreated],
  );

  const activeCount = useMemo(() => threadsState.items.filter((thread) => thread.state === 'active').length, [threadsState.items]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">Inbox queue</p>
          <p className="text-xs text-slate-500">Latest escalations and ownership. Update state or escalate without leaving the dashboard.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark"
          >
            <PaperAirplaneIcon className="h-4 w-4" /> New thread
          </button>
          <button
            type="button"
            onClick={loadThreads}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
          >
            <ArrowPathIcon className={classNames('h-4 w-4', threadsState.loading ? 'animate-spin' : '')} /> Refresh
          </button>
        </div>
      </div>

      {feedback ? (
        <div
          className={classNames(
            'mt-3 rounded-2xl border px-4 py-3 text-sm',
            feedback.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700',
          )}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active conversations</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{activeCount}</p>
          <p className="mt-1 text-xs text-slate-500">{threadsState.metrics?.channels?.support ?? 0} support threads</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Awaiting response</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{threadsState.metrics?.supportStatuses?.waiting_on_customer ?? 0}</p>
          <p className="mt-1 text-xs text-slate-500">Keep tabs on members awaiting follow-up.</p>
        </div>
      </div>

      {threadsState.error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{threadsState.error}</div>
      ) : null}

      <ul className="mt-4 space-y-3">
        {threadsState.items.map((thread) => {
          const supportCase = thread.supportCase ?? null;
          const draft = escalationDrafts.get(thread.id) ?? { reason: '', priority: supportCase?.priority ?? 'high' };
          return (
            <li key={thread.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <InboxArrowDownIcon className="h-4 w-4" />
                    </span>
                    <p className="text-sm font-semibold text-slate-800">{thread.subject || 'Untitled conversation'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>#{thread.id}</span>
                    <span>Last activity {formatRelativeTime(thread.lastMessageAt)}</span>
                    <span>{resolveAgentName(agentLookup, supportCase)}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <SupportBadge status={supportCase?.status} />
                  <PriorityBadge priority={supportCase?.priority} />
                  <select
                    value={thread.state}
                    onChange={(event) => handleStateChange(thread.id, event.target.value)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {THREAD_STATES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <a
                    href={`/dashboard/admin/inbox?thread=${thread.id}`}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:border-blue-300"
                  >
                    Open
                  </a>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
                <textarea
                  rows={2}
                  value={draft.reason}
                  onChange={(event) => handleEscalationDraftChange(thread.id, { reason: event.target.value })}
                  placeholder="Add escalation notes"
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <div className="flex flex-col gap-2">
                  <select
                    value={draft.priority}
                    onChange={(event) => handleEscalationDraftChange(thread.id, { priority: event.target.value })}
                    className="rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleEscalate(thread.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-3 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-amber-600"
                  >
                    <ExclamationTriangleIcon className="h-4 w-4" /> Escalate
                  </button>
                </div>
              </div>
            </li>
          );
        })}
        {!threadsState.loading && !threadsState.items.length ? (
          <li className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
            Queue is clear. New conversations will appear here automatically.
          </li>
        ) : null}
      </ul>

      {threadsState.loading ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">
          <BoltIcon className="h-4 w-4 animate-spin" /> Loading inbox…
        </div>
      ) : null}

      <AdminInboxCreateThreadForm
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onCreate={handleCreateThread}
        busy={creating}
      />
    </div>
  );
}

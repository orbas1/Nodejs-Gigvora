
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  FunnelIcon,
  PaperAirplaneIcon,
  PlusIcon,
  TagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DataStatus from '../../components/DataStatus.jsx';
import ConversationMessage from '../../components/messaging/ConversationMessage.jsx';
import SummaryCards from '../../components/companyInbox/SummaryCards.jsx';
import ThreadCard from '../../components/companyInbox/ThreadCard.jsx';
import EmptyState from '../../components/companyInbox/EmptyState.jsx';
import LabelManagerModal from '../../components/companyInbox/LabelManagerModal.jsx';
import NewThreadModal from '../../components/companyInbox/NewThreadModal.jsx';
import FilterDrawer from '../../components/companyInbox/FilterDrawer.jsx';
import useSession from '../../hooks/useSession.js';
import { formatRelativeTime } from '../../utils/date.js';
import { classNames } from '../../utils/classNames.js';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../constants/companyDashboardMenu.js';
import {
  fetchCompanyInboxOverview,
  fetchCompanyInboxThreads,
  fetchCompanyInboxThread,
  fetchCompanyInboxLabels,
  createCompanyInboxLabel,
  updateCompanyInboxLabel,
  deleteCompanyInboxLabel,
  setCompanyThreadLabels,
  fetchCompanyInboxMembers,
} from '../../services/companyInbox.js';
import {
  sendMessage,
  createThread,
  updateThreadState,
  escalateThread,
  assignSupportAgent,
  updateSupportStatus,
  markThreadRead,
} from '../../services/messaging.js';

const LOOKBACK_OPTIONS = [14, 30, 60, 90];
const CHANNEL_OPTIONS = [
  { value: 'direct', label: 'Direct' },
  { value: 'group', label: 'Group' },
  { value: 'project', label: 'Project' },
  { value: 'support', label: 'Support' },
  { value: 'contract', label: 'Contract' },
];
const STATE_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'locked', label: 'Locked' },
];
const SUPPORT_STATUS_OPTIONS = [
  { value: 'triage', label: 'Triage' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'waiting_on_customer', label: 'Waiting on customer' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];
const availableDashboards = ['company', 'headhunter', 'user', 'agency'];
const THREAD_PAGE_SIZE = 20;

function createDefaultFilters() {
  return {
    search: '',
    channelTypes: [],
    states: [],
    labelIds: [],
    supportStatuses: [],
    unreadOnly: false,
  };
}

export default function CompanyInboxPage() {
  const { session, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const workspaceIdParam = searchParams.get('workspaceId');
  const lookbackParam = searchParams.get('lookbackDays');
  const lookbackDays = lookbackParam ? Number(lookbackParam) : 30;

  const membershipsList = session?.memberships ?? [];
  const isCompanyMember = isAuthenticated && membershipsList.includes('company');
  const actorId = session?.id ?? null;

  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState(null);

  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState(null);
  const [threadPagination, setThreadPagination] = useState({ page: 1, pageSize: THREAD_PAGE_SIZE, total: 0, totalPages: 1 });

  const [filters, setFilters] = useState(() => createDefaultFilters());
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [labels, setLabels] = useState([]);
  const [labelManagerOpen, setLabelManagerOpen] = useState(false);
  const [labelBusy, setLabelBusy] = useState(false);

  const [members, setMembers] = useState([]);
  const [membersError, setMembersError] = useState(null);

  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [threadDetail, setThreadDetail] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState(null);
  const [messages, setMessages] = useState([]);

  const [composer, setComposer] = useState('');
  const [sending, setSending] = useState(false);

  const [newThreadOpen, setNewThreadOpen] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (!isCompanyMember) {
      const fallback = session?.primaryDashboard ?? membershipsList.find((role) => role !== 'company');
      if (fallback) {
        navigate(`/dashboard/${fallback}`, { replace: true, state: { from: '/dashboard/company/inbox' } });
      }
    }
  }, [isAuthenticated, isCompanyMember, navigate, session?.primaryDashboard, membershipsList]);

  const effectiveWorkspaceId = useMemo(() => {
    if (workspaceIdParam) {
      return Number(workspaceIdParam);
    }
    return overview?.workspace?.id ?? null;
  }, [workspaceIdParam, overview?.workspace?.id]);

  const loadOverview = useCallback(async () => {
    if (!isCompanyMember) {
      return;
    }
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const response = await fetchCompanyInboxOverview({
        workspaceId: workspaceIdParam ? Number(workspaceIdParam) : undefined,
        lookbackDays,
      });
      setOverview(response);
      setLabels(response.labels ?? []);
      setMembers(response.members ?? []);
    } catch (error) {
      setOverviewError(error);
    } finally {
      setOverviewLoading(false);
    }
  }, [isCompanyMember, workspaceIdParam, lookbackDays]);

  const loadMembers = useCallback(async () => {
    if (!effectiveWorkspaceId) {
      return;
    }
    try {
      const response = await fetchCompanyInboxMembers({ workspaceId: effectiveWorkspaceId });
      setMembers(response ?? []);
      setMembersError(null);
    } catch (error) {
      setMembersError(error);
    }
  }, [effectiveWorkspaceId]);

  useEffect(() => {
    if (isCompanyMember) {
      loadOverview();
    }
  }, [isCompanyMember, loadOverview]);

  useEffect(() => {
    if (!workspaceIdParam && overview?.workspace?.id) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('workspaceId', `${overview.workspace.id}`);
        return next;
      }, { replace: true });
    }
  }, [overview?.workspace?.id, workspaceIdParam, setSearchParams]);

  const loadThreads = useCallback(
    async (page = threadPagination.page) => {
      if (!isCompanyMember || !effectiveWorkspaceId) {
        setThreads([]);
        return;
      }
      setThreadsLoading(true);
      setThreadsError(null);
      try {
        const response = await fetchCompanyInboxThreads({
          workspaceId: effectiveWorkspaceId,
          lookbackDays,
          filters,
          pagination: { page, pageSize: threadPagination.pageSize },
        });
        const data = Array.isArray(response?.data) ? response.data : [];
        setThreads(data);
        setThreadPagination(response?.pagination ?? {
          page,
          pageSize: threadPagination.pageSize,
          total: data.length,
          totalPages: data.length ? 1 : 0,
        });
        if (!selectedThreadId && data.length) {
          setSelectedThreadId(data[0].id);
        } else if (selectedThreadId && data.every((thread) => thread.id !== selectedThreadId)) {
          setSelectedThreadId(data.length ? data[0].id : null);
        }
      } catch (error) {
        setThreadsError(error);
        setThreads([]);
      } finally {
        setThreadsLoading(false);
      }
    },
    [isCompanyMember, effectiveWorkspaceId, lookbackDays, filters, threadPagination.pageSize, selectedThreadId],
  );

  useEffect(() => {
    if (effectiveWorkspaceId) {
      loadThreads(1);
      loadMembers();
    }
  }, [effectiveWorkspaceId, loadThreads, loadMembers]);

  useEffect(() => {
    if (!effectiveWorkspaceId) {
      return;
    }
    const interval = window.setInterval(() => {
      loadThreads(threadPagination.page);
    }, 60000);
    return () => window.clearInterval(interval);
  }, [effectiveWorkspaceId, loadThreads, threadPagination.page]);

  const loadThreadDetail = useCallback(
    async (threadId) => {
      if (!threadId || !effectiveWorkspaceId) {
        setThreadDetail(null);
        setMessages([]);
        return;
      }
      setThreadLoading(true);
      setThreadError(null);
      try {
        const response = await fetchCompanyInboxThread(threadId, { workspaceId: effectiveWorkspaceId });
        setThreadDetail(response?.thread ?? null);
        setMessages(Array.isArray(response?.messages) ? response.messages : []);
        if (actorId) {
          await markThreadRead(threadId, { userId: actorId });
        }
      } catch (error) {
        setThreadError(error);
        setThreadDetail(null);
        setMessages([]);
      } finally {
        setThreadLoading(false);
      }
    },
    [effectiveWorkspaceId, actorId],
  );

  useEffect(() => {
    if (selectedThreadId) {
      loadThreadDetail(selectedThreadId);
    }
  }, [selectedThreadId, loadThreadDetail]);

  useEffect(() => {
    setComposer('');
  }, [selectedThreadId]);

  const handleWorkspaceChange = (event) => {
    const nextWorkspaceId = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (nextWorkspaceId) {
      next.set('workspaceId', nextWorkspaceId);
    } else {
      next.delete('workspaceId');
    }
    setSearchParams(next);
  };

  const handleLookbackChange = (event) => {
    const nextLookback = event.target.value;
    const next = new URLSearchParams(searchParams);
    if (nextLookback) {
      next.set('lookbackDays', nextLookback);
    } else {
      next.delete('lookbackDays');
    }
    setSearchParams(next);
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setThreadPagination((prev) => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    setFilters(createDefaultFilters());
    setThreadPagination((prev) => ({ ...prev, page: 1 }));
  };

  useEffect(() => {
    loadThreads(1);
  }, [filters, loadThreads]);

  const handleLabelToggle = async (labelId) => {
    if (!threadDetail) return;
    const activeLabels = threadDetail.labels?.map((label) => label.id) ?? [];
    const nextLabelIds = activeLabels.includes(labelId)
      ? activeLabels.filter((id) => id !== labelId)
      : [...activeLabels, labelId];
    try {
      setLabelBusy(true);
      const updated = await setCompanyThreadLabels(threadDetail.id, {
        workspaceId: effectiveWorkspaceId,
        labelIds: nextLabelIds,
        actorId,
      });
      setThreadDetail(updated);
      loadThreads(threadPagination.page);
    } catch (error) {
      console.error(error);
    } finally {
      setLabelBusy(false);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!selectedThreadId || !composer.trim()) {
      return;
    }
    try {
      setSending(true);
      await sendMessage(selectedThreadId, {
        userId: actorId,
        body: composer.trim(),
        messageType: 'text',
      });
      setComposer('');
      await loadThreadDetail(selectedThreadId);
      await loadThreads(threadPagination.page);
    } catch (error) {
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleThreadStateChange = async (nextState) => {
    if (!selectedThreadId) return;
    try {
      await updateThreadState(selectedThreadId, { state: nextState });
      await loadThreadDetail(selectedThreadId);
      await loadThreads(threadPagination.page);
    } catch (error) {
      console.error(error);
    }
  };

  const handleEscalate = async ({ reason, priority }) => {
    if (!selectedThreadId) return;
    try {
      await escalateThread(selectedThreadId, {
        userId: actorId,
        reason,
        priority,
      });
      await loadThreadDetail(selectedThreadId);
      await loadThreads(threadPagination.page);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAssignSupport = async (agentId) => {
    if (!selectedThreadId) return;
    try {
      await assignSupportAgent(selectedThreadId, {
        userId: actorId,
        agentId: agentId ?? null,
        notifyAgent: true,
      });
      await loadThreadDetail(selectedThreadId);
      await loadThreads(threadPagination.page);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSupportStatusUpdate = async ({ status, resolutionSummary }) => {
    if (!selectedThreadId) return;
    try {
      await updateSupportStatus(selectedThreadId, {
        userId: actorId,
        status,
        resolutionSummary,
      });
      await loadThreadDetail(selectedThreadId);
      await loadThreads(threadPagination.page);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateThread = async ({ subject, channelType, participantIds, initialMessage }) => {
    try {
      setCreatingThread(true);
      const thread = await createThread({
        userId: actorId,
        subject,
        channelType,
        participantIds,
      });
      if (initialMessage) {
        await sendMessage(thread.id, {
          userId: actorId,
          body: initialMessage,
          messageType: 'text',
        });
      }
      setNewThreadOpen(false);
      setComposer('');
      await loadThreads(1);
      setSelectedThreadId(thread.id);
    } catch (error) {
      console.error(error);
    } finally {
      setCreatingThread(false);
    }
  };

  const handleCreateLabel = async (payload) => {
    if (!effectiveWorkspaceId) return;
    try {
      setLabelBusy(true);
      await createCompanyInboxLabel({ workspaceId: effectiveWorkspaceId, ...payload });
      const refreshed = await fetchCompanyInboxLabels({ workspaceId: effectiveWorkspaceId });
      setLabels(refreshed ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLabelBusy(false);
    }
  };

  const handleUpdateLabel = async (labelId, payload) => {
    if (!effectiveWorkspaceId) return;
    try {
      setLabelBusy(true);
      await updateCompanyInboxLabel(labelId, { workspaceId: effectiveWorkspaceId, ...payload });
      const refreshed = await fetchCompanyInboxLabels({ workspaceId: effectiveWorkspaceId });
      setLabels(refreshed ?? []);
      await loadThreadDetail(selectedThreadId);
      await loadThreads(threadPagination.page);
    } catch (error) {
      console.error(error);
    } finally {
      setLabelBusy(false);
    }
  };

  const handleDeleteLabel = async (labelId) => {
    if (!effectiveWorkspaceId) return;
    try {
      setLabelBusy(true);
      await deleteCompanyInboxLabel(labelId, { workspaceId: effectiveWorkspaceId });
      const refreshed = await fetchCompanyInboxLabels({ workspaceId: effectiveWorkspaceId });
      setLabels(refreshed ?? []);
      await loadThreadDetail(selectedThreadId);
      await loadThreads(threadPagination.page);
    } catch (error) {
      console.error(error);
    } finally {
      setLabelBusy(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (!isCompanyMember) {
    return (
      <DashboardLayout
        currentDashboard="company"
        title="Company Inbox"
        subtitle="Workspace communications"
        menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
        availableDashboards={membershipsList.filter((membership) => membership !== 'company')}
      >
        <EmptyState
          title="Company access required"
          description="Switch to another dashboard or contact an administrator to request company workspace access."
        />
      </DashboardLayout>
    );
  }

  const workspaceOptions = overview?.meta?.availableWorkspaces ?? [];
  const summaryMetrics = overview?.metrics ?? {};

  const profile = useMemo(() => {
    if (!overview?.workspace) {
      return null;
    }
    const workspace = overview.workspace;
    return {
      name: workspace.name,
      role: 'Inbox workspace',
      initials: workspace.name
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase(),
      status: `${summaryMetrics.totalThreads ?? 0} threads`,
    };
  }, [overview?.workspace, summaryMetrics.totalThreads]);

  const effectiveLabels = labels ?? [];

  const renderConversation = (showExpandButton = true) => {
    if (threadError) {
      return (
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {threadError.message || 'Unable to load conversation.'}
        </div>
      );
    }

    if (threadLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      );
    }

    if (!threadDetail) {
      return (
        <div className="flex h-full items-center justify-center">
          <EmptyState title="Select a thread" description="Pick a thread to read and reply." />
        </div>
      );
    }

    const supportCase = threadDetail.supportCase;
    return (
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{threadDetail.subject || 'No subject'}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {threadDetail.channelType} • Updated {formatRelativeTime(threadDetail.updatedAt)}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {threadDetail.labels?.map((label) => (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => handleLabelToggle(label.id)}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                  disabled={labelBusy}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: label.color }} />
                  {label.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setLabelManagerOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
              >
                <TagIcon className="h-4 w-4" />
                Labels
              </button>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold uppercase tracking-wide text-slate-400">State</span>
              <select
                value={threadDetail.state}
                onChange={(event) => handleThreadStateChange(event.target.value)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 focus:border-accent focus:outline-none"
              >
                {STATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              {showExpandButton ? (
                <>
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
                  >
                    <ArrowsPointingOutIcon className="h-4 w-4" />
                    Expand
                  </button>
                  <button
                    type="button"
                    onClick={() => loadThreadDetail(selectedThreadId)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
                  >
                    <ArrowPathIcon
                      className={classNames('h-4 w-4', threadLoading ? 'animate-spin text-accent' : 'text-slate-500')}
                    />
                    Refresh
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => loadThreadDetail(selectedThreadId)}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
                >
                  <ArrowPathIcon
                    className={classNames('h-4 w-4', threadLoading ? 'animate-spin text-accent' : 'text-slate-500')}
                  />
                  Refresh
                </button>
              )}
            </div>
          </div>
        </div>

        {supportCase ? (
          <div className="mt-4 rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-700">Support case</p>
              <span className="text-xs text-slate-500 capitalize">{supportCase.status.replace(/_/g, ' ')}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Priority: {supportCase.priority}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col text-xs font-semibold text-slate-500">
                Agent
                <select
                  value={supportCase.assignedTo ?? ''}
                  onChange={(event) => handleAssignSupport(event.target.value ? Number(event.target.value) : null)}
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.userId}>
                      {member.user?.firstName} {member.user?.lastName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col text-xs font-semibold text-slate-500">
                Status
                <select
                  value={supportCase.status}
                  onChange={(event) => handleSupportStatusUpdate({ status: event.target.value, resolutionSummary: null })}
                  className="mt-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {SUPPORT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSupportStatusUpdate({ status: 'resolved', resolutionSummary: 'Resolved in inbox.' })}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
              >
                Mark resolved
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300"
              onClick={() => handleEscalate({ reason: 'Manual escalation', priority: 'medium' })}
            >
              Escalate
            </button>
          </div>
        )}

        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          {messages.length ? (
            <div className="space-y-3">
              {messages.map((message) => (
                <ConversationMessage key={message.id} message={message} actorId={actorId} />
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">No messages yet.</div>
          )}
        </div>

        <form className="mt-4 flex flex-col gap-3" onSubmit={handleSend}>
          <textarea
            rows={4}
            value={composer}
            onChange={(event) => setComposer(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Write a reply"
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:opacity-60"
              disabled={!composer.trim() || sending}
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              Send
            </button>
            <button
              type="button"
              onClick={() => loadThreadDetail(selectedThreadId)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
            >
              Refresh
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Inbox"
      subtitle="Messages & support"
      menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={availableDashboards}
      profile={profile}
    >
      <div className="flex flex-col gap-8 pb-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="workspace-select">
                  Workspace
                </label>
                <select
                  id="workspace-select"
                  value={effectiveWorkspaceId ?? ''}
                  onChange={handleWorkspaceChange}
                  className="min-w-[200px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Select workspace</option>
                  {workspaceOptions.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400" htmlFor="lookback-select">
                  Range
                </label>
                <select
                  id="lookback-select"
                  value={lookbackDays}
                  onChange={handleLookbackChange}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {LOOKBACK_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      Last {option} days
                    </option>
                  ))}
                </select>
              </div>
              <DataStatus
                loading={overviewLoading || threadsLoading}
                fromCache={false}
                lastUpdated={overview?.meta?.generatedAt}
                onRefresh={() => {
                  loadOverview();
                  loadThreads(threadPagination.page);
                }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent/60 hover:text-accent"
                >
                  <FunnelIcon className="h-4 w-4" />
                  Filters
                </button>
                <button
                  type="button"
                  onClick={() => setLabelManagerOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-accent/60 hover:text-accent"
                >
                  <TagIcon className="h-4 w-4" />
                  Labels
                </button>
              </div>
              <button
                type="button"
                onClick={() => setNewThreadOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
              >
                <PlusIcon className="h-4 w-4" />
                New thread
              </button>
            </div>
          </div>
        </div>

        {overviewError ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-5 text-sm text-rose-700">
            {overviewError.message || 'Unable to load inbox overview.'}
          </div>
        ) : null}

        <SummaryCards metrics={summaryMetrics} />

        {membersError ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-4 text-sm text-rose-700">
            {membersError.message || 'Unable to load members.'}
          </div>
        ) : null}

        <div className="grid gap-6 lg:h-[calc(100vh-260px)] lg:grid-cols-[340px,minmax(0,1fr)]">
          <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Threads</p>
              <button
                type="button"
                onClick={() => loadThreads(threadPagination.page)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
              >
                <ArrowPathIcon
                  className={classNames('h-4 w-4', threadsLoading ? 'animate-spin text-accent' : 'text-slate-500')}
                />
                Refresh
              </button>
            </div>
            <div className="mt-4 flex-1 overflow-y-auto pr-1">
              {threadsError ? (
                <div className="rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {threadsError.message || 'Unable to load threads.'}
                </div>
              ) : null}
              {threadsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-20 animate-pulse rounded-3xl bg-slate-100" />
                  ))}
                </div>
              ) : threads.length ? (
                <div className="space-y-3">
                  {threads.map((thread) => (
                    <ThreadCard
                      key={thread.id}
                      thread={thread}
                      active={selectedThreadId === thread.id}
                      onSelect={setSelectedThreadId}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No threads yet"
                  description="Start a thread to see it here."
                  action={
                    <button
                      type="button"
                      onClick={() => setNewThreadOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Start thread
                    </button>
                  }
                />
              )}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {threadPagination.page} of {threadPagination.totalPages || 1}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent disabled:opacity-50"
                  onClick={() => {
                    if (threadPagination.page > 1) {
                      const nextPage = threadPagination.page - 1;
                      setThreadPagination((prev) => ({ ...prev, page: nextPage }));
                      loadThreads(nextPage);
                    }
                  }}
                  disabled={threadPagination.page <= 1}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent disabled:opacity-50"
                  onClick={() => {
                    if (threadPagination.page < threadPagination.totalPages) {
                      const nextPage = threadPagination.page + 1;
                      setThreadPagination((prev) => ({ ...prev, page: nextPage }));
                      loadThreads(nextPage);
                    }
                  }}
                  disabled={threadPagination.page >= threadPagination.totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            {renderConversation(true)}
          </div>
        </div>
      </div>

      <FilterDrawer
        open={filtersOpen}
        filters={filters}
        onChange={updateFilter}
        onClose={() => setFiltersOpen(false)}
        onReset={() => {
          resetFilters();
        }}
        channelOptions={CHANNEL_OPTIONS}
        stateOptions={STATE_OPTIONS}
        statusOptions={SUPPORT_STATUS_OPTIONS}
        labels={effectiveLabels}
      />

      <LabelManagerModal
        open={labelManagerOpen}
        labels={labels}
        onClose={() => setLabelManagerOpen(false)}
        onCreate={handleCreateLabel}
        onUpdate={handleUpdateLabel}
        onDelete={handleDeleteLabel}
        busy={labelBusy}
      />

      <NewThreadModal
        open={newThreadOpen}
        onClose={() => setNewThreadOpen(false)}
        onCreate={handleCreateThread}
        members={members}
        busy={creatingThread}
        error={membersError}
      />

      {expanded ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 py-8">
          <div className="flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <p className="text-sm font-semibold text-slate-700">Conversation</p>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
              >
                <XMarkIcon className="h-4 w-4" />
                Close
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">{renderConversation(false)}</div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}


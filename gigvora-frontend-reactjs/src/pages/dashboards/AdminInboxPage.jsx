import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import { resolveActorId } from '../../utils/session.js';
import AdminInboxToolbar from '../../components/admin/inbox/AdminInboxToolbar.jsx';
import AdminInboxStats from '../../components/admin/inbox/AdminInboxStats.jsx';
import AdminInboxThreadList from '../../components/admin/inbox/AdminInboxThreadList.jsx';
import AdminInboxThreadDetail from '../../components/admin/inbox/AdminInboxThreadDetail.jsx';
import AdminInboxLabelManager from '../../components/admin/inbox/AdminInboxLabelManager.jsx';
import AdminInboxFilters from '../../components/admin/inbox/AdminInboxFilters.jsx';
import AdminInboxDrawer from '../../components/admin/inbox/AdminInboxDrawer.jsx';
import AdminInboxCreateThreadForm from '../../components/admin/inbox/AdminInboxCreateThreadForm.jsx';
import {
  fetchAdminInbox,
  fetchAdminThread,
  fetchAdminThreadMessages,
  sendAdminMessage,
  updateAdminThreadState,
  assignAdminSupportAgent,
  updateAdminSupportStatus,
  escalateAdminThread,
  createAdminThread,
  listAdminLabels,
  createAdminLabel,
  updateAdminLabel,
  deleteAdminLabel,
  setThreadLabels,
  listSupportAgents,
} from '../../services/adminMessaging.js';

const MENU_SECTIONS = [
  {
    label: 'Inbox',
    items: [
      { name: 'Home', href: '/dashboard/admin' },
      { name: 'Queue', sectionId: 'admin-inbox-queue' },
      { name: 'Labels', sectionId: 'admin-inbox-labels' },
    ],
  },
];

const DEFAULT_FILTERS = {
  search: '',
  channelTypes: [],
  states: [],
  supportStatuses: [],
  supportPriorities: [],
  labelIds: [],
  assignedTo: '',
  unassignedOnly: false,
  escalatedOnly: false,
  hasSupportCase: null,
  dateFrom: null,
  dateTo: null,
};

function normalizeToLowercaseArray(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((entry) => `${entry}`.trim().toLowerCase()).filter(Boolean);
  }
  return [`${value}`.trim().toLowerCase()].filter(Boolean);
}

function normalizeToLowercaseString(value) {
  if (!value) return '';
  return `${value}`.trim().toLowerCase();
}

function AccessNotice({ title, message, primaryLabel, onPrimaryAction }) {
  return (
    <div className="mx-auto max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-soft">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-3 text-sm text-slate-600">{message}</p>
      <button
        type="button"
        onClick={onPrimaryAction}
        className="mt-6 inline-flex items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
      >
        {primaryLabel}
      </button>
    </div>
  );
}

export default function AdminInboxPage() {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const actorId = resolveActorId(session);

  const normalizedMemberships = useMemo(() => normalizeToLowercaseArray(session?.memberships), [session?.memberships]);
  const normalizedRoles = useMemo(() => normalizeToLowercaseArray(session?.roles), [session?.roles]);
  const normalizedPermissions = useMemo(() => normalizeToLowercaseArray(session?.permissions), [session?.permissions]);
  const normalizedCapabilities = useMemo(() => normalizeToLowercaseArray(session?.capabilities), [session?.capabilities]);
  const sessionRole = useMemo(() => normalizeToLowercaseString(session?.role ?? session?.user?.role), [session?.role, session?.user?.role]);
  const sessionUserType = useMemo(
    () => normalizeToLowercaseString(session?.user?.userType ?? session?.userType),
    [session?.user?.userType, session?.userType],
  );
  const primaryDashboard = useMemo(
    () => normalizeToLowercaseString(session?.primaryDashboard ?? session?.user?.primaryDashboard),
    [session?.primaryDashboard, session?.user?.primaryDashboard],
  );

  const ADMIN_ACCESS_ALIASES = useMemo(() => new Set(['admin', 'administrator', 'super-admin', 'superadmin']), []);

  const hasAdminSeat = useMemo(() => {
    if (!session) {
      return false;
    }
    const permissionAccess = normalizedPermissions.includes('admin:full') || normalizedCapabilities.includes('admin:access');
    return (
      permissionAccess ||
      normalizedMemberships.some((membership) => ADMIN_ACCESS_ALIASES.has(membership)) ||
      normalizedRoles.some((role) => ADMIN_ACCESS_ALIASES.has(role)) ||
      ADMIN_ACCESS_ALIASES.has(sessionRole) ||
      ADMIN_ACCESS_ALIASES.has(sessionUserType)
    );
  }, [
    session,
    normalizedMemberships,
    normalizedRoles,
    normalizedPermissions,
    normalizedCapabilities,
    sessionRole,
    sessionUserType,
    ADMIN_ACCESS_ALIASES,
  ]);

  const canAccess = isAuthenticated && hasAdminSeat;

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [threadsState, setThreadsState] = useState({ items: [], loading: false, error: null, pagination: null });
  const [metrics, setMetrics] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [threadDetails, setThreadDetails] = useState(null);
  const [messagesState, setMessagesState] = useState({ items: [], loading: false, error: null });
  const [composer, setComposer] = useState('');
  const [sending, setSending] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [updatingSupport, setUpdatingSupport] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [updatingLabels, setUpdatingLabels] = useState(false);
  const [labels, setLabels] = useState([]);
  const [labelBusy, setLabelBusy] = useState(false);
  const [agents, setAgents] = useState([]);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingThread, setCreatingThread] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  const pageSize = 20;

  const profile = useMemo(() => {
    const composedName = [session?.user?.firstName, session?.user?.lastName].filter(Boolean).join(' ');
    const displayName = session?.name ?? (composedName || 'Admin');
    const displayRole = session?.title ?? session?.user?.title ?? 'Inbox';
    return {
      name: displayName,
      role: displayRole,
      initials: session?.initials ?? displayName.slice(0, 2).toUpperCase(),
      avatarUrl: session?.avatarUrl ?? session?.user?.avatarUrl ?? null,
      status: lastSyncedAt ? `Synced ${new Date(lastSyncedAt).toLocaleTimeString()}` : 'Syncing…',
      badges: ['Messaging'],
    };
  }, [session, lastSyncedAt]);

  const loadLabelsAndAgents = useCallback(async () => {
    try {
      const [labelResponse, agentResponse] = await Promise.all([listAdminLabels(), listSupportAgents()]);
      setLabels(labelResponse);
      setAgents(agentResponse);
    } catch (error) {
      // ignore load errors
    }
  }, []);

  const loadThreads = useCallback(
    async ({ page = 1, append = false } = {}) => {
      if (!canAccess) {
        return;
      }
      setThreadsState((prev) => ({ ...prev, loading: true, error: null, ...(append ? {} : { items: [] }) }));
      try {
        const response = await fetchAdminInbox({
          ...filters,
          page,
          pageSize,
          assignedTo: filters.assignedTo || undefined,
          unassignedOnly: filters.unassignedOnly ? 'true' : undefined,
          escalatedOnly: filters.escalatedOnly ? 'true' : undefined,
          hasSupportCase: filters.hasSupportCase === null ? undefined : filters.hasSupportCase ? 'true' : 'false',
        });
        setThreadsState((prev) => ({
          items: append ? [...prev.items, ...(response?.data ?? [])] : response?.data ?? [],
          loading: false,
          error: null,
          pagination: response?.pagination ?? null,
        }));
        setMetrics(response?.metrics ?? null);
        setLastSyncedAt(new Date().toISOString());
        if (!append) {
          const firstThread = response?.data?.[0];
          setSelectedThreadId((current) => {
            if (current && response?.data?.some((thread) => thread.id === current)) {
              return current;
            }
            return firstThread?.id ?? null;
          });
        }
      } catch (error) {
        setThreadsState((prev) => ({
          ...prev,
          loading: false,
          error: error?.body?.message ?? error?.message ?? 'Unable to load threads.',
        }));
      }
    },
    [filters, pageSize, canAccess],
  );

  const loadThreadDetail = useCallback(
    async (threadId) => {
      if (!threadId || !canAccess) {
        setThreadDetails(null);
        setMessagesState({ items: [], loading: false, error: null });
        return;
      }
      setMessagesState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const [threadResponse, messagesResponse] = await Promise.all([
          fetchAdminThread(threadId),
          fetchAdminThreadMessages(threadId, { page: 1, pageSize: 100, includeSystem: true }),
        ]);
        setThreadDetails(threadResponse);
        setMessagesState({ items: messagesResponse?.data ?? [], loading: false, error: null });
      } catch (error) {
        setMessagesState({
          items: [],
          loading: false,
          error: error?.body?.message ?? error?.message ?? 'Unable to load conversation.',
        });
      }
    },
    [canAccess],
  );

  useEffect(() => {
    if (canAccess) {
      loadLabelsAndAgents();
    }
  }, [canAccess, loadLabelsAndAgents]);

  useEffect(() => {
    if (canAccess) {
      loadThreads({ page: 1, append: false });
    }
  }, [canAccess, loadThreads]);

  useEffect(() => {
    if (selectedThreadId) {
      loadThreadDetail(selectedThreadId);
    }
  }, [selectedThreadId, loadThreadDetail]);

  useEffect(() => {
    if (!selectedThreadId) return;
    const fromList = threadsState.items.find((thread) => thread.id === selectedThreadId);
    if (fromList) {
      setThreadDetails((prev) => ({ ...prev, ...fromList }));
    }
  }, [threadsState.items, selectedThreadId]);

  const updateThreadInList = useCallback((updatedThread) => {
    setThreadsState((prev) => ({
      ...prev,
      items: prev.items.map((thread) => (thread.id === updatedThread.id ? { ...thread, ...updatedThread } : thread)),
    }));
    setThreadDetails((prev) => (prev && prev.id === updatedThread.id ? { ...prev, ...updatedThread } : prev));
  }, []);

  const handleFilterChange = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handleLoadMore = useCallback(() => {
    const nextPage = (threadsState.pagination?.page ?? 1) + 1;
    if (threadsState.pagination && nextPage <= threadsState.pagination.totalPages) {
      loadThreads({ page: nextPage, append: true });
    }
  }, [threadsState.pagination, loadThreads]);

  const handleSendMessage = useCallback(async () => {
    if (!selectedThreadId || !composer.trim()) {
      return;
    }
    setSending(true);
    try {
      await sendAdminMessage(selectedThreadId, { messageType: 'text', body: composer.trim() });
      setComposer('');
      await loadThreadDetail(selectedThreadId);
    } catch (error) {
      setMessagesState((prev) => ({
        ...prev,
        error: error?.body?.message ?? error?.message ?? 'Unable to send message.',
      }));
    } finally {
      setSending(false);
    }
  }, [selectedThreadId, composer, loadThreadDetail]);

  const handleUpdateState = useCallback(
    async (state) => {
      if (!selectedThreadId || !state) return;
      try {
        const thread = await updateAdminThreadState(selectedThreadId, { state });
        updateThreadInList(thread);
      } catch (error) {
        setThreadsState((prev) => ({
          ...prev,
          error: error?.body?.message ?? error?.message ?? 'Unable to update state.',
        }));
      }
    },
    [selectedThreadId, updateThreadInList],
  );

  const handleAssign = useCallback(
    async ({ agentId, notifyAgent = true }) => {
      if (!selectedThreadId) return;
      setAssigning(true);
      try {
        const payload = { agentId: agentId || null, notifyAgent };
        const response = await assignAdminSupportAgent(selectedThreadId, payload);
        updateThreadInList({ ...threadDetails, supportCase: response });
      } catch (error) {
        setThreadsState((prev) => ({
          ...prev,
          error: error?.body?.message ?? error?.message ?? 'Unable to assign support agent.',
        }));
      } finally {
        setAssigning(false);
      }
    },
    [selectedThreadId, threadDetails, updateThreadInList],
  );

  const handleSupportUpdate = useCallback(
    async ({ status, metadata, resolutionSummary }) => {
      if (!selectedThreadId || !status) return;
      setUpdatingSupport(true);
      try {
        const response = await updateAdminSupportStatus(selectedThreadId, {
          status,
          metadata,
          resolutionSummary,
        });
        updateThreadInList({ ...threadDetails, supportCase: response });
      } catch (error) {
        setThreadsState((prev) => ({
          ...prev,
          error: error?.body?.message ?? error?.message ?? 'Unable to update support case.',
        }));
      } finally {
        setUpdatingSupport(false);
      }
    },
    [selectedThreadId, threadDetails, updateThreadInList],
  );

  const handleEscalate = useCallback(
    async ({ reason, priority }) => {
      if (!selectedThreadId) return;
      setEscalating(true);
      try {
        const response = await escalateAdminThread(selectedThreadId, { reason, priority });
        updateThreadInList({ ...threadDetails, supportCase: response });
      } catch (error) {
        setThreadsState((prev) => ({
          ...prev,
          error: error?.body?.message ?? error?.message ?? 'Unable to escalate thread.',
        }));
      } finally {
        setEscalating(false);
      }
    },
    [selectedThreadId, threadDetails, updateThreadInList],
  );

  const handleSetLabels = useCallback(
    async (labelIds) => {
      if (!selectedThreadId) return;
      setUpdatingLabels(true);
      try {
        const response = await setThreadLabels(selectedThreadId, labelIds);
        updateThreadInList(response);
      } catch (error) {
        setThreadsState((prev) => ({
          ...prev,
          error: error?.body?.message ?? error?.message ?? 'Unable to update labels.',
        }));
      } finally {
        setUpdatingLabels(false);
      }
    },
    [selectedThreadId, updateThreadInList],
  );

  const handleCreateLabel = useCallback(async (payload) => {
    setLabelBusy(true);
    try {
      const label = await createAdminLabel(payload);
      setLabels((prev) => [...prev, label]);
      return label;
    } finally {
      setLabelBusy(false);
    }
  }, []);

  const handleCreateThread = useCallback(
    async (payload) => {
      setCreatingThread(true);
      try {
        const thread = await createAdminThread(payload);
        setShowCreateForm(false);
        setThreadsState((prev) => ({
          ...prev,
          items: [thread, ...prev.items],
          pagination: prev.pagination
            ? { ...prev.pagination, total: (prev.pagination.total ?? 0) + 1 }
            : prev.pagination,
        }));
        setSelectedThreadId(thread.id);
        await loadThreadDetail(thread.id);
      } catch (error) {
        setThreadsState((prev) => ({
          ...prev,
          error: error?.body?.message ?? error?.message ?? 'Unable to create thread.',
        }));
      } finally {
        setCreatingThread(false);
      }
    },
    [loadThreadDetail],
  );

  const handleUpdateLabel = useCallback(async (labelId, payload) => {
    setLabelBusy(true);
    try {
      const label = await updateAdminLabel(labelId, payload);
      setLabels((prev) => prev.map((entry) => (entry.id === label.id ? label : entry)));
      return label;
    } finally {
      setLabelBusy(false);
    }
  }, []);

  const handleDeleteLabel = useCallback(async (labelId) => {
    setLabelBusy(true);
    try {
      await deleteAdminLabel(labelId);
      setLabels((prev) => prev.filter((entry) => entry.id !== labelId));
    } finally {
      setLabelBusy(false);
    }
  }, []);

  const handleOpenThreadWindow = useCallback((threadId) => {
    window.open(`/dashboard/admin/inbox?thread=${threadId}`, '_blank', 'noopener');
  }, []);

  const gatingView = useMemo(() => {
    if (!isAuthenticated) {
      return (
        <AccessNotice
          title="Sign in"
          message="Use your admin account to view the inbox."
          primaryLabel="Admin login"
          onPrimaryAction={() => navigate('/admin')}
        />
      );
    }
    if (!hasAdminSeat) {
      return (
        <AccessNotice
          title="No access"
          message="Request admin inbox access from operations."
          primaryLabel="Switch account"
          onPrimaryAction={() => navigate('/admin')}
        />
      );
    }
    return null;
  }, [isAuthenticated, hasAdminSeat, navigate]);

  if (!canAccess) {
    return (
      <DashboardLayout
        currentDashboard="admin"
        title="Inbox"
        subtitle="Messages"
        description=""
        menuSections={MENU_SECTIONS}
        sections={[]}
        profile={profile}
        availableDashboards={['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter']}
      >
        <div className="py-20">{gatingView}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Inbox"
      subtitle="Messages"
      description=""
      menuSections={MENU_SECTIONS}
      sections={[]}
      profile={profile}
      availableDashboards={['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter']}
    >
      <div className="space-y-5 py-6">
        <AdminInboxToolbar
          onOpenFilters={() => setFiltersOpen(true)}
          onOpenLabels={() => setLabelsOpen(true)}
          onNewThread={() => setShowCreateForm(true)}
          onRefresh={() => loadThreads({ page: 1, append: false })}
          syncing={threadsState.loading}
        />

        <AdminInboxStats metrics={metrics} pagination={threadsState.pagination} lastSyncedAt={lastSyncedAt} />

        <div id="admin-inbox-queue" className="grid gap-5 xl:grid-cols-[minmax(300px,0.8fr),minmax(0,1.2fr)]">
          <AdminInboxThreadList
            threads={threadsState.items}
            actorId={actorId}
            selectedThreadId={selectedThreadId}
            onSelect={setSelectedThreadId}
            loading={threadsState.loading}
            error={threadsState.error}
            onRefresh={() => loadThreads({ page: 1, append: false })}
            pagination={threadsState.pagination}
            onLoadMore={handleLoadMore}
          />
          <AdminInboxThreadDetail
            actorId={actorId}
            thread={threadDetails}
            messages={messagesState.items}
            loading={messagesState.loading}
            error={messagesState.error}
            composer={composer}
            onComposerChange={setComposer}
            onSendMessage={handleSendMessage}
            sending={sending}
            onUpdateState={handleUpdateState}
            onAssign={handleAssign}
            assigning={assigning}
            agents={agents}
            onUpdateSupport={handleSupportUpdate}
            updatingSupport={updatingSupport}
            onEscalate={handleEscalate}
            escalating={escalating}
            labels={labels}
            onSetLabels={handleSetLabels}
            updatingLabels={updatingLabels}
            onOpenNewWindow={handleOpenThreadWindow}
            onExpand={() => setDetailDrawerOpen(true)}
            layout="inline"
          />
        </div>

        <div id="admin-inbox-labels" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Labels</p>
            <button
              type="button"
              onClick={() => setLabelsOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
            >
              Manage
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">Use Manage to edit tags without leaving the queue.</p>
        </div>
      </div>

      <AdminInboxDrawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        <AdminInboxFilters
          filters={filters}
          onChange={handleFilterChange}
          labels={labels}
          agents={agents}
          onReset={() => {
            resetFilters();
            loadThreads({ page: 1, append: false });
          }}
        />
      </AdminInboxDrawer>

      <AdminInboxDrawer open={labelsOpen} onClose={() => setLabelsOpen(false)} title="Labels">
        <AdminInboxLabelManager
          labels={labels}
          onCreate={handleCreateLabel}
          onUpdate={handleUpdateLabel}
          onDelete={handleDeleteLabel}
          busy={labelBusy}
        />
      </AdminInboxDrawer>

      <AdminInboxDrawer
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        title={threadDetails ? threadDetails.subject ?? 'Thread' : 'Thread'}
        widthClass="max-w-4xl"
      >
        <AdminInboxThreadDetail
          actorId={actorId}
          thread={threadDetails}
          messages={messagesState.items}
          loading={messagesState.loading}
          error={messagesState.error}
          composer={composer}
          onComposerChange={setComposer}
          onSendMessage={handleSendMessage}
          sending={sending}
          onUpdateState={handleUpdateState}
          onAssign={handleAssign}
          assigning={assigning}
          agents={agents}
          onUpdateSupport={handleSupportUpdate}
          updatingSupport={updatingSupport}
          onEscalate={handleEscalate}
          escalating={escalating}
          labels={labels}
          onSetLabels={handleSetLabels}
          updatingLabels={updatingLabels}
          onOpenNewWindow={handleOpenThreadWindow}
          layout="overlay"
        />
      </AdminInboxDrawer>

      <AdminInboxCreateThreadForm
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onCreate={handleCreateThread}
        busy={creatingThread}
      />
    </DashboardLayout>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import useSession from '../../../hooks/useSession.js';
import useAgencyDashboard from '../../../hooks/useAgencyDashboard.js';
import {
  fetchInbox,
  fetchThreadMessages,
  sendMessage,
  createThread,
  markThreadRead,
  updateThreadState,
  muteThread,
  escalateThread,
  assignSupport,
  updateSupportStatus,
  updateThreadSettings,
  addThreadParticipants,
  removeThreadParticipant,
} from '../../../services/messaging.js';
import { resolveActorId } from '../../../utils/session.js';
import { sortMessages, isThreadUnread } from '../../../utils/messaging.js';
import { canAccessMessaging } from '../../../constants/access.js';
import {
  AGENCY_DASHBOARD_MENU_SECTIONS,
  AGENCY_DASHBOARD_ALTERNATES,
} from './menuConfig.js';
import QueuePanel from './inbox/components/QueuePanel.jsx';
import ThreadPanel from './inbox/components/ThreadPanel.jsx';
import MessagePanel from './inbox/components/MessagePanel.jsx';
import PeopleDrawer from './inbox/components/PeopleDrawer.jsx';
import SupportDrawer from './inbox/components/SupportDrawer.jsx';
import ThreadViewerDialog from './inbox/components/ThreadViewerDialog.jsx';
import ComposeDrawer from './inbox/components/ComposeDrawer.jsx';

function sortThreads(threads = []) {
  return [...threads].sort((a, b) => {
    const aTime = a?.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b?.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
}

const FILTER_PRESETS = {
  all: {},
  unread: { unreadOnly: true },
  projects: { channelTypes: ['project'] },
  support: { channelTypes: ['support'] },
  direct: { channelTypes: ['direct'] },
  archived: { states: ['archived'] },
};

const QUICK_REPLIES = [
  {
    id: 'acknowledge',
    label: 'On it',
    body: 'Thanks for raising this. I am on it and will follow up shortly.',
  },
  {
    id: 'handoff',
    label: 'Finance',
    body: 'Handing this to finance to double-check the numbers. Expect a confirmation soon.',
  },
  {
    id: 'schedule',
    label: 'Schedule',
    body: 'Let’s grab a quick call. Please share two time options that work for you.',
  },
];

export default function AgencyInboxPage() {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const actorId = resolveActorId(session);
  const hasMessagingAccess = useMemo(() => canAccessMessaging(session), [session]);

  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);
  const [composer, setComposer] = useState('');
  const [sending, setSending] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [composeForm, setComposeForm] = useState({ subject: '', channelType: 'direct', participantIds: [], initialMessage: '' });
  const [composeError, setComposeError] = useState(null);
  const [creatingThread, setCreatingThread] = useState(false);
  const [supportError, setSupportError] = useState(null);
  const [escalating, setEscalating] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [muting, setMuting] = useState(false);
  const [stateUpdating, setStateUpdating] = useState(false);
  const [savingAutomations, setSavingAutomations] = useState(false);
  const [automationSettings, setAutomationSettings] = useState({
    autoRoute: false,
    shareTranscript: false,
    pinUrgent: false,
    enableAiDrafts: false,
  });

  const { data: agencyData } = useAgencyDashboard({ enabled: isAuthenticated });

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(searchTerm), 350);
    return () => window.clearTimeout(handle);
  }, [searchTerm]);

  const filterPreset = useMemo(() => FILTER_PRESETS[activeFilter] ?? FILTER_PRESETS.all, [activeFilter]);
  const inboxFilters = useMemo(
    () => ({
      ...filterPreset,
      search: debouncedSearch || undefined,
      includeParticipants: true,
      includeSupport: true,
    }),
    [filterPreset, debouncedSearch],
  );

  const workspaceMembers = useMemo(() => agencyData?.members?.list ?? [], [agencyData?.members?.list]);

  const computedMetrics = useMemo(() => {
    const unreadCount = threads.filter((thread) => isThreadUnread(thread)).length;
    const supportCount = threads.filter((thread) => thread.channelType === 'support').length;
    const escalationCount = threads.filter(
      (thread) => thread.supportCase && thread.supportCase.status && thread.supportCase.status !== 'resolved' && thread.supportCase.status !== 'closed',
    ).length;

    return {
      total: threads.length,
      unread: unreadCount,
      support: supportCount,
      escalations: escalationCount,
    };
  }, [threads]);

  const filterCounts = useMemo(
    () => ({
      all: threads.length,
      unread: computedMetrics.unread,
      projects: threads.filter((thread) => thread.channelType === 'project').length,
      support: computedMetrics.support,
      direct: threads.filter((thread) => thread.channelType === 'direct' || thread.channelType === 'group').length,
      archived: threads.filter((thread) => thread.state === 'archived').length,
    }),
    [threads, computedMetrics.unread, computedMetrics.support],
  );

  const queueFilters = useMemo(
    () => [
      { key: 'all', label: 'All', count: filterCounts.all },
      { key: 'unread', label: 'New', count: filterCounts.unread },
      { key: 'projects', label: 'Projects', count: filterCounts.projects },
      { key: 'support', label: 'Support', count: filterCounts.support },
      { key: 'direct', label: 'Team', count: filterCounts.direct },
      { key: 'archived', label: 'Archive', count: filterCounts.archived },
    ],
    [filterCounts],
  );

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [threads, selectedThreadId],
  );

  useEffect(() => {
    if (!selectedThread) {
      return;
    }
    const automations = selectedThread.metadata?.automations ?? {};
    setAutomationSettings({
      autoRoute: Boolean(automations.autoRoute),
      shareTranscript: Boolean(automations.shareTranscript),
      pinUrgent: Boolean(automations.pinUrgent),
      enableAiDrafts: Boolean(automations.enableAiDrafts),
    });
  }, [selectedThread?.id, selectedThread?.metadata?.automations]);

  useEffect(() => {
    if (!selectedThread) {
      setPeopleOpen(false);
      setSupportOpen(false);
      setViewerOpen(false);
    }
  }, [selectedThread]);

  const loadThreads = useCallback(
    async ({ selectThreadId, silent = false } = {}) => {
      if (!actorId || !hasMessagingAccess) {
        return;
      }
      if (!silent) {
        setThreadsLoading(true);
        setThreadsError(null);
      }
      try {
        const response = await fetchInbox({ userId: actorId, ...inboxFilters, pageSize: 40 });
        const items = Array.isArray(response?.data) ? sortThreads(response.data) : [];
        setThreads(items);
        const targetId = selectThreadId ?? selectedThreadId;
        if (items.length === 0) {
          setSelectedThreadId(null);
        } else if (targetId) {
          const exists = items.some((thread) => thread.id === targetId);
          setSelectedThreadId(exists ? targetId : items[0].id);
        } else {
          setSelectedThreadId(items[0].id);
        }
      } catch (error) {
        setThreadsError(error?.body?.message ?? error?.message ?? 'Unable to load inbox threads.');
      } finally {
        if (!silent) {
          setThreadsLoading(false);
        }
      }
    },
    [actorId, hasMessagingAccess, inboxFilters, selectedThreadId],
  );

  const loadMessages = useCallback(
    async (threadId) => {
      if (!actorId || !hasMessagingAccess || !threadId) {
        return;
      }
      setMessagesLoading(true);
      setMessagesError(null);
      try {
        const response = await fetchThreadMessages(threadId, { pageSize: 200 });
        const items = Array.isArray(response?.data) ? sortMessages(response.data) : [];
        setMessages(items);
        await markThreadRead(threadId, { userId: actorId });
      } catch (error) {
        setMessages([]);
        setMessagesError(error?.body?.message ?? error?.message ?? 'Unable to load conversation.');
      } finally {
        setMessagesLoading(false);
      }
    },
    [actorId, hasMessagingAccess],
  );

  useEffect(() => {
    if (!actorId || !hasMessagingAccess) {
      return;
    }
    loadThreads();
  }, [actorId, hasMessagingAccess, loadThreads]);

  useEffect(() => {
    if (selectedThreadId && hasMessagingAccess) {
      loadMessages(selectedThreadId);
    }
  }, [selectedThreadId, hasMessagingAccess, loadMessages]);

  const handleThreadUpdate = useCallback((updatedThread) => {
    if (!updatedThread) {
      return;
    }
    setThreads((previous) => {
      const next = previous.some((thread) => thread.id === updatedThread.id)
        ? previous.map((thread) => (thread.id === updatedThread.id ? { ...thread, ...updatedThread } : thread))
        : [updatedThread, ...previous];
      return sortThreads(next);
    });
  }, []);

  const handleSend = useCallback(async () => {
    if (!composer.trim() || !selectedThreadId || !actorId) {
      return;
    }
    setSending(true);
    setMessagesError(null);
    try {
      const message = await sendMessage(selectedThreadId, {
        userId: actorId,
        messageType: 'text',
        body: composer.trim(),
      });
      setComposer('');
      setMessages((previous) => sortMessages([...previous, message]));
      await loadThreads({ selectThreadId: selectedThreadId, silent: true });
    } catch (error) {
      setMessagesError(error?.body?.message ?? error?.message ?? 'Unable to send message.');
    } finally {
      setSending(false);
    }
  }, [composer, selectedThreadId, actorId, loadThreads]);

  const handleInsertTemplate = useCallback((template) => {
    if (!template?.body) {
      return;
    }
    setComposer((previous) => {
      if (!previous) {
        return template.body;
      }
      return `${previous.trim()}\n\n${template.body}`;
    });
  }, []);

  const handleAddParticipants = useCallback(
    async (participantIds) => {
      if (!selectedThreadId || !participantIds?.length || !actorId) {
        return;
      }
      setSupportError(null);
      try {
        const updated = await addThreadParticipants(selectedThreadId, {
          userId: actorId,
          participantIds,
        });
        handleThreadUpdate(updated);
      } catch (error) {
        setSupportError(error?.body?.message ?? error?.message ?? 'Unable to add participant.');
      }
    },
    [selectedThreadId, actorId, handleThreadUpdate],
  );

  const handleRemoveParticipant = useCallback(
    async (participantId) => {
      if (!selectedThreadId || !participantId || !actorId) {
        return;
      }
      setSupportError(null);
      try {
        const updated = await removeThreadParticipant(selectedThreadId, participantId, { userId: actorId });
        handleThreadUpdate(updated);
      } catch (error) {
        setSupportError(error?.body?.message ?? error?.message ?? 'Unable to remove participant.');
      }
    },
    [selectedThreadId, actorId, handleThreadUpdate],
  );

  const handleEscalate = useCallback(
    async ({ reason, priority }) => {
      if (!selectedThreadId || !reason?.trim() || !actorId) {
        return;
      }
      setSupportError(null);
      setEscalating(true);
      try {
        await escalateThread(selectedThreadId, { userId: actorId, reason: reason.trim(), priority });
        await loadThreads({ selectThreadId: selectedThreadId, silent: true });
      } catch (error) {
        setSupportError(error?.body?.message ?? error?.message ?? 'Unable to escalate support case.');
      } finally {
        setEscalating(false);
      }
    },
    [selectedThreadId, actorId, loadThreads],
  );

  const handleAssign = useCallback(
    async ({ agentId }) => {
      if (!selectedThreadId || !agentId || !actorId) {
        return;
      }
      setSupportError(null);
      setAssigning(true);
      try {
        await assignSupport(selectedThreadId, { userId: actorId, agentId: Number(agentId) });
        await loadThreads({ selectThreadId: selectedThreadId, silent: true });
      } catch (error) {
        setSupportError(error?.body?.message ?? error?.message ?? 'Unable to assign support owner.');
      } finally {
        setAssigning(false);
      }
    },
    [selectedThreadId, actorId, loadThreads],
  );

  const handleUpdateStatus = useCallback(
    async ({ status, resolutionSummary }) => {
      if (!selectedThreadId || !status || !actorId) {
        return;
      }
      setSupportError(null);
      setUpdatingStatus(true);
      try {
        await updateSupportStatus(selectedThreadId, {
          userId: actorId,
          status,
          resolutionSummary: resolutionSummary?.trim() || undefined,
        });
        await loadThreads({ selectThreadId: selectedThreadId, silent: true });
      } catch (error) {
        setSupportError(error?.body?.message ?? error?.message ?? 'Unable to update support status.');
      } finally {
        setUpdatingStatus(false);
      }
    },
    [selectedThreadId, actorId, loadThreads],
  );

  const handleChangeState = useCallback(
    async (state) => {
      if (!selectedThreadId || !state || !actorId) {
        return;
      }
      setSupportError(null);
      setStateUpdating(true);
      try {
        const updated = await updateThreadState(selectedThreadId, { state, userId: actorId });
        handleThreadUpdate(updated);
      } catch (error) {
        setSupportError(error?.body?.message ?? error?.message ?? 'Unable to update conversation state.');
      } finally {
        setStateUpdating(false);
      }
    },
    [selectedThreadId, actorId, handleThreadUpdate],
  );

  const handleMute = useCallback(
    async (durationMs) => {
      if (!selectedThreadId || !durationMs || !actorId) {
        return;
      }
      setSupportError(null);
      setMuting(true);
      try {
        const until = new Date(Date.now() + Number(durationMs)).toISOString();
        await muteThread(selectedThreadId, { userId: actorId, until });
      } catch (error) {
        setSupportError(error?.body?.message ?? error?.message ?? 'Unable to mute conversation.');
      } finally {
        setMuting(false);
      }
    },
    [selectedThreadId, actorId],
  );

  const handleSaveAutomations = useCallback(
    async (settings) => {
      if (!selectedThreadId || !actorId) {
        return;
      }
      setSupportError(null);
      setSavingAutomations(true);
      try {
        const updated = await updateThreadSettings(selectedThreadId, {
          userId: actorId,
          metadataPatch: { automations: settings },
        });
        handleThreadUpdate(updated);
      } catch (error) {
        setSupportError(error?.body?.message ?? error?.message ?? 'Unable to save automation settings.');
      } finally {
        setSavingAutomations(false);
      }
    },
    [selectedThreadId, actorId, handleThreadUpdate],
  );

  const handleComposeSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!actorId) {
        return;
      }
      setComposeError(null);
      setCreatingThread(true);
      try {
        const participantIds = composeForm.participantIds.map((value) => Number(value)).filter((value) => Number.isInteger(value));
        const thread = await createThread({
          userId: actorId,
          subject: composeForm.subject,
          channelType: composeForm.channelType,
          participantIds,
          metadata: { createdFrom: 'agency_inbox' },
        });
        if (composeForm.initialMessage.trim()) {
          await sendMessage(thread.id, {
            userId: actorId,
            messageType: 'text',
            body: composeForm.initialMessage.trim(),
          });
        }
        setComposeOpen(false);
        setComposeForm({ subject: '', channelType: 'direct', participantIds: [], initialMessage: '' });
        await loadThreads({ selectThreadId: thread.id });
        await loadMessages(thread.id);
      } catch (error) {
        setComposeError(error?.body?.message ?? error?.message ?? 'Unable to create conversation.');
      } finally {
        setCreatingThread(false);
      }
    },
    [actorId, composeForm, loadThreads, loadMessages],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (!hasMessagingAccess) {
      const fallback = session?.primaryDashboard ?? session?.memberships?.find((role) => role !== 'agency');
      if (fallback) {
        navigate(`/dashboard/${fallback}`, { replace: false });
      }
    }
  }, [hasMessagingAccess, isAuthenticated, navigate, session?.memberships, session?.primaryDashboard]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: '/dashboard/agency/inbox' }} />;
  }

  if (!hasMessagingAccess) {
    return (
      <DashboardLayout
        currentDashboard="agency"
        title="Inbox"
        subtitle="Messaging"
        menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
        availableDashboards={AGENCY_DASHBOARD_ALTERNATES}
        activeMenuItem="inbox"
      >
        <div className="py-24 text-center text-sm text-slate-500">Enable messaging for this agency to use the inbox.</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Inbox"
      subtitle="Workspace"
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={AGENCY_DASHBOARD_ALTERNATES}
      activeMenuItem="inbox"
    >
      <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-6">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Agency / Inbox</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              className="inline-flex items-center rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-accentDark"
            >
              New
            </button>
            <button
              type="button"
              onClick={() => selectedThread && setSupportOpen(true)}
              disabled={!selectedThread}
              className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent/50 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              Support
            </button>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4 lg:grid lg:grid-cols-[260px_320px_minmax(0,1fr)] lg:gap-6">
          <div className="lg:h-full">
            <QueuePanel
              filters={queueFilters}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              metrics={computedMetrics}
              onCompose={() => setComposeOpen(true)}
              onRefresh={() => loadThreads({ selectThreadId: selectedThreadId })}
              loading={threadsLoading}
            />
          </div>
          <div className="lg:h-full">
            <ThreadPanel
              threads={threads}
              loading={threadsLoading}
              error={threadsError}
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              selectedThreadId={selectedThreadId}
              onSelectThread={setSelectedThreadId}
            />
          </div>
          <div className="lg:h-full">
            <MessagePanel
              thread={selectedThread}
              messages={messages}
              composer={composer}
              onComposerChange={setComposer}
              onSend={handleSend}
              sending={sending}
              loading={messagesLoading}
              error={messagesError}
              onRefresh={() => selectedThreadId && loadMessages(selectedThreadId)}
              quickReplies={QUICK_REPLIES}
              onSelectQuickReply={handleInsertTemplate}
              onOpenPeople={() => selectedThread && setPeopleOpen(true)}
              onOpenSupport={() => selectedThread && setSupportOpen(true)}
              onExpand={() => selectedThread && setViewerOpen(true)}
              actorId={actorId}
            />
          </div>
        </div>
      </div>
      <ComposeDrawer
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        form={composeForm}
        onChange={setComposeForm}
        onSubmit={handleComposeSubmit}
        submitting={creatingThread}
        error={composeError}
        workspaceMembers={workspaceMembers}
      />
      <PeopleDrawer
        open={peopleOpen}
        onClose={() => setPeopleOpen(false)}
        participants={selectedThread?.participants ?? []}
        workspaceMembers={workspaceMembers}
        onAddParticipants={handleAddParticipants}
        onRemoveParticipant={handleRemoveParticipant}
      />
      <SupportDrawer
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        supportCase={selectedThread?.supportCase}
        thread={selectedThread}
        onEscalate={handleEscalate}
        escalating={escalating}
        onAssign={handleAssign}
        assigning={assigning}
        onUpdateStatus={handleUpdateStatus}
        updatingStatus={updatingStatus}
        onChangeState={handleChangeState}
        stateUpdating={stateUpdating}
        onMute={handleMute}
        muting={muting}
        onAutomationChange={setAutomationSettings}
        automationSettings={automationSettings}
        onSaveAutomations={handleSaveAutomations}
        savingAutomations={savingAutomations}
        workspaceMembers={workspaceMembers}
        error={supportError}
      />
      <ThreadViewerDialog
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        thread={selectedThread}
        messages={messages}
        composer={composer}
        onComposerChange={setComposer}
        onSend={handleSend}
        sending={sending}
        loading={messagesLoading}
        error={messagesError}
        onRefresh={() => selectedThreadId && loadMessages(selectedThreadId)}
        quickReplies={QUICK_REPLIES}
        onSelectQuickReply={handleInsertTemplate}
        actorId={actorId}
        onOpenSupport={() => selectedThread && setSupportOpen(true)}
        onOpenPeople={() => selectedThread && setPeopleOpen(true)}
      />
    </DashboardLayout>
  );
}

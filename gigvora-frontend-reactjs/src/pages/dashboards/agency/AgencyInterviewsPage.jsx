import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import AgencyDashboardLayout from './AgencyDashboardLayout.jsx';
import useSession from '../../../hooks/useSession.js';
import WorkspaceSwitcher from '../../../components/admin/interviews/WorkspaceSwitcher.jsx';
import StatsStrip from '../../../components/admin/interviews/StatsStrip.jsx';
import RoomsPanel from '../../../components/admin/interviews/RoomsPanel.jsx';
import WorkflowPanel from '../../../components/admin/interviews/WorkflowPanel.jsx';
import TemplatesPanel from '../../../components/admin/interviews/TemplatesPanel.jsx';
import PrepPortalsPanel from '../../../components/admin/interviews/PrepPortalsPanel.jsx';
import {
  listInterviewWorkspaces,
  fetchInterviewWorkspace,
  createInterviewRoom,
  updateInterviewRoom,
  deleteInterviewRoom,
  addInterviewParticipant,
  updateInterviewParticipant,
  deleteInterviewParticipant,
  createInterviewChecklistItem,
  updateInterviewChecklistItem,
  deleteInterviewChecklistItem,
  createInterviewLane,
  updateInterviewLane,
  deleteInterviewLane,
  createInterviewCard,
  updateInterviewCard,
  deleteInterviewCard,
  createPanelTemplate,
  updatePanelTemplate,
  deletePanelTemplate,
  createCandidatePrepPortal,
  updateCandidatePrepPortal,
  deleteCandidatePrepPortal,
} from '../../../services/interviews.js';

function normalizeError(error) {
  if (!error) {
    return null;
  }
  if (error.body?.message) {
    return error.body.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'Unexpected error. Please try again.';
}

function formatDateTime(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatRelative(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const absMinutes = Math.abs(diffMinutes);
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (absMinutes < 60) {
    return formatter.format(diffMinutes, 'minute');
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour');
  }
  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, 'day');
}

export default function AgencyInterviewsPage() {
  const { session } = useSession();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [panelState, setPanelState] = useState({ open: false, key: null });
  const [insightsOpen, setInsightsOpen] = useState(false);

  const preferredWorkspaceId = session?.workspaceId ?? session?.workspace?.id ?? null;

  const loadWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listInterviewWorkspaces();
      const items = Array.isArray(response?.workspaces) ? response.workspaces : [];
      setWorkspaces(items);
      const defaultId =
        items.find((item) => item.id === activeWorkspaceId)?.id ??
        items.find((item) => item.id === preferredWorkspaceId)?.id ??
        items[0]?.id ??
        null;
      setActiveWorkspaceId(defaultId);
      setError(null);
    } catch (err) {
      setWorkspaces([]);
      setError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId, preferredWorkspaceId]);

  const loadWorkspace = useCallback(
    async (workspaceId) => {
      if (!workspaceId) {
        setOverview(null);
        return;
      }
      setRefreshing(true);
      try {
        const data = await fetchInterviewWorkspace(workspaceId);
        setOverview(data);
        setError(null);
      } catch (err) {
        setOverview(null);
        setError(normalizeError(err));
      } finally {
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (!activeWorkspaceId) {
      setOverview(null);
      return;
    }
    loadWorkspace(activeWorkspaceId);
  }, [activeWorkspaceId, loadWorkspace]);

  const executeAndRefresh = useCallback(
    async (handler) => {
      if (!activeWorkspaceId) {
        return;
      }
      setBusy(true);
      try {
        await handler();
        await loadWorkspace(activeWorkspaceId);
        setError(null);
      } catch (err) {
        setError(normalizeError(err));
      } finally {
        setBusy(false);
      }
    },
    [activeWorkspaceId, loadWorkspace],
  );

  const handleCreateRoom = useCallback(
    (payload) => executeAndRefresh(() => createInterviewRoom(activeWorkspaceId, payload)),
    [activeWorkspaceId, executeAndRefresh],
  );

  const handleUpdateRoom = useCallback(
    (roomId, payload) => executeAndRefresh(() => updateInterviewRoom(roomId, payload)),
    [executeAndRefresh],
  );

  const handleDeleteRoom = useCallback(
    (roomId) => executeAndRefresh(() => deleteInterviewRoom(roomId)),
    [executeAndRefresh],
  );

  const handleAddParticipant = useCallback(
    (roomId, payload) => executeAndRefresh(() => addInterviewParticipant(roomId, payload)),
    [executeAndRefresh],
  );

  const handleUpdateParticipant = useCallback(
    (roomId, participantId, payload) =>
      executeAndRefresh(() => updateInterviewParticipant(roomId, participantId, payload)),
    [executeAndRefresh],
  );

  const handleRemoveParticipant = useCallback(
    (roomId, participantId) => executeAndRefresh(() => deleteInterviewParticipant(roomId, participantId)),
    [executeAndRefresh],
  );

  const handleAddChecklistItem = useCallback(
    (roomId, payload) => executeAndRefresh(() => createInterviewChecklistItem(roomId, payload)),
    [executeAndRefresh],
  );

  const handleUpdateChecklistItem = useCallback(
    (roomId, itemId, payload) =>
      executeAndRefresh(() => updateInterviewChecklistItem(roomId, itemId, payload)),
    [executeAndRefresh],
  );

  const handleRemoveChecklistItem = useCallback(
    (roomId, itemId) => executeAndRefresh(() => deleteInterviewChecklistItem(roomId, itemId)),
    [executeAndRefresh],
  );

  const handleCreateLane = useCallback(
    (payload) => executeAndRefresh(() => createInterviewLane(activeWorkspaceId, payload)),
    [activeWorkspaceId, executeAndRefresh],
  );

  const handleUpdateLane = useCallback(
    (laneId, payload) => executeAndRefresh(() => updateInterviewLane(activeWorkspaceId, laneId, payload)),
    [activeWorkspaceId, executeAndRefresh],
  );

  const handleDeleteLane = useCallback(
    (laneId) => executeAndRefresh(() => deleteInterviewLane(activeWorkspaceId, laneId)),
    [activeWorkspaceId, executeAndRefresh],
  );

  const handleCreateCard = useCallback(
    (laneId, payload) => executeAndRefresh(() => createInterviewCard(activeWorkspaceId, laneId, payload)),
    [activeWorkspaceId, executeAndRefresh],
  );

  const handleUpdateCard = useCallback(
    (laneId, cardId, payload) =>
      executeAndRefresh(() => updateInterviewCard(activeWorkspaceId, laneId, cardId, payload)),
    [activeWorkspaceId, executeAndRefresh],
  );

  const handleDeleteCard = useCallback(
    (laneId, cardId) => executeAndRefresh(() => deleteInterviewCard(activeWorkspaceId, laneId, cardId)),
    [activeWorkspaceId, executeAndRefresh],
  );

  const handleCreateTemplate = useCallback(
    (payload) => executeAndRefresh(() => createPanelTemplate(activeWorkspaceId, payload)),
    [activeWorkspaceId, executeAndRefresh],
  );

  const handleUpdateTemplate = useCallback(
    (templateId, payload) => executeAndRefresh(() => updatePanelTemplate(templateId, payload)),
    [executeAndRefresh],
  );

  const handleDeleteTemplate = useCallback(
    (templateId) => executeAndRefresh(() => deletePanelTemplate(templateId)),
    [executeAndRefresh],
  );

  const handleCreatePortal = useCallback(
    (payload) => executeAndRefresh(() => createCandidatePrepPortal(activeWorkspaceId, payload)),
    [activeWorkspaceId, executeAndRefresh],
  );

  const handleUpdatePortal = useCallback(
    (portalId, payload) => executeAndRefresh(() => updateCandidatePrepPortal(portalId, payload)),
    [executeAndRefresh],
  );

  const handleDeletePortal = useCallback(
    (portalId) => executeAndRefresh(() => deleteCandidatePrepPortal(portalId)),
    [executeAndRefresh],
  );

  const openPanel = useCallback((key) => setPanelState({ open: true, key }), []);
  const closePanel = useCallback(() => setPanelState({ open: false, key: null }), []);

  const stats = overview?.stats ?? {};
  const rooms = overview?.rooms ?? [];
  const workflow = overview?.workflow ?? { lanes: [] };
  const templates = overview?.panelTemplates ?? [];
  const prepPortals = overview?.prepPortals ?? [];

  const controlCards = useMemo(() => {
    const laneCount = Array.isArray(workflow?.lanes) ? workflow.lanes.length : 0;
    return [
      { id: 'rooms', label: 'Rooms', value: rooms.length },
      { id: 'flow', label: 'Flow', value: laneCount },
      { id: 'panels', label: 'Panels', value: templates.length },
      { id: 'prep', label: 'Prep', value: prepPortals.length },
    ];
  }, [rooms, workflow, templates, prepPortals]);

  const upcomingSessions = useMemo(() => {
    return rooms
      .flatMap((room) =>
        (room?.sessions ?? []).map((session) => ({
          roomId: room.id,
          roomName: room.name,
          startsAt: session.startsAt ?? session.scheduledAt ?? null,
          interviewerCount: Array.isArray(session?.interviewers) ? session.interviewers.length : 0,
          candidate: session?.candidate ?? room?.candidate ?? null,
        })),
      )
      .filter((session) => session.startsAt)
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
      .slice(0, 5);
  }, [rooms]);

  const insightsCards = useMemo(() => {
    const sla = stats.averageSlaMinutes;
    const awaitingFeedback = stats.awaitingFeedback ?? 0;
    return [
      {
        id: 'sla',
        label: 'Average SLA',
        value: sla ? `${Math.round(sla)} mins` : '—',
        description: 'Median time from invite to feedback capture.',
      },
      {
        id: 'feedback',
        label: 'Awaiting feedback',
        value: awaitingFeedback,
        description: 'Panels that still need interviewer scorecards.',
      },
      {
        id: 'prep-portals',
        label: 'Prep portals live',
        value: prepPortals.length,
        description: 'Candidate hubs published with walkthroughs and FAQs.',
      },
      {
        id: 'templates',
        label: 'Reusable panels',
        value: templates.length,
        description: 'Templates ready to spin up consistent interviewer panels.',
      },
    ];
  }, [stats.averageSlaMinutes, stats.awaitingFeedback, prepPortals.length, templates.length]);

  const panelContent = useMemo(
    () => ({
      rooms: {
        label: 'Rooms',
        node: (
          <RoomsPanel
            rooms={rooms}
            onCreateRoom={handleCreateRoom}
            onUpdateRoom={handleUpdateRoom}
            onDeleteRoom={handleDeleteRoom}
            onAddParticipant={handleAddParticipant}
            onUpdateParticipant={handleUpdateParticipant}
            onRemoveParticipant={handleRemoveParticipant}
            onAddChecklistItem={handleAddChecklistItem}
            onUpdateChecklistItem={handleUpdateChecklistItem}
            onRemoveChecklistItem={handleRemoveChecklistItem}
            busy={busy}
            showHeader={false}
            className="space-y-8"
          />
        ),
      },
      flow: {
        label: 'Flow',
        node: (
          <WorkflowPanel
            workflow={workflow}
            onCreateLane={handleCreateLane}
            onUpdateLane={handleUpdateLane}
            onDeleteLane={handleDeleteLane}
            onCreateCard={handleCreateCard}
            onUpdateCard={handleUpdateCard}
            onDeleteCard={handleDeleteCard}
            busy={busy}
            showHeader={false}
            className="space-y-8"
          />
        ),
      },
      panels: {
        label: 'Panels',
        node: (
          <TemplatesPanel
            templates={templates}
            onCreateTemplate={handleCreateTemplate}
            onUpdateTemplate={handleUpdateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            busy={busy}
            showHeader={false}
            className="space-y-8"
          />
        ),
      },
      prep: {
        label: 'Prep',
        node: (
          <PrepPortalsPanel
            prepPortals={prepPortals}
            onCreatePortal={handleCreatePortal}
            onUpdatePortal={handleUpdatePortal}
            onDeletePortal={handleDeletePortal}
            busy={busy}
            showHeader={false}
            className="space-y-8"
          />
        ),
      },
    }),
    [
      rooms,
      workflow,
      templates,
      prepPortals,
      handleCreateRoom,
      handleUpdateRoom,
      handleDeleteRoom,
      handleAddParticipant,
      handleUpdateParticipant,
      handleRemoveParticipant,
      handleAddChecklistItem,
      handleUpdateChecklistItem,
      handleRemoveChecklistItem,
      handleCreateLane,
      handleUpdateLane,
      handleDeleteLane,
      handleCreateCard,
      handleUpdateCard,
      handleDeleteCard,
      handleCreateTemplate,
      handleUpdateTemplate,
      handleDeleteTemplate,
      handleCreatePortal,
      handleUpdatePortal,
      handleDeletePortal,
      busy,
    ],
  );

  const activePanel = panelState.key ? panelContent[panelState.key] : null;

  useEffect(() => {
    closePanel();
  }, [activeWorkspaceId, closePanel]);

  const content = () => {
    if (loading) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        </div>
      );
    }

    if (error && !overview) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-lg font-semibold text-rose-500">{error}</p>
          <button
            type="button"
            onClick={loadWorkspaces}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-16">
        <section id="interview-overview" className="space-y-6">
          <div className="rounded-4xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Workspace</p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {overview?.workspace?.name ?? 'Interview control centre'}
                </h2>
                <p className="max-w-2xl text-sm text-slate-600">
                  Switch between hiring pods, keep stakeholders aligned, and open the full room command panel or insights hub without leaving the dashboard.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <WorkspaceSwitcher
                  workspaces={workspaces}
                  value={activeWorkspaceId}
                  onChange={setActiveWorkspaceId}
                  onRefresh={() => activeWorkspaceId && loadWorkspace(activeWorkspaceId)}
                  refreshing={refreshing}
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={() => setInsightsOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
                >
                  Insights & prep
                </button>
                <button
                  type="button"
                  onClick={() => openPanel('rooms')}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                >
                  Open command panel
                </button>
              </div>
            </div>
            <div className="mt-6">
              <StatsStrip stats={stats} />
            </div>
            {error ? <p className="mt-4 text-sm text-rose-500">{error}</p> : null}
          </div>
        </section>

        <section id="interview-control" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {controlCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => openPanel(card.id)}
                className="group flex h-36 flex-col justify-between rounded-3xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200/70 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="text-4xl font-semibold text-slate-900">{card.value}</span>
                <span className="text-sm font-semibold uppercase tracking-wide text-slate-400">{card.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  };

  return (
    <AgencyDashboardLayout
      title="Interview operations"
      subtitle="Coordinate panels, prep portals, and interview rooms from one command centre."
      description="Automate candidate comms, keep interviewers aligned, and track SLA performance without leaving the workspace."
      activeMenuItem="interviews"
      workspace={overview?.workspace ?? null}
    >
      <div className="space-y-12">{content()}</div>

      <Transition.Root show={panelState.open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closePanel}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/50" />
          </Transition.Child>

          <div className="fixed inset-0 flex justify-end">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="ease-in duration-150"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="w-full max-w-6xl bg-white shadow-2xl">
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 px-8 py-6">
                    <Dialog.Title className="text-lg font-semibold text-slate-900">
                      {activePanel?.label ?? ''}
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={closePanel}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                    >
                      Close
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto px-8 py-8">{activePanel?.node ?? null}</div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <Transition.Root show={insightsOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={setInsightsOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center px-4 py-8">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="scale-95 opacity-0"
              enterTo="scale-100 opacity-100"
              leave="ease-in duration-150"
              leaveFrom="scale-100 opacity-100"
              leaveTo="scale-95 opacity-0"
            >
              <Dialog.Panel className="w-full max-w-4xl rounded-4xl border border-slate-200 bg-white p-8 shadow-2xl">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Dialog.Title className="text-2xl font-semibold text-slate-900">Interview readiness insights</Dialog.Title>
                    <Dialog.Description className="mt-2 max-w-2xl text-sm text-slate-600">
                      Track upcoming panels, outstanding scorecards, and prep coverage to keep candidates ready and interviewers aligned.
                    </Dialog.Description>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInsightsOpen(false)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {insightsCards.map((card) => (
                    <div key={card.id} className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
                      <p className="mt-2 text-sm text-slate-600">{card.description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Next interview sessions</h3>
                  {upcomingSessions.length === 0 ? (
                    <p className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      No upcoming sessions were found for this workspace. Schedule a room to populate the preview queue instantly.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {upcomingSessions.map((session) => (
                        <li
                          key={`${session.roomId}-${session.startsAt}`}
                          className="flex flex-col gap-1 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-slate-900">{session.roomName ?? `Room #${session.roomId}`}</span>
                            <span className="text-xs font-semibold uppercase tracking-wide text-blue-500">{formatRelative(session.startsAt)}</span>
                          </div>
                          <p className="text-sm text-slate-600">
                            {session.candidate?.name ?? 'Candidate'} • {session.interviewerCount} interviewer{session.interviewerCount === 1 ? '' : 's'}
                          </p>
                          <p className="text-xs text-slate-500">Starts {formatDateTime(session.startsAt)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </AgencyDashboardLayout>
  );
}


import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import WorkspaceSwitcher from '../../components/admin/interviews/WorkspaceSwitcher.jsx';
import StatsStrip from '../../components/admin/interviews/StatsStrip.jsx';
import RoomsPanel from '../../components/admin/interviews/RoomsPanel.jsx';
import WorkflowPanel from '../../components/admin/interviews/WorkflowPanel.jsx';
import TemplatesPanel from '../../components/admin/interviews/TemplatesPanel.jsx';
import PrepPortalsPanel from '../../components/admin/interviews/PrepPortalsPanel.jsx';
import { ADMIN_DASHBOARD_MENU_SECTIONS } from '../../constants/adminMenu.js';
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
} from '../../services/interviews.js';

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
  return 'Unexpected error';
}

export default function AdminInterviewManagementPage() {
  const { session } = useSession();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [panelState, setPanelState] = useState({ open: false, key: null });

  const menuSections = useMemo(() => {
    return [
      ...ADMIN_DASHBOARD_MENU_SECTIONS,
      {
        id: 'interview-sections',
        label: 'Interview',
        items: [
          { id: 'interview-overview', name: 'Overview', sectionId: 'interview-overview' },
          { id: 'interview-control', name: 'Control', sectionId: 'interview-control' },
        ],
      },
    ];
  }, []);

  const loadWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const response = await listInterviewWorkspaces();
      const items = Array.isArray(response?.workspaces) ? response.workspaces : [];
      setWorkspaces(items);
      if (!items.some((item) => item.id === activeWorkspaceId)) {
        setActiveWorkspaceId(items[0]?.id ?? null);
      }
      setError(null);
    } catch (err) {
      setWorkspaces([]);
      setError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  }, [activeWorkspaceId]);

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
    (payload) =>
      executeAndRefresh(() => createInterviewRoom(activeWorkspaceId, payload)),
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
    (roomId, participantId, payload) => executeAndRefresh(() => updateInterviewParticipant(roomId, participantId, payload)),
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
    (roomId, itemId, payload) => executeAndRefresh(() => updateInterviewChecklistItem(roomId, itemId, payload)),
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
    (laneId, cardId, payload) => executeAndRefresh(() => updateInterviewCard(activeWorkspaceId, laneId, cardId, payload)),
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
          <WorkspaceSwitcher
            workspaces={workspaces}
            value={activeWorkspaceId}
            onChange={setActiveWorkspaceId}
            onRefresh={() => activeWorkspaceId && loadWorkspace(activeWorkspaceId)}
            refreshing={refreshing}
            disabled={busy}
          />
          <StatsStrip stats={stats} />
          {error ? <p className="text-sm text-rose-500">{error}</p> : null}
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
    <DashboardLayout
      currentDashboard="admin"
      title="Interviews"
      subtitle={session?.name ? `${session.name} · Admin` : 'Admin'}
      menuSections={menuSections}
    >
      <div className="px-6 py-10 lg:px-16">{content()}</div>
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
                  <div className="flex-1 overflow-y-auto px-8 py-8">
                    {activePanel?.node ?? null}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </DashboardLayout>
  );
}

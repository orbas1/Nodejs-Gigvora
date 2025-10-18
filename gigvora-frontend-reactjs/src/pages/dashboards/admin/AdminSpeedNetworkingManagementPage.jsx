import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import SpeedNetworkingStats from '../../../components/admin/speedNetworking/SpeedNetworkingStats.jsx';
import SpeedNetworkingFilters from '../../../components/admin/speedNetworking/SpeedNetworkingFilters.jsx';
import SpeedNetworkingSessionsTable from '../../../components/admin/speedNetworking/SpeedNetworkingSessionsTable.jsx';
import SpeedNetworkingSessionDrawer from '../../../components/admin/speedNetworking/SpeedNetworkingSessionDrawer.jsx';
import SpeedNetworkingParticipantManager from '../../../components/admin/speedNetworking/SpeedNetworkingParticipantManager.jsx';
import {
  fetchAdminSpeedNetworkingCatalog,
  fetchAdminSpeedNetworkingSessions,
  fetchAdminSpeedNetworkingSession,
  createAdminSpeedNetworkingSession,
  updateAdminSpeedNetworkingSession,
  deleteAdminSpeedNetworkingSession,
  createAdminSpeedNetworkingParticipant,
  updateAdminSpeedNetworkingParticipant,
  deleteAdminSpeedNetworkingParticipant,
} from '../../../services/adminSpeedNetworking.js';
import useSession from '../../../hooks/useSession.js';
import DashboardAccessDenied from '../../../components/auth/DashboardAccessDenied.jsx';
import { ADMIN_DASHBOARD_MENU_SECTIONS } from '../../../constants/adminMenu.js';
import { deriveAdminAccess } from '../../../utils/adminAccess.js';

const MENU_SECTIONS = [
  {
    label: 'Speed networking',
    items: [
      { id: 'overview', name: 'Overview', sectionId: 'speed-networking-overview' },
      { id: 'sessions', name: 'Sessions', sectionId: 'speed-networking-sessions' },
      { id: 'participants', name: 'Participants', sectionId: 'speed-networking-participants' },
    ],
  },
];

const INITIAL_FILTERS = { status: ['scheduled', 'in_progress'] };
const EMPTY_PAGINATION = Object.freeze({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
const EMPTY_METRICS = Object.freeze({ totalsByStatus: {}, participantsTotal: 0, participantsEngaged: 0, nextSession: null });

function deriveNextSession(sessions = []) {
  const scheduled = sessions
    .filter((session) => session.scheduledStart)
    .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
  return scheduled[0]?.scheduledStart ?? null;
}

export default function AdminSpeedNetworkingManagementPage() {
  const { session, isAuthenticated } = useSession();
  const { hasAdminAccess } = useMemo(() => deriveAdminAccess(session ?? {}), [session]);
  const canAccess = isAuthenticated && hasAdminAccess;

  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState(null);

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [error, setError] = useState(null);

  const [activeSection, setActiveSection] = useState('overview');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('create');
  const [drawerInitialValues, setDrawerInitialValues] = useState(null);
  const [drawerBusy, setDrawerBusy] = useState(false);

  const [selectedSession, setSelectedSession] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [participantBusy, setParticipantBusy] = useState(false);

  const loadCatalog = useCallback(async () => {
    try {
      const response = await fetchAdminSpeedNetworkingCatalog();
      setCatalog(response);
      setCatalogError(null);
    } catch (err) {
      setCatalogError(err?.message ?? 'Unable to load catalog.');
      setCatalog(null);
    }
  }, []);

  const loadSessions = useCallback(
    async (nextFilters = filters, overridePage) => {
      if (!canAccess) return;
      const nextPage = overridePage ?? pagination.page ?? 1;
      setLoading(true);
      try {
        const response = await fetchAdminSpeedNetworkingSessions({ ...nextFilters, page: nextPage });
        const list = response?.data ?? [];
        setSessions(list);
        setMetrics({ ...EMPTY_METRICS, ...(response?.metrics ?? {}), nextSession: deriveNextSession(list) });
        setPagination({ ...EMPTY_PAGINATION, ...(response?.pagination ?? {}), page: response?.pagination?.page ?? nextPage });
        setError(null);
        return response;
      } catch (err) {
        setError(err?.message ?? 'Unable to load sessions right now.');
        setSessions([]);
        setMetrics(EMPTY_METRICS);
        setPagination(EMPTY_PAGINATION);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.page, canAccess],
  );

  useEffect(() => {
    if (!canAccess) return;
    loadCatalog();
    loadSessions(INITIAL_FILTERS, 1);
  }, [canAccess, loadCatalog, loadSessions]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadCatalog(), loadSessions(filters)]);
    if (selectedSession?.id) {
      try {
        const detail = await fetchAdminSpeedNetworkingSession(selectedSession.id);
        setSelectedSession(detail);
      } catch (err) {
        console.warn('Unable to refresh session detail', err);
      }
    }
    setRefreshing(false);
  }, [filters, loadCatalog, loadSessions, selectedSession?.id]);

  const handleFiltersChange = useCallback(
    (patch) => {
      setFilters((current) => {
        const next = { ...current, ...patch };
        loadSessions(next, 1);
        return next;
      });
    },
    [loadSessions],
  );

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    loadSessions(INITIAL_FILTERS, 1);
  }, [loadSessions]);

  const handlePageChange = useCallback(
    (page) => {
      const clamped = Math.max(1, Math.min(page, pagination.totalPages ?? 1));
      setPagination((current) => ({ ...current, page: clamped }));
      loadSessions(filters, clamped);
    },
    [filters, pagination.totalPages, loadSessions],
  );

  const openCreateDrawer = useCallback(() => {
    setDrawerMode('create');
    setDrawerInitialValues(null);
    setDrawerOpen(true);
  }, []);

  const openEditDrawer = useCallback(
    async (sessionRow) => {
      setDrawerMode('edit');
      try {
        const detail = await fetchAdminSpeedNetworkingSession(sessionRow.id);
        setDrawerInitialValues(detail);
        setDrawerOpen(true);
      } catch (err) {
        window.alert(err?.message ?? 'Unable to load session for editing.');
      }
    },
    [],
  );

  const handleDrawerSubmit = useCallback(
    async (payload) => {
      setDrawerBusy(true);
      try {
        if (drawerMode === 'create') {
          await createAdminSpeedNetworkingSession(payload);
        } else if (drawerInitialValues?.id) {
          await updateAdminSpeedNetworkingSession(drawerInitialValues.id, payload);
        }
        setDrawerOpen(false);
        setDrawerInitialValues(null);
        await loadSessions(filters);
        if (drawerInitialValues?.id) {
          const detail = await fetchAdminSpeedNetworkingSession(drawerInitialValues.id);
          setSelectedSession(detail);
        }
      } catch (err) {
        window.alert(err?.message ?? 'Unable to save session.');
      } finally {
        setDrawerBusy(false);
      }
    },
    [drawerMode, drawerInitialValues, filters, loadSessions],
  );

  const handleDeleteSession = useCallback(
    async (sessionRow) => {
      if (!window.confirm(`Remove "${sessionRow.title}"?`)) {
        return;
      }
      try {
        await deleteAdminSpeedNetworkingSession(sessionRow.id);
        if (selectedSession?.id === sessionRow.id) {
          setSelectedSession(null);
        }
        await loadSessions(filters);
      } catch (err) {
        window.alert(err?.message ?? 'Unable to delete session.');
      }
    },
    [filters, loadSessions, selectedSession?.id],
  );

  const handleSelectSession = useCallback(async (sessionRow) => {
    setDetailLoading(true);
    try {
      const detail = await fetchAdminSpeedNetworkingSession(sessionRow.id);
      setSelectedSession(detail);
      setActiveSection('participants');
      const element = document.getElementById('speed-networking-participants');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      window.alert(err?.message ?? 'Unable to load session detail.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleParticipantCreate = useCallback(
    async (payload) => {
      if (!selectedSession?.id) return;
      setParticipantBusy(true);
      try {
        await createAdminSpeedNetworkingParticipant(selectedSession.id, payload);
        const detail = await fetchAdminSpeedNetworkingSession(selectedSession.id);
        setSelectedSession(detail);
      } catch (err) {
        window.alert(err?.message ?? 'Unable to add participant.');
      } finally {
        setParticipantBusy(false);
      }
    },
    [selectedSession?.id],
  );

  const handleParticipantUpdate = useCallback(
    async (participantId, payload) => {
      if (!selectedSession?.id) return;
      setParticipantBusy(true);
      try {
        await updateAdminSpeedNetworkingParticipant(selectedSession.id, participantId, payload);
        const detail = await fetchAdminSpeedNetworkingSession(selectedSession.id);
        setSelectedSession(detail);
      } catch (err) {
        window.alert(err?.message ?? 'Unable to update participant.');
      } finally {
        setParticipantBusy(false);
      }
    },
    [selectedSession?.id],
  );

  const handleParticipantDelete = useCallback(
    async (participantId) => {
      if (!selectedSession?.id) return;
      if (!window.confirm('Remove this participant?')) {
        return;
      }
      setParticipantBusy(true);
      try {
        await deleteAdminSpeedNetworkingParticipant(selectedSession.id, participantId);
        const detail = await fetchAdminSpeedNetworkingSession(selectedSession.id);
        setSelectedSession(detail);
      } catch (err) {
        window.alert(err?.message ?? 'Unable to remove participant.');
      } finally {
        setParticipantBusy(false);
      }
    },
    [selectedSession?.id],
  );

  const handleMenuSelect = useCallback((itemId, item) => {
    setActiveSection(itemId);
    if (item?.sectionId) {
      const element = document.getElementById(item.sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, []);

  if (!canAccess) {
    return <DashboardAccessDenied title="Admin clearance required" menuSections={ADMIN_DASHBOARD_MENU_SECTIONS} />;
  }

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Speed networking"
      subtitle="Sessions"
      menuSections={MENU_SECTIONS}
      availableDashboards={['admin', 'user', 'freelancer', 'company', 'agency']}
      activeMenuItem={activeSection}
      onMenuItemSelect={handleMenuSelect}
    >
      <div className="mx-auto w-full min-h-screen space-y-10 px-6 py-10 lg:px-10 xl:px-12">
        {catalogError ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{catalogError}</div>
        ) : null}
        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        <section id="speed-networking-overview">
          <SpeedNetworkingStats metrics={metrics} onCreate={openCreateDrawer} onRefresh={handleRefresh} refreshing={refreshing} />
        </section>

        <section id="speed-networking-sessions" className="space-y-6">
          <SpeedNetworkingFilters catalog={catalog} filters={filters} onChange={handleFiltersChange} onReset={handleResetFilters} />
          <SpeedNetworkingSessionsTable
            sessions={sessions}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onSelect={handleSelectSession}
            onEdit={openEditDrawer}
            onDelete={handleDeleteSession}
          />
        </section>

        <section id="speed-networking-participants" className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Session detail</h2>
            {detailLoading ? (
              <p className="mt-2 text-sm text-slate-500">Loading session detail…</p>
            ) : selectedSession ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Title</span>
                  <p className="text-sm font-semibold text-slate-900">{selectedSession.title}</p>
                  <p className="text-xs text-slate-500">{selectedSession.description || 'No description provided yet.'}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Schedule</span>
                  <p className="text-sm text-slate-700">
                    {selectedSession.scheduledStart
                      ? new Date(selectedSession.scheduledStart).toLocaleString()
                      : 'Start time TBC'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Host: {selectedSession.host?.name ?? 'Unassigned'} · {selectedSession.totalRounds ?? '--'} rounds ·{' '}
                    {selectedSession.roundDurationSeconds ?? '--'}s per round
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Select a session to load rooms and participants.</p>
            )}
          </div>

          {selectedSession ? (
            <SpeedNetworkingParticipantManager
              session={selectedSession}
              catalog={catalog}
              busy={participantBusy}
              onCreate={handleParticipantCreate}
              onUpdate={handleParticipantUpdate}
              onDelete={handleParticipantDelete}
            />
          ) : null}
        </section>
      </div>

      <SpeedNetworkingSessionDrawer
        open={drawerOpen}
        mode={drawerMode}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleDrawerSubmit}
        busy={drawerBusy}
        initialValues={drawerInitialValues}
        catalog={catalog}
      />
    </DashboardLayout>
  );
}

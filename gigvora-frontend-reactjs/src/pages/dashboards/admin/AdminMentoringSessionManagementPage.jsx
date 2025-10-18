import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import MentoringStatsCards from '../../../components/admin/mentoring/MentoringStatsCards.jsx';
import MentoringSessionFilters from '../../../components/admin/mentoring/MentoringSessionFilters.jsx';
import MentoringSessionTable from '../../../components/admin/mentoring/MentoringSessionTable.jsx';
import MentoringSessionDetailPanel from '../../../components/admin/mentoring/MentoringSessionDetailPanel.jsx';
import MentoringActionQueue from '../../../components/admin/mentoring/MentoringActionQueue.jsx';
import MentoringSessionSchedulerDrawer from '../../../components/admin/mentoring/MentoringSessionSchedulerDrawer.jsx';
import {
  fetchAdminMentoringCatalog,
  fetchAdminMentoringSessions,
  createAdminMentoringSession,
  updateAdminMentoringSession,
  createAdminMentoringNote,
  updateAdminMentoringNote,
  deleteAdminMentoringNote,
  createAdminMentoringAction,
  updateAdminMentoringAction,
  deleteAdminMentoringAction,
} from '../../../services/adminMentoring.js';

const MENU_GROUPS = [
  {
    label: 'Mentoring',
    items: [
      { id: 'summary', name: 'Summary', sectionId: 'mentoring-summary' },
      { id: 'queue', name: 'Queue', sectionId: 'mentoring-queue' },
      { id: 'book', name: 'Book', sectionId: 'mentoring-book' },
      { id: 'tasks', name: 'Tasks', sectionId: 'mentoring-tasks' },
    ],
  },
];

const DEFAULT_CATALOG = {
  mentors: [],
  mentees: [],
  owners: [],
  serviceLines: [],
  statuses: [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'requested', label: 'Requested' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
  meetingProviders: [
    { value: 'zoom', label: 'Zoom' },
    { value: 'google_meet', label: 'Google Meet' },
    { value: 'microsoft_teams', label: 'Microsoft Teams' },
    { value: 'phone', label: 'Phone' },
  ],
  noteVisibilities: [
    { value: 'internal', label: 'Internal' },
    { value: 'mentor', label: 'Share with mentor' },
  ],
  actionStatuses: [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
  actionPriorities: [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ],
  generatedAt: new Date().toISOString(),
};

const EMPTY_PAGINATION = Object.freeze({ page: 1, pageSize: 20, total: 0, totalPages: 1 });
const EMPTY_METRICS = Object.freeze({ upcomingCount: 0, followUpsDue: 0, averageFeedback: null, openActionItems: 0, totalsByStatus: {}, actionQueue: [] });

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function AdminMentoringSessionManagementPage() {
  const [activeSection, setActiveSection] = useState('summary');
  const [catalog, setCatalog] = useState(DEFAULT_CATALOG);
  const [catalogError, setCatalogError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [filters, setFilters] = useState({ status: ['scheduled'] });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [selectedSession, setSelectedSession] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const [schedulerSubmitting, setSchedulerSubmitting] = useState(false);
  const [updatingSession, setUpdatingSession] = useState(false);
  const [error, setError] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const loadCatalog = useCallback(async () => {
    try {
      const response = await fetchAdminMentoringCatalog();
      setCatalog({ ...DEFAULT_CATALOG, ...response });
      setCatalogError(null);
    } catch (err) {
      setCatalogError(err?.message ?? 'Catalog unavailable.');
      setCatalog(DEFAULT_CATALOG);
    }
  }, []);

  const loadSessions = useCallback(
    async (nextFilters = filters, overridePage) => {
      const nextPage = overridePage ?? pagination.page ?? 1;
      setLoading(true);
      try {
        const response = await fetchAdminMentoringSessions({ ...nextFilters, page: nextPage });
        const data = toArray(response?.data);
        setSessions(data);
        setMetrics({ ...EMPTY_METRICS, ...response?.metrics });
        setPagination({ ...EMPTY_PAGINATION, ...(response?.pagination ?? {}), page: response?.pagination?.page ?? nextPage });
        setError(null);
        return response;
      } catch (err) {
        setError(err?.message ?? 'Unable to load sessions.');
        setSessions([]);
        setMetrics(EMPTY_METRICS);
        setPagination(EMPTY_PAGINATION);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.page],
  );

  useEffect(() => {
    loadCatalog();
    loadSessions(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const reset = { status: ['scheduled'] };
    setFilters(reset);
    loadSessions(reset, 1);
  }, [loadSessions]);

  const handlePageChange = useCallback(
    (page) => {
      const clamped = Math.max(1, Math.min(page, pagination.totalPages ?? 1));
      setPagination((current) => ({ ...current, page: clamped }));
      loadSessions(filters, clamped);
    },
    [filters, pagination.totalPages, loadSessions],
  );

  const handleCreateSession = useCallback(
    async (payload) => {
      setSchedulerSubmitting(true);
      try {
        await createAdminMentoringSession(payload);
        setSchedulerOpen(false);
        setActiveSection('queue');
        await loadSessions(filters);
      } finally {
        setSchedulerSubmitting(false);
      }
    },
    [filters, loadSessions],
  );

  const handleUpdateSession = useCallback(
    async (sessionId, payload) => {
      setUpdatingSession(true);
      try {
        await updateAdminMentoringSession(sessionId, payload);
        const response = await loadSessions(filters);
        const refreshed = response?.data?.find((entry) => entry.id === sessionId);
        if (refreshed) {
          setSelectedSession(refreshed);
        } else {
          setSelectedSession((current) => (current?.id === sessionId ? { ...current, ...payload } : current));
        }
      } finally {
        setUpdatingSession(false);
      }
    },
    [filters, loadSessions],
  );

  const handleNoteCreate = useCallback(
    async (sessionId, payload) => {
      await createAdminMentoringNote(sessionId, payload);
      const response = await loadSessions(filters);
      const refreshed = response?.data?.find((entry) => entry.id === sessionId);
      if (refreshed) {
        setSelectedSession(refreshed);
      }
    },
    [filters, loadSessions],
  );

  const handleNoteUpdate = useCallback(
    async (sessionId, noteId, payload) => {
      await updateAdminMentoringNote(sessionId, noteId, payload);
      const response = await loadSessions(filters);
      const refreshed = response?.data?.find((entry) => entry.id === sessionId);
      if (refreshed) {
        setSelectedSession(refreshed);
      }
    },
    [filters, loadSessions],
  );

  const handleNoteDelete = useCallback(
    async (sessionId, noteId) => {
      await deleteAdminMentoringNote(sessionId, noteId);
      const response = await loadSessions(filters);
      const refreshed = response?.data?.find((entry) => entry.id === sessionId);
      if (refreshed) {
        setSelectedSession(refreshed);
      }
    },
    [filters, loadSessions],
  );

  const handleActionCreate = useCallback(
    async (sessionId, payload) => {
      await createAdminMentoringAction(sessionId, payload);
      const response = await loadSessions(filters);
      const refreshed = response?.data?.find((entry) => entry.id === sessionId);
      if (refreshed) {
        setSelectedSession(refreshed);
      }
    },
    [filters, loadSessions],
  );

  const handleActionUpdate = useCallback(
    async (sessionId, actionId, updates) => {
      await updateAdminMentoringAction(sessionId, actionId, updates);
      const response = await loadSessions(filters);
      const refreshed = response?.data?.find((entry) => entry.id === sessionId);
      if (refreshed) {
        setSelectedSession(refreshed);
      }
    },
    [filters, loadSessions],
  );

  const handleActionDelete = useCallback(
    async (sessionId, actionId) => {
      await deleteAdminMentoringAction(sessionId, actionId);
      const response = await loadSessions(filters);
      const refreshed = response?.data?.find((entry) => entry.id === sessionId);
      if (refreshed) {
        setSelectedSession(refreshed);
      }
    },
    [filters, loadSessions],
  );

  const handleActionQueueUpdate = useCallback(
    (sessionId, actionId, status) => {
      handleActionUpdate(sessionId, actionId, { status });
    },
    [handleActionUpdate],
  );

  const handleOpenSession = useCallback(
    async (sessionOrTask) => {
      if (!sessionOrTask) {
        return;
      }
      const sessionId = typeof sessionOrTask === 'object' ? sessionOrTask.id ?? sessionOrTask.sessionId : sessionOrTask;
      const directSession = typeof sessionOrTask === 'object' && sessionOrTask.topic ? sessionOrTask : null;
      if (directSession) {
        setSelectedSession(directSession);
        setDetailOpen(true);
        return;
      }
      const localMatch = sessions.find((entry) => entry.id === sessionId);
      if (localMatch) {
        setSelectedSession(localMatch);
        setDetailOpen(true);
        return;
      }
      const response = await loadSessions(filters);
      const refreshed = response?.data?.find((entry) => entry.id === sessionId);
      if (refreshed) {
        setSelectedSession(refreshed);
        setDetailOpen(true);
      }
    },
    [filters, loadSessions, sessions],
  );

  const closeDetailPanel = useCallback(() => {
    setDetailOpen(false);
  }, []);

  const actionQueue = useMemo(() => toArray(metrics?.actionQueue), [metrics?.actionQueue]);

  const upcomingSessions = useMemo(() => {
    const now = new Date();
    return [...sessions]
      .filter((session) => {
        if (!session?.scheduledAt) {
          return false;
        }
        const scheduled = new Date(session.scheduledAt);
        if (Number.isNaN(scheduled.getTime())) {
          return false;
        }
        return scheduled >= now;
      })
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
      .slice(0, 5);
  }, [sessions]);

  const summarySection = (
    <section id="mentoring-summary" className="space-y-6">
      <MentoringStatsCards metrics={metrics} totalsByStatus={metrics?.totalsByStatus ?? {}} />
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-blue-100/20">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">Upcoming</h3>
          <button
            type="button"
            onClick={() => setActiveSection('queue')}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300"
          >
            Queue
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {upcomingSessions.length ? (
            upcomingSessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => handleOpenSession(session)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{session.topic}</span>
                    <span className="text-xs text-slate-500">
                      {session.mentor ? `${session.mentor.firstName} ${session.mentor.lastName}` : 'Unassigned'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : 'TBC'}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500">
              No upcoming sessions.
            </p>
          )}
        </div>
      </div>
    </section>
  );

  const queueSection = (
    <section id="mentoring-queue" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">Queue</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((open) => !open)}
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300 lg:hidden"
          >
            {mobileFiltersOpen ? 'Hide filters' : 'Filters'}
          </button>
          <button
            type="button"
            onClick={() => setSchedulerOpen(true)}
            className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            New session
          </button>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <div className="hidden lg:block">
          <MentoringSessionFilters
            filters={filters}
            catalog={catalog}
            onChange={handleFiltersChange}
            onReset={handleResetFilters}
            loading={loading}
          />
        </div>
        <div className="lg:col-span-1">
          <MentoringSessionTable
            sessions={sessions}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onSelect={handleOpenSession}
          />
        </div>
      </div>
      {mobileFiltersOpen ? (
        <div className="lg:hidden">
          <MentoringSessionFilters
            filters={filters}
            catalog={catalog}
            onChange={handleFiltersChange}
            onReset={handleResetFilters}
            loading={loading}
          />
        </div>
      ) : null}
    </section>
  );

  const bookSection = (
    <section id="mentoring-book" className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Create session</h3>
            <p className="text-sm text-slate-500">Launch the scheduler to add a new mentoring slot.</p>
          </div>
          <button
            type="button"
            onClick={() => setSchedulerOpen(true)}
            className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Open scheduler
          </button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mentors</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{catalog.mentors.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mentees</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{catalog.mentees.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admins</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{catalog.owners.length}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Services</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{catalog.serviceLines.length}</p>
        </div>
      </div>
    </section>
  );

  const tasksSection = (
    <section id="mentoring-tasks" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Tasks</h2>
        <button
          type="button"
          onClick={() => setActiveSection('queue')}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:border-slate-300"
        >
          View queue
        </button>
      </div>
      <MentoringActionQueue
        actionItems={actionQueue}
        onSelectSession={handleOpenSession}
        onUpdateStatus={handleActionQueueUpdate}
      />
    </section>
  );

  const sectionMap = {
    summary: summarySection,
    queue: queueSection,
    book: bookSection,
    tasks: tasksSection,
  };

  const content = sectionMap[activeSection] ?? summarySection;

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Mentoring"
      subtitle="Sessions"
      menuSections={MENU_GROUPS}
      availableDashboards={[
        'admin',
        { id: 'admin-mentoring', label: 'Mentoring', href: '/dashboard/admin/mentoring' },
        'user',
        'freelancer',
        'company',
        'agency',
        'headhunter',
      ]}
      activeMenuItem={activeSection}
      onMenuItemSelect={(itemId) => setActiveSection(itemId)}
    >
      <div className="mx-auto w-full min-h-screen space-y-10 px-6 py-10 lg:px-10 xl:px-12">
        {catalogError ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{catalogError}</div>
        ) : null}
        {error ? (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}
        {content}
      </div>

      <MentoringSessionDetailPanel
        session={selectedSession}
        open={detailOpen}
        catalog={catalog}
        onClose={closeDetailPanel}
        onUpdateSession={handleUpdateSession}
        onCreateNote={handleNoteCreate}
        onUpdateNote={handleNoteUpdate}
        onDeleteNote={handleNoteDelete}
        onCreateAction={handleActionCreate}
        onUpdateAction={handleActionUpdate}
        onDeleteAction={handleActionDelete}
        updating={updatingSession}
      />

      <MentoringSessionSchedulerDrawer
        open={schedulerOpen}
        onClose={() => setSchedulerOpen(false)}
        catalog={catalog}
        onSubmit={handleCreateSession}
        submitting={schedulerSubmitting}
      />
    </DashboardLayout>
  );
}

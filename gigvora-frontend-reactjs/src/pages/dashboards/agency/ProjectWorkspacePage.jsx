import { useCallback, useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import DataStatus from '../../../components/DataStatus.jsx';
import WorkspaceProjectSelector from '../../../components/agency/workspace/WorkspaceProjectSelector.jsx';
import WorkspaceOverviewTab from '../../../components/agency/workspace/WorkspaceOverviewTab.jsx';
import WorkspaceBudgetTab from '../../../components/agency/workspace/WorkspaceBudgetTab.jsx';
import WorkspaceTasksTab from '../../../components/agency/workspace/WorkspaceTasksTab.jsx';
import WorkspaceMeetingsTab from '../../../components/agency/workspace/WorkspaceMeetingsTab.jsx';
import WorkspaceTeamTab from '../../../components/agency/workspace/WorkspaceTeamTab.jsx';
import WorkspaceFilesTab from '../../../components/agency/workspace/WorkspaceFilesTab.jsx';
import WorkspaceObjectsTab from '../../../components/agency/workspace/WorkspaceObjectsTab.jsx';
import WorkspaceIntegrationsTab from '../../../components/agency/workspace/WorkspaceIntegrationsTab.jsx';
import WorkspaceChatTab from '../../../components/agency/workspace/WorkspaceChatTab.jsx';
import WorkspaceSummary from '../../../components/agency/workspace/WorkspaceSummary.jsx';
import { AGENCY_DASHBOARD_MENU_SECTIONS } from '../../../constants/agencyDashboardMenu.js';
import {
  fetchWorkspaceProjects,
  fetchWorkspaceManagement,
  createWorkspaceRecord,
  updateWorkspaceRecord,
  deleteWorkspaceRecord,
} from '../../../services/projectWorkspaceManagement.js';

const AVAILABLE_DASHBOARDS = ['agency', 'company', 'freelancer', 'user', 'headhunter'];

const TAB_DEFINITIONS = [
  { id: 'overview', label: 'Summary' },
  { id: 'budget', label: 'Budget' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'meetings', label: 'Meet' },
  { id: 'team', label: 'Team' },
  { id: 'files', label: 'Files' },
  { id: 'objects', label: 'Assets' },
  { id: 'integrations', label: 'Sync' },
  { id: 'chat', label: 'Chat' },
];

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

function formatStatus(value) {
  if (!value) {
    return 'Not set';
  }
  return String(value)
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatTimelineWindow(timeline) {
  if (!timeline?.startDate || !timeline?.endDate) {
    return null;
  }
  const start = new Date(timeline.startDate);
  const end = new Date(timeline.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }
  const formatter = new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric' });
  return `${formatter.format(start)} → ${formatter.format(end)}`;
}

export default function ProjectWorkspacePage() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [workspaceSnapshot, setWorkspaceSnapshot] = useState(null);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceRefreshing, setWorkspaceRefreshing] = useState(false);
  const [workspaceError, setWorkspaceError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState(TAB_DEFINITIONS[0].id);

  const projectMetadata = useMemo(() => {
    if (workspaceSnapshot?.project) {
      return workspaceSnapshot.project;
    }
    return projects.find((project) => project.id === selectedProjectId) ?? null;
  }, [projects, selectedProjectId, workspaceSnapshot]);

  const timelineWindow = useMemo(() => formatTimelineWindow(workspaceSnapshot?.timeline), [workspaceSnapshot]);

  const refreshWorkspace = useCallback(
    async (projectId, { showLoading = false, silent = false } = {}) => {
      const targetProjectId = projectId ?? selectedProjectId;
      if (!targetProjectId) {
        return null;
      }
      if (showLoading) {
        setWorkspaceLoading(true);
      } else if (!silent) {
        setWorkspaceRefreshing(true);
      }
      try {
        const data = await fetchWorkspaceManagement(targetProjectId);
        setWorkspaceSnapshot(data ?? null);
        setLastUpdated(new Date());
        setWorkspaceError(null);
        return data;
      } catch (error) {
        console.error('Failed to load workspace management snapshot', error);
        setWorkspaceError(error);
        throw error;
      } finally {
        if (showLoading) {
          setWorkspaceLoading(false);
        } else if (!silent) {
          setWorkspaceRefreshing(false);
        }
      }
    },
    [selectedProjectId],
  );

  const loadProjects = useCallback(
    async ({ projectId } = {}) => {
      setProjectsLoading(true);
      setWorkspaceLoading(true);
      try {
        const data = await fetchWorkspaceProjects({ projectId });
        const projectList = Array.isArray(data?.projects) ? data.projects : [];
        setProjects(projectList);

        const candidateId =
          projectId ??
          data?.selectedProjectId ??
          data?.workspace?.project?.id ??
          (projectList.length > 0 ? projectList[0].id : null);
        const normalisedId = typeof candidateId === 'string' ? Number(candidateId) : candidateId ?? null;
        setSelectedProjectId(Number.isFinite(normalisedId) ? normalisedId : null);

        if (data?.workspace) {
          setWorkspaceSnapshot(data.workspace);
          setLastUpdated(new Date());
          setWorkspaceError(null);
        } else if (Number.isFinite(normalisedId)) {
          await refreshWorkspace(normalisedId, { silent: true });
        } else {
          setWorkspaceSnapshot(null);
        }
      } catch (error) {
        console.error('Failed to load workspace projects', error);
        setWorkspaceError(error);
      } finally {
        setProjectsLoading(false);
        setWorkspaceLoading(false);
      }
    },
    [refreshWorkspace],
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleProjectChange = useCallback(
    (projectId) => {
      const normalisedId = Number.isFinite(projectId) ? projectId : projectId ? Number(projectId) : null;
      setSelectedProjectId(Number.isFinite(normalisedId) ? normalisedId : null);
      if (Number.isFinite(normalisedId)) {
        refreshWorkspace(normalisedId, { showLoading: true });
      } else {
        setWorkspaceSnapshot(null);
      }
    },
    [refreshWorkspace],
  );

  const handleRefreshProjects = useCallback(() => {
    loadProjects({ projectId: selectedProjectId ?? undefined });
  }, [loadProjects, selectedProjectId]);

  const handleRefreshWorkspace = useCallback(() => {
    return refreshWorkspace(undefined, { silent: false });
  }, [refreshWorkspace]);

  const mutateEntity = useCallback(
    async (entity, operation, { recordId, payload } = {}) => {
      if (!selectedProjectId) {
        return;
      }
      try {
        if (operation === 'create') {
          await createWorkspaceRecord(selectedProjectId, entity, payload ?? {});
        } else if (operation === 'update') {
          await updateWorkspaceRecord(selectedProjectId, entity, recordId, payload ?? {});
        } else if (operation === 'delete') {
          await deleteWorkspaceRecord(selectedProjectId, entity, recordId);
        } else {
          throw new Error(`Unsupported operation: ${operation}`);
        }
        await refreshWorkspace(selectedProjectId, { silent: false });
      } catch (error) {
        console.error(`Workspace ${operation} failed for ${entity}`, error);
        setWorkspaceError(error);
      }
    },
    [refreshWorkspace, selectedProjectId],
  );

  const handleUpdateSummary = useCallback((payload) => mutateEntity('summary', 'update', { payload }), [mutateEntity]);

  const handleCreateObjective = useCallback((payload) => mutateEntity('objectives', 'create', { payload }), [mutateEntity]);
  const handleUpdateObjective = useCallback(
    (id, payload) => mutateEntity('objectives', 'update', { recordId: id, payload }),
    [mutateEntity],
  );
  const handleDeleteObjective = useCallback((id) => mutateEntity('objectives', 'delete', { recordId: id }), [mutateEntity]);

  const handleCreateBudgetLine = useCallback((payload) => mutateEntity('budget-lines', 'create', { payload }), [mutateEntity]);
  const handleUpdateBudgetLine = useCallback(
    (id, payload) => mutateEntity('budget-lines', 'update', { recordId: id, payload }),
    [mutateEntity],
  );
  const handleDeleteBudgetLine = useCallback(
    (id) => mutateEntity('budget-lines', 'delete', { recordId: id }),
    [mutateEntity],
  );

  const handleCreateTask = useCallback((payload) => mutateEntity('tasks', 'create', { payload }), [mutateEntity]);
  const handleUpdateTask = useCallback((id, payload) => mutateEntity('tasks', 'update', { recordId: id, payload }), [mutateEntity]);
  const handleDeleteTask = useCallback((id) => mutateEntity('tasks', 'delete', { recordId: id }), [mutateEntity]);

  const handleCreateMeeting = useCallback((payload) => mutateEntity('meetings', 'create', { payload }), [mutateEntity]);
  const handleUpdateMeeting = useCallback(
    (id, payload) => mutateEntity('meetings', 'update', { recordId: id, payload }),
    [mutateEntity],
  );
  const handleDeleteMeeting = useCallback((id) => mutateEntity('meetings', 'delete', { recordId: id }), [mutateEntity]);

  const handleCreateEvent = useCallback((payload) => mutateEntity('calendar-events', 'create', { payload }), [mutateEntity]);
  const handleUpdateEvent = useCallback(
    (id, payload) => mutateEntity('calendar-events', 'update', { recordId: id, payload }),
    [mutateEntity],
  );
  const handleDeleteEvent = useCallback(
    (id) => mutateEntity('calendar-events', 'delete', { recordId: id }),
    [mutateEntity],
  );

  const handleCreateRole = useCallback((payload) => mutateEntity('role-assignments', 'create', { payload }), [mutateEntity]);
  const handleUpdateRole = useCallback(
    (id, payload) => mutateEntity('role-assignments', 'update', { recordId: id, payload }),
    [mutateEntity],
  );
  const handleDeleteRole = useCallback(
    (id) => mutateEntity('role-assignments', 'delete', { recordId: id }),
    [mutateEntity],
  );

  const handleCreateInvite = useCallback((payload) => mutateEntity('invites', 'create', { payload }), [mutateEntity]);
  const handleUpdateInvite = useCallback((id, payload) => mutateEntity('invites', 'update', { recordId: id, payload }), [mutateEntity]);
  const handleDeleteInvite = useCallback((id) => mutateEntity('invites', 'delete', { recordId: id }), [mutateEntity]);

  const handleCreateHrRecord = useCallback((payload) => mutateEntity('hr-records', 'create', { payload }), [mutateEntity]);
  const handleUpdateHrRecord = useCallback(
    (id, payload) => mutateEntity('hr-records', 'update', { recordId: id, payload }),
    [mutateEntity],
  );
  const handleDeleteHrRecord = useCallback((id) => mutateEntity('hr-records', 'delete', { recordId: id }), [mutateEntity]);

  const handleCreateTimeEntry = useCallback((payload) => mutateEntity('time-entries', 'create', { payload }), [mutateEntity]);
  const handleUpdateTimeEntry = useCallback(
    (id, payload) => mutateEntity('time-entries', 'update', { recordId: id, payload }),
    [mutateEntity],
  );
  const handleDeleteTimeEntry = useCallback((id) => mutateEntity('time-entries', 'delete', { recordId: id }), [mutateEntity]);

  const handleCreateDocument = useCallback((payload) => mutateEntity('documents', 'create', { payload }), [mutateEntity]);
  const handleUpdateDocument = useCallback(
    (id, payload) => mutateEntity('documents', 'update', { recordId: id, payload }),
    [mutateEntity],
  );
  const handleDeleteDocument = useCallback((id) => mutateEntity('documents', 'delete', { recordId: id }), [mutateEntity]);

  const handleCreateSubmission = useCallback((payload) => mutateEntity('submissions', 'create', { payload }), [mutateEntity]);
  const handleUpdateSubmission = useCallback(
    (id, payload) => mutateEntity('submissions', 'update', { recordId: id, payload }),
    [mutateEntity],
  );
  const handleDeleteSubmission = useCallback(
    (id) => mutateEntity('submissions', 'delete', { recordId: id }),
    [mutateEntity],
  );

  const handleCreateObject = useCallback((payload) => mutateEntity('objects', 'create', { payload }), [mutateEntity]);
  const handleUpdateObject = useCallback((id, payload) => mutateEntity('objects', 'update', { recordId: id, payload }), [mutateEntity]);
  const handleDeleteObject = useCallback((id) => mutateEntity('objects', 'delete', { recordId: id }), [mutateEntity]);

  const handleCreateMessage = useCallback((payload) => mutateEntity('chat-messages', 'create', { payload }), [mutateEntity]);
  const handleUpdateMessage = useCallback(
    (id, payload) => mutateEntity('chat-messages', 'update', { recordId: id, payload }),
    [mutateEntity],
  );
  const handleDeleteMessage = useCallback(
    (id) => mutateEntity('chat-messages', 'delete', { recordId: id }),
    [mutateEntity],
  );

  const handleUpdateIntegration = useCallback(
    (id, payload) => mutateEntity('integrations', 'update', { recordId: id, payload }),
    [mutateEntity],
  );

  return (
    <DashboardLayout
      currentDashboard="agency"
      title="Workspace"
      subtitle={projectMetadata?.title ?? 'Pick a project'}
      description="Drive delivery with focused budget, task, meeting, file, and chat tools."
      menuSections={AGENCY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem="project-workspace"
    >
      <div className="min-h-screen space-y-6 bg-slate-50 px-4 py-6 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-slate-900">Workspace</h1>
            <p className="text-sm text-slate-500">Switch projects and orchestrate the full delivery flow.</p>
          </div>
          <div className="w-full max-w-md">
            <WorkspaceProjectSelector
              projects={projects}
              value={selectedProjectId ?? ''}
              onChange={handleProjectChange}
              onRefresh={handleRefreshProjects}
              loading={projectsLoading || workspaceLoading || workspaceRefreshing}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px,1fr]">
          <aside className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
              <p className="font-semibold uppercase tracking-[0.3em] text-slate-500">Project</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{projectMetadata?.title ?? 'Select a project'}</p>
              <dl className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <dt>Status</dt>
                  <dd className="font-semibold text-slate-900">{formatStatus(projectMetadata?.status)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Timeline</dt>
                  <dd className="font-semibold text-slate-900">{timelineWindow ?? 'Unset'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt>Updated</dt>
                  <dd className="font-semibold text-slate-900">
                    {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Pending'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              <span>{workspaceRefreshing ? 'Refreshing…' : 'Latest data'}</span>
              <button
                type="button"
                onClick={() => refreshWorkspace(selectedProjectId, { showLoading: true })}
                className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white shadow-sm transition hover:bg-slate-700"
              >
                Refresh
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {TAB_DEFINITIONS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={classNames(
                    'w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-soft'
                      : 'bg-white text-slate-600 shadow-sm ring-1 ring-slate-200 hover:text-slate-900',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </aside>

          <main className="rounded-3xl border border-slate-200 bg-white shadow-soft">
            <div className="border-b border-slate-200 bg-slate-50 p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <WorkspaceSummary summary={workspaceSnapshot?.summary} />
                </div>
                <div className="w-full max-w-xs">
                  <DataStatus
                    loading={workspaceLoading || workspaceRefreshing}
                    fromCache={false}
                    lastUpdated={lastUpdated}
                    onRefresh={() => refreshWorkspace(selectedProjectId, { showLoading: true })}
                    error={workspaceError}
                    statusLabel="Workspace data"
                  />
                </div>
              </div>
            </div>
            <div className="min-h-[520px] p-6">
              {!workspaceLoading && !workspaceError && !workspaceSnapshot ? (
                <div className="py-12">
                  <DataStatus status="empty" title="Select a project" />
                </div>
              ) : null}

              {!workspaceLoading && !workspaceError && workspaceSnapshot ? (
                <div className="space-y-10">
                  {activeTab === 'overview' ? (
                    <WorkspaceOverviewTab
                      project={workspaceSnapshot?.project}
                      workspace={workspaceSnapshot?.workspace}
                      summary={workspaceSnapshot?.summary}
                      timeline={workspaceSnapshot?.timeline}
                      objectives={workspaceSnapshot?.objectives ?? []}
                      tasks={workspaceSnapshot?.tasks ?? []}
                      onUpdateSummary={handleUpdateSummary}
                      onCreateObjective={handleCreateObjective}
                      onUpdateObjective={handleUpdateObjective}
                      onDeleteObjective={handleDeleteObjective}
                    />
                  ) : null}

                  {activeTab === 'budget' ? (
                    <WorkspaceBudgetTab
                      budgets={workspaceSnapshot?.budgets ?? []}
                      submissions={workspaceSnapshot?.submissions ?? []}
                      onCreate={handleCreateBudgetLine}
                      onUpdate={handleUpdateBudgetLine}
                      onDelete={handleDeleteBudgetLine}
                    />
                  ) : null}

                  {activeTab === 'tasks' ? (
                    <WorkspaceTasksTab
                      tasks={workspaceSnapshot?.tasks ?? []}
                      onCreate={handleCreateTask}
                      onUpdate={handleUpdateTask}
                      onDelete={handleDeleteTask}
                    />
                  ) : null}

                  {activeTab === 'meetings' ? (
                    <WorkspaceMeetingsTab
                      meetings={workspaceSnapshot?.meetings ?? []}
                      calendarEvents={workspaceSnapshot?.calendarEvents ?? []}
                      onCreateMeeting={handleCreateMeeting}
                      onUpdateMeeting={handleUpdateMeeting}
                      onDeleteMeeting={handleDeleteMeeting}
                      onCreateEvent={handleCreateEvent}
                      onUpdateEvent={handleUpdateEvent}
                      onDeleteEvent={handleDeleteEvent}
                    />
                  ) : null}

                  {activeTab === 'team' ? (
                    <WorkspaceTeamTab
                      roleAssignments={workspaceSnapshot?.roleAssignments ?? []}
                      invites={workspaceSnapshot?.invites ?? []}
                      hrRecords={workspaceSnapshot?.hrRecords ?? []}
                      timeEntries={workspaceSnapshot?.timeEntries ?? []}
                      onCreateRole={handleCreateRole}
                      onUpdateRole={handleUpdateRole}
                      onDeleteRole={handleDeleteRole}
                      onCreateInvite={handleCreateInvite}
                      onUpdateInvite={handleUpdateInvite}
                      onDeleteInvite={handleDeleteInvite}
                      onCreateHr={handleCreateHrRecord}
                      onUpdateHr={handleUpdateHrRecord}
                      onDeleteHr={handleDeleteHrRecord}
                      onCreateTimeEntry={handleCreateTimeEntry}
                      onUpdateTimeEntry={handleUpdateTimeEntry}
                      onDeleteTimeEntry={handleDeleteTimeEntry}
                    />
                  ) : null}

                  {activeTab === 'files' ? (
                    <WorkspaceFilesTab
                      documents={workspaceSnapshot?.documents ?? []}
                      submissions={workspaceSnapshot?.submissions ?? []}
                      onCreateDocument={handleCreateDocument}
                      onUpdateDocument={handleUpdateDocument}
                      onDeleteDocument={handleDeleteDocument}
                      onCreateSubmission={handleCreateSubmission}
                      onUpdateSubmission={handleUpdateSubmission}
                      onDeleteSubmission={handleDeleteSubmission}
                    />
                  ) : null}

                  {activeTab === 'objects' ? (
                    <WorkspaceObjectsTab
                      objects={workspaceSnapshot?.workspaceObjects ?? []}
                      onCreate={handleCreateObject}
                      onUpdate={handleUpdateObject}
                      onDelete={handleDeleteObject}
                    />
                  ) : null}

                  {activeTab === 'integrations' ? (
                    <WorkspaceIntegrationsTab
                      integrations={workspaceSnapshot?.integrations ?? []}
                      onUpdate={handleUpdateIntegration}
                    />
                  ) : null}

                  {activeTab === 'chat' ? (
                    <WorkspaceChatTab
                      messages={workspaceSnapshot?.chatMessages ?? []}
                      onCreate={handleCreateMessage}
                      onUpdate={handleUpdateMessage}
                      onDelete={handleDeleteMessage}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  FolderIcon,
  KeyIcon,
  Squares2X2Icon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import DataStatus from '../../../components/DataStatus.jsx';
import { COMPANY_DASHBOARD_MENU_SECTIONS } from '../../../constants/companyDashboardMenu.js';
import { useSession } from '../../../context/SessionContext.jsx';
import useProjectWorkspace from '../../../hooks/useProjectWorkspace.js';
import projectsService from '../../../services/projects.js';
import WorkspaceProjectSelector from '../../../components/workspace/WorkspaceProjectSelector.jsx';
import WorkspaceOverviewSection from '../../../components/workspace/WorkspaceOverviewSection.jsx';
import WorkspaceBudgetManager from '../../../components/workspace/WorkspaceBudgetManager.jsx';
import WorkspaceObjectManager from '../../../components/workspace/WorkspaceObjectManager.jsx';
import WorkspaceTimelineManager from '../../../components/workspace/WorkspaceTimelineManager.jsx';
import WorkspaceMeetingManager from '../../../components/workspace/WorkspaceMeetingManager.jsx';
import WorkspaceRoleManager from '../../../components/workspace/WorkspaceRoleManager.jsx';
import WorkspaceSubmissionManager from '../../../components/workspace/WorkspaceSubmissionManager.jsx';
import WorkspaceInviteManager from '../../../components/workspace/WorkspaceInviteManager.jsx';
import WorkspaceHrManager from '../../../components/workspace/WorkspaceHrManager.jsx';
import WorkspaceFileManager from '../../../components/workspace/WorkspaceFileManager.jsx';
import WorkspaceConversationCenter from '../../../components/workspace/WorkspaceConversationCenter.jsx';
import WorkspaceModuleDialog from '../../../components/workspace/WorkspaceModuleDialog.jsx';

const availableDashboards = ['company', 'headhunter', 'user', 'agency'];
const moduleButtonClasses =
  'group flex flex-col items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-accent hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';

function formatCurrency(value, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: Math.abs(Number(value)) < 1000 ? 2 : 0,
  }).format(Number(value));
}

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Number(value).toFixed(0)}%`;
}

export default function CompanyProjectWorkspacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { session } = useSession();
  const actorId = session?.id ?? session?.user?.id ?? null;

  const projectIdParam = searchParams.get('projectId');
  const moduleParam = searchParams.get('module');
  const projectId = projectIdParam ? Number(projectIdParam) : null;

  const { data, loading, error, refresh, fromCache, lastUpdated } = useProjectWorkspace({ projectId, enabled: Boolean(projectId) });

  useEffect(() => {
    if (!projectId && moduleParam) {
      const next = new URLSearchParams(searchParams);
      next.delete('module');
      setSearchParams(next, { replace: true });
    }
  }, [moduleParam, projectId, searchParams, setSearchParams]);

  const workspaceData = data ?? {};
  const budgets = workspaceData.budgets ?? [];
  const objects = workspaceData.objects ?? [];
  const timeline = workspaceData.timeline ?? [];
  const meetings = workspaceData.meetings ?? [];
  const roles = workspaceData.roles ?? [];
  const submissions = workspaceData.submissions ?? [];
  const invites = workspaceData.invites ?? [];
  const hrRecords = workspaceData.hrRecords ?? [];
  const files = workspaceData.files ?? [];
  const conversations = workspaceData.conversations ?? [];
  const project = workspaceData.project ?? null;
  const brief = workspaceData.brief ?? null;
  const metrics = workspaceData.metrics ?? null;

  const requireProject = useCallback(() => {
    if (!projectId) {
      throw new Error('Select a project first.');
    }
  }, [projectId]);

  const mutationOptions = useMemo(() => ({ actorId }), [actorId]);

  const handleSelectProject = useCallback(
    (selectedProject) => {
      if (!selectedProject?.id) {
        return;
      }
      const next = new URLSearchParams(searchParams);
      next.set('projectId', `${selectedProject.id}`);
      next.delete('module');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleOpenModule = useCallback(
    (moduleId) => {
      if (!projectId) {
        return;
      }
      const next = new URLSearchParams(searchParams);
      next.set('projectId', `${projectId}`);
      next.set('module', moduleId);
      setSearchParams(next, { replace: false });
    },
    [projectId, searchParams, setSearchParams],
  );

  const handleCloseModule = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('module');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleBriefSave = useCallback(
    async (payload) => {
      requireProject();
      await projectsService.updateProjectWorkspaceBrief(projectId, { ...payload, ...mutationOptions });
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const handleBudgetSave = useCallback(
    async (payload) => {
      requireProject();
      if (payload.id) {
        await projectsService.updateProjectWorkspaceBudget(projectId, payload.id, { ...payload, ...mutationOptions });
      } else {
        await projectsService.createProjectWorkspaceBudget(projectId, { ...payload, ...mutationOptions });
      }
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const handleBudgetDelete = useCallback(
    async (entry) => {
      requireProject();
      await projectsService.deleteProjectWorkspaceBudget(projectId, entry.id, mutationOptions);
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const handleObjectSave = useCallback(
    async (payload) => {
      requireProject();
      if (payload.id) {
        await projectsService.updateProjectWorkspaceObject(projectId, payload.id, { ...payload, ...mutationOptions });
      } else {
        await projectsService.createProjectWorkspaceObject(projectId, { ...payload, ...mutationOptions });
      }
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const handleObjectDelete = useCallback(
    async (entry) => {
      requireProject();
      await projectsService.deleteProjectWorkspaceObject(projectId, entry.id, mutationOptions);
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const handleTimelineSave = useCallback(
    async (payload) => {
      requireProject();
      if (payload.id) {
        await projectsService.updateProjectWorkspaceTimelineEntry(projectId, payload.id, { ...payload, ...mutationOptions });
      } else {
        await projectsService.createProjectWorkspaceTimelineEntry(projectId, { ...payload, ...mutationOptions });
      }
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const handleTimelineDelete = useCallback(
    async (entry) => {
      requireProject();
      await projectsService.deleteProjectWorkspaceTimelineEntry(projectId, entry.id, mutationOptions);
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const handleMeetingSave = useCallback(
    async (payload) => {
      requireProject();
      if (payload.id) {
        await projectsService.updateProjectWorkspaceMeeting(projectId, payload.id, { ...payload, ...mutationOptions });
      } else {
        await projectsService.createProjectWorkspaceMeeting(projectId, { ...payload, ...mutationOptions });
      }
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const handleMeetingDelete = useCallback(
    async (entry) => {
      requireProject();
      await projectsService.deleteProjectWorkspaceMeeting(projectId, entry.id, mutationOptions);
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const handleRoleSave = useCallback(
    async (payload) => {
      requireProject();
      if (payload.id) {
        await projectsService.updateProjectWorkspaceRole(projectId, payload.id, { ...payload, ...mutationOptions });
      } else {
        await projectsService.createProjectWorkspaceRole(projectId, { ...payload, ...mutationOptions });
      }
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const handleRoleDelete = useCallback(
    async (entry) => {
      requireProject();
      await projectsService.deleteProjectWorkspaceRole(projectId, entry.id, mutationOptions);
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const handleSubmissionSave = useCallback(
    async (payload) => {
      requireProject();
      if (payload.id) {
        await projectsService.updateProjectWorkspaceSubmission(projectId, payload.id, { ...payload, ...mutationOptions });
      } else {
        await projectsService.createProjectWorkspaceSubmission(projectId, { ...payload, ...mutationOptions });
      }
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const handleSubmissionDelete = useCallback(
    async (entry) => {
      requireProject();
      await projectsService.deleteProjectWorkspaceSubmission(projectId, entry.id, mutationOptions);
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const handleInviteSave = useCallback(
    async (payload) => {
      requireProject();
      if (payload.id) {
        await projectsService.updateProjectWorkspaceInvite(projectId, payload.id, { ...payload, ...mutationOptions });
      } else {
        await projectsService.createProjectWorkspaceInvite(projectId, { ...payload, ...mutationOptions });
      }
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const handleInviteDelete = useCallback(
    async (entry) => {
      requireProject();
      await projectsService.deleteProjectWorkspaceInvite(projectId, entry.id, mutationOptions);
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const handleHrSave = useCallback(
    async (payload) => {
      requireProject();
      if (payload.id) {
        await projectsService.updateProjectWorkspaceHrRecord(projectId, payload.id, { ...payload, ...mutationOptions });
      } else {
        await projectsService.createProjectWorkspaceHrRecord(projectId, { ...payload, ...mutationOptions });
      }
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const handleHrDelete = useCallback(
    async (entry) => {
      requireProject();
      await projectsService.deleteProjectWorkspaceHrRecord(projectId, entry.id, mutationOptions);
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const handleFileSave = useCallback(
    async (payload) => {
      requireProject();
      if (payload.id) {
        await projectsService.updateProjectWorkspaceFile(projectId, payload.id, { ...payload, ...mutationOptions });
      } else {
        await projectsService.createProjectWorkspaceFile(projectId, { ...payload, ...mutationOptions });
      }
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const handleFileDelete = useCallback(
    async (entry) => {
      requireProject();
      await projectsService.deleteProjectWorkspaceFile(projectId, entry.id, mutationOptions);
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const handleConversationAck = useCallback(
    async (conversationId) => {
      requireProject();
      await projectsService.acknowledgeProjectWorkspaceConversation(projectId, conversationId, mutationOptions);
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const handleConversationMessage = useCallback(
    async (conversationId, payload) => {
      requireProject();
      await projectsService.createProjectWorkspaceConversationMessage(projectId, conversationId, {
        ...payload,
        ...mutationOptions,
      });
      await refresh({ force: true });
    },
    [projectId, mutationOptions, refresh, requireProject],
  );

  const moduleList = useMemo(() => {
    if (!projectId) {
      return [];
    }

    return [
      {
        id: 'overview',
        name: 'Overview',
        icon: Squares2X2Icon,
        render: () => (
          <WorkspaceOverviewSection
            project={project}
            brief={brief}
            metrics={metrics}
            onSaveBrief={handleBriefSave}
            saving={loading}
            onRefresh={() => refresh({ force: true })}
          />
        ),
      },
      {
        id: 'budget',
        name: 'Budget',
        icon: CurrencyDollarIcon,
        render: () => (
          <WorkspaceBudgetManager
            budgets={budgets}
            onSave={handleBudgetSave}
            onDelete={handleBudgetDelete}
            currency={project?.budgetCurrency ?? 'USD'}
          />
        ),
      },
      {
        id: 'tasks',
        name: 'Tasks',
        icon: ClipboardDocumentListIcon,
        render: () => (
          <WorkspaceObjectManager objects={objects} onSave={handleObjectSave} onDelete={handleObjectDelete} />
        ),
      },
      {
        id: 'timeline',
        name: 'Timeline',
        icon: CalendarDaysIcon,
        render: () => (
          <WorkspaceTimelineManager
            timeline={timeline}
            objects={objects}
            onSave={handleTimelineSave}
            onDelete={handleTimelineDelete}
          />
        ),
      },
      {
        id: 'meetings',
        name: 'Meetings',
        icon: UsersIcon,
        render: () => <WorkspaceMeetingManager meetings={meetings} onSave={handleMeetingSave} onDelete={handleMeetingDelete} />,
      },
      {
        id: 'roles',
        name: 'Roles',
        icon: KeyIcon,
        render: () => <WorkspaceRoleManager roles={roles} onSave={handleRoleSave} onDelete={handleRoleDelete} />,
      },
      {
        id: 'submit',
        name: 'Submit',
        icon: ArrowTrendingUpIcon,
        render: () => (
          <WorkspaceSubmissionManager
            submissions={submissions}
            onSave={handleSubmissionSave}
            onDelete={handleSubmissionDelete}
          />
        ),
      },
      {
        id: 'files',
        name: 'Files',
        icon: FolderIcon,
        render: () => <WorkspaceFileManager files={files} onSave={handleFileSave} onDelete={handleFileDelete} />,
      },
      {
        id: 'invites',
        name: 'Invites',
        icon: EnvelopeIcon,
        render: () => <WorkspaceInviteManager invites={invites} onSave={handleInviteSave} onDelete={handleInviteDelete} />,
      },
      {
        id: 'people',
        name: 'People',
        icon: UserGroupIcon,
        render: () => <WorkspaceHrManager records={hrRecords} onSave={handleHrSave} onDelete={handleHrDelete} />,
      },
      {
        id: 'chat',
        name: 'Chat',
        icon: ChatBubbleLeftRightIcon,
        render: () => (
          <WorkspaceConversationCenter
            conversations={conversations}
            onAcknowledge={handleConversationAck}
            onSendMessage={handleConversationMessage}
            loading={loading}
          />
        ),
      },
    ];
  }, [
    projectId,
    project,
    brief,
    metrics,
    handleBriefSave,
    loading,
    refresh,
    budgets,
    handleBudgetSave,
    handleBudgetDelete,
    objects,
    handleObjectSave,
    handleObjectDelete,
    timeline,
    handleTimelineSave,
    handleTimelineDelete,
    meetings,
    handleMeetingSave,
    handleMeetingDelete,
    roles,
    handleRoleSave,
    handleRoleDelete,
    submissions,
    handleSubmissionSave,
    handleSubmissionDelete,
    files,
    handleFileSave,
    handleFileDelete,
    invites,
    handleInviteSave,
    handleInviteDelete,
    hrRecords,
    handleHrSave,
    handleHrDelete,
    conversations,
    handleConversationAck,
    handleConversationMessage,
  ]);

  const moduleLookup = useMemo(() => {
    const map = new Map();
    moduleList.forEach((module) => {
      map.set(module.id, module);
    });
    return map;
  }, [moduleList]);

  const activeModule = moduleParam ? moduleLookup.get(moduleParam) : null;

  const summary = useMemo(() => {
    if (!projectId || !project) {
      return [];
    }
    const items = [];
    if (project.status) {
      items.push({ label: 'Status', value: project.status });
    }
    if (metrics?.progressPercent != null) {
      items.push({ label: 'Progress', value: formatPercent(metrics.progressPercent) });
    }
    if (metrics?.budgetUsed != null) {
      items.push({ label: 'Spent', value: formatCurrency(metrics.budgetUsed, project?.budgetCurrency ?? 'USD') });
    }
    if (metrics?.budgetRemaining != null) {
      items.push({ label: 'Balance', value: formatCurrency(metrics.budgetRemaining, project?.budgetCurrency ?? 'USD') });
    }
    if (project.startDate) {
      const date = new Date(project.startDate);
      if (!Number.isNaN(date.getTime())) {
        items.push({ label: 'Start', value: date.toLocaleDateString() });
      }
    }
    if (project.endDate) {
      const date = new Date(project.endDate);
      if (!Number.isNaN(date.getTime())) {
        items.push({ label: 'End', value: date.toLocaleDateString() });
      }
    }
    return items;
  }, [metrics, project, projectId]);

  return (
    <DashboardLayout
      currentDashboard="company"
      title="Project workspace"
      subtitle={project ? project.title ?? 'Selected project' : 'Select a project to begin'}
      menuSections={COMPANY_DASHBOARD_MENU_SECTIONS}
      availableDashboards={availableDashboards}
      activeMenuItem="project-workspace"
      sections={[]}
    >
      <div className="space-y-6">
        <WorkspaceProjectSelector value={project} onSelect={handleSelectProject} loading={loading} />

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <DataStatus
            loading={loading}
            error={error}
            fromCache={fromCache}
            lastUpdated={lastUpdated}
            onRefresh={() => refresh({ force: true })}
          />
          {error ? <p className="mt-3 text-sm text-rose-600">{error.message || 'Unable to load workspace.'}</p> : null}
          {!projectId ? <p className="mt-3 text-sm text-slate-600">Pick a project above to open its workspace.</p> : null}
        </div>

        {projectId && project ? (
          <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
            {summary.map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
            {!summary.length ? (
              <p className="col-span-full text-center text-sm text-slate-500">This project has no summary metrics yet.</p>
            ) : null}
          </div>
        ) : null}

        {projectId ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {moduleList.map((module) => {
              const Icon = module.icon;
              return (
                <button key={module.id} type="button" className={moduleButtonClasses} onClick={() => handleOpenModule(module.id)}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="text-base font-semibold text-slate-900">{module.name}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {activeModule ? (
        <WorkspaceModuleDialog open onClose={handleCloseModule} title={activeModule.name}>
          {activeModule.render()}
        </WorkspaceModuleDialog>
      ) : null}
    </DashboardLayout>
  );
}

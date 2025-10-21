import { Fragment, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import ProjectOperationsSection from '../../../../../components/projects/ProjectOperationsSection.jsx';
import useProjectOperationsManager from '../../../../../hooks/useProjectOperationsManager.js';
import projectsService from '../../../../../services/projects.js';
import WorkspaceHeader from './WorkspaceHeader.jsx';
import OverviewTab from './OverviewTab.jsx';
import BudgetsTab from './BudgetsTab.jsx';
import DeliverablesPanel from './DeliverablesPanel.jsx';
import TimelineEventsTab from './TimelineEventsTab.jsx';
import MeetingsCalendarTab from './MeetingsCalendarTab.jsx';
import RolesTab from './RolesTab.jsx';
import BriefTab from './BriefTab.jsx';
import FilesTab from './FilesTab.jsx';
import InvitesTab from './InvitesTab.jsx';
import TeamTab from './TeamTab.jsx';
import TimeLogsTab from './TimeLogsTab.jsx';
import TargetsObjectivesTab from './TargetsObjectivesTab.jsx';
import ChatTab from './ChatTab.jsx';

const LOCAL_STORAGE_KEY = 'gigvora:web:freelancer:lastProjectWorkspaceId';
const DEFAULT_PERMISSION_MESSAGE =
  'Your current workspace role does not allow managing this area. Contact the project owner to request elevated permissions.';

function readStoredProjectId() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage.getItem(LOCAL_STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to read stored project id', error);
    return null;
  }
}

function persistProjectId(projectId) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    if (!projectId) {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(LOCAL_STORAGE_KEY, projectId);
  } catch (error) {
    console.warn('Unable to persist project id', error);
  }
}

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', description: 'Status, metrics, and delivery dates.' },
  { id: 'brief', label: 'Brief', description: 'Update the project summary and goals.' },
  { id: 'board', label: 'Board', description: 'Manage tasks, gantt, and delegation.' },
  { id: 'budget', label: 'Budget', description: 'Track planned and actual spend.' },
  { id: 'assets', label: 'Assets', description: 'Organise objects and submissions.' },
  { id: 'timeline', label: 'Timeline', description: 'Plot milestones and events.' },
  { id: 'schedule', label: 'Schedule', description: 'Coordinate meetings and calendar.' },
  { id: 'roles', label: 'Roles', description: 'Control access within the workspace.' },
  { id: 'invites', label: 'Invites', description: 'Bring collaborators into the room.' },
  { id: 'team', label: 'Team', description: 'Maintain roster and HR records.' },
  { id: 'hours', label: 'Hours', description: 'Log and review billable time.' },
  { id: 'goals', label: 'Goals', description: 'Track targets and objectives.' },
  { id: 'files', label: 'Files', description: 'Store project files securely.' },
  { id: 'chat', label: 'Chat', description: 'Keep the conversation in one place.' },
];

export function resolveAccessControl(accessControl, { fallback = true, defaultReason = DEFAULT_PERMISSION_MESSAGE } = {}) {
  if (accessControl == null) {
    return { allowed: fallback, reason: fallback ? null : defaultReason };
  }
  if (typeof accessControl === 'boolean') {
    return { allowed: accessControl, reason: accessControl ? null : defaultReason };
  }
  if (typeof accessControl === 'string') {
    const normalized = accessControl.trim().toLowerCase();
    if (['manage', 'write', 'edit', 'owner', 'admin', 'full'].includes(normalized)) {
      return { allowed: true, reason: null };
    }
    if (['deny', 'denied', 'forbidden', 'read', 'view', 'readonly', 'read-only', 'none', 'blocked'].includes(normalized)) {
      return { allowed: false, reason: defaultReason };
    }
    return { allowed: fallback, reason: fallback ? null : defaultReason };
  }
  if (Array.isArray(accessControl)) {
    const normalized = accessControl.map((value) => String(value).trim().toLowerCase());
    const hasManage = normalized.some((value) => ['manage', 'write', 'edit', 'owner', 'admin'].includes(value));
    const hasDeny = normalized.some((value) =>
      ['deny', 'denied', 'forbidden', 'blocked', 'readonly', 'read-only', 'view', 'read', 'none'].includes(value),
    );
    if (hasManage) {
      return { allowed: true, reason: null };
    }
    if (hasDeny) {
      return { allowed: false, reason: defaultReason };
    }
    return { allowed: fallback, reason: fallback ? null : defaultReason };
  }
  if (typeof accessControl === 'object') {
    if ('canManage' in accessControl) {
      const allowed = accessControl.canManage !== false;
      return { allowed, reason: allowed ? null : accessControl.reason ?? accessControl.message ?? defaultReason };
    }
    if ('write' in accessControl) {
      const allowed = accessControl.write !== false;
      return { allowed, reason: allowed ? null : accessControl.reason ?? defaultReason };
    }
    if ('mode' in accessControl) {
      const mode = String(accessControl.mode).trim().toLowerCase();
      const allowed = !['read', 'view', 'readonly', 'read-only', 'none'].includes(mode);
      return { allowed, reason: allowed ? null : accessControl.reason ?? defaultReason };
    }
    if ('level' in accessControl) {
      const level = String(accessControl.level).trim().toLowerCase();
      const allowed = ['manage', 'write', 'edit', 'owner', 'admin', 'full'].includes(level);
      return { allowed, reason: allowed ? null : accessControl.reason ?? defaultReason };
    }
    if ('permissions' in accessControl && Array.isArray(accessControl.permissions)) {
      return resolveAccessControl(accessControl.permissions, { fallback, defaultReason });
    }
    if ('grants' in accessControl && Array.isArray(accessControl.grants)) {
      return resolveAccessControl(accessControl.grants, { fallback, defaultReason });
    }
    const values = Object.values(accessControl);
    if (values.some((value) => value === false)) {
      return { allowed: false, reason: defaultReason };
    }
    if (values.some((value) => value === true)) {
      return { allowed: true, reason: null };
    }
  }
  return { allowed: fallback, reason: fallback ? null : defaultReason };
}

function AccessNotice({ message }) {
  if (!message) {
    return null;
  }
  return (
    <div
      className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 shadow-sm"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}

AccessNotice.propTypes = {
  message: PropTypes.string,
};

const PERMISSION_MESSAGES = {
  overview: 'Only workspace owners can adjust the delivery timeline.',
  brief: 'Only project owners can update the workspace brief.',
  budgets: 'Only finance or project leads can manage budget lines.',
  objects: 'Only delivery leads can manage workspace objects and submissions.',
  timeline: 'Only project leads can maintain the delivery timeline.',
  schedule: 'Only project coordinators can manage meetings and calendar entries.',
  roles: 'Only workspace owners can modify project roles.',
  invites: 'Only workspace owners can send or revoke workspace invites.',
  team: 'Only HR managers can update roster records.',
  hours: 'Only project managers can edit time logs.',
  goals: 'Only strategy owners can adjust targets and objectives.',
  files: 'Only workspace owners can manage workspace files.',
  chat: 'Only approved collaborators can post workspace chat updates.',
};

export default function ProjectWorkspaceModule({ defaultProjectId }) {
  const [projectId, setProjectId] = useState(defaultProjectId ?? null);
  const [projectIdInput, setProjectIdInput] = useState(defaultProjectId ?? '');
  const [activeView, setActiveView] = useState('home');
  const [projectError, setProjectError] = useState(null);

  useEffect(() => {
    if (defaultProjectId) {
      return;
    }
    const stored = readStoredProjectId();
    if (stored) {
      setProjectId(stored);
      setProjectIdInput(stored);
    }
  }, [defaultProjectId]);

  useEffect(() => {
    if (projectId) {
      persistProjectId(projectId);
    }
  }, [projectId]);

  const operationsState = useProjectOperationsManager({ projectId, enabled: Boolean(projectId) });
  const {
    data: operations,
    loading,
    error,
    refresh,
    fromCache,
    lastUpdated,
    createBudget,
    updateBudget,
    deleteBudget,
    createObject,
    updateObject,
    deleteObject,
    createTimelineEvent,
    updateTimelineEvent,
    deleteTimelineEvent,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    createCalendarEntry,
    updateCalendarEntry,
    deleteCalendarEntry,
    createRole,
    updateRole,
    deleteRole,
    createSubmission,
    updateSubmission,
    deleteSubmission,
    createInvite,
    updateInvite,
    deleteInvite,
    createHrRecord,
    updateHrRecord,
    deleteHrRecord,
    createTimeLog,
    updateTimeLog,
    deleteTimeLog,
    createTarget,
    updateTarget,
    deleteTarget,
    createObjective,
    updateObjective,
    deleteObjective,
    postConversationMessage,
    createFile,
    updateFile,
    deleteFile,
    updateOperations,
  } = operationsState;

  const manager = useMemo(
    () => ({
      createBudget,
      updateBudget,
      deleteBudget,
      createObject,
      updateObject,
      deleteObject,
      createTimelineEvent,
      updateTimelineEvent,
      deleteTimelineEvent,
      createMeeting,
      updateMeeting,
      deleteMeeting,
      createCalendarEntry,
      updateCalendarEntry,
      deleteCalendarEntry,
      createRole,
      updateRole,
      deleteRole,
      createSubmission,
      updateSubmission,
      deleteSubmission,
      createInvite,
      updateInvite,
      deleteInvite,
      createHrRecord,
      updateHrRecord,
      deleteHrRecord,
      createTimeLog,
      updateTimeLog,
      deleteTimeLog,
      createTarget,
      updateTarget,
      deleteTarget,
      createObjective,
      updateObjective,
      deleteObjective,
      postConversationMessage,
      createFile,
      updateFile,
      deleteFile,
      updateOperations,
    }),
    [
      createBudget,
      updateBudget,
      deleteBudget,
      createObject,
      updateObject,
      deleteObject,
      createTimelineEvent,
      updateTimelineEvent,
      deleteTimelineEvent,
      createMeeting,
      updateMeeting,
      deleteMeeting,
      createCalendarEntry,
      updateCalendarEntry,
      deleteCalendarEntry,
      createRole,
      updateRole,
      deleteRole,
      createSubmission,
      updateSubmission,
      deleteSubmission,
      createInvite,
      updateInvite,
      deleteInvite,
      createHrRecord,
      updateHrRecord,
      deleteHrRecord,
      createTimeLog,
      updateTimeLog,
      deleteTimeLog,
      createTarget,
      updateTarget,
      deleteTarget,
      createObjective,
      updateObjective,
      deleteObjective,
      postConversationMessage,
      createFile,
      updateFile,
      deleteFile,
      updateOperations,
    ],
  );

  const accessControls = useMemo(() => {
    const raw = operations?.permissions ?? {};
    return {
      overview: resolveAccessControl(raw.overview ?? raw.timeline ?? raw.metrics, {
        defaultReason: PERMISSION_MESSAGES.overview,
      }),
      brief: resolveAccessControl(raw.brief ?? raw.overview, {
        defaultReason: PERMISSION_MESSAGES.brief,
      }),
      budgets: resolveAccessControl(raw.budgets ?? raw.finance, {
        defaultReason: PERMISSION_MESSAGES.budgets,
      }),
      objects: resolveAccessControl(raw.objects ?? raw.assets, {
        defaultReason: PERMISSION_MESSAGES.objects,
      }),
      timeline: resolveAccessControl(raw.timeline, {
        defaultReason: PERMISSION_MESSAGES.timeline,
      }),
      schedule: resolveAccessControl(raw.schedule ?? raw.calendar, {
        defaultReason: PERMISSION_MESSAGES.schedule,
      }),
      roles: resolveAccessControl(raw.roles ?? raw.access, {
        defaultReason: PERMISSION_MESSAGES.roles,
      }),
      invites: resolveAccessControl(raw.invites ?? raw.access, {
        defaultReason: PERMISSION_MESSAGES.invites,
      }),
      team: resolveAccessControl(raw.team ?? raw.hr, {
        defaultReason: PERMISSION_MESSAGES.team,
      }),
      hours: resolveAccessControl(raw.hours ?? raw.timesheets, {
        defaultReason: PERMISSION_MESSAGES.hours,
      }),
      goals: resolveAccessControl(raw.goals ?? raw.targets, {
        defaultReason: PERMISSION_MESSAGES.goals,
      }),
      files: resolveAccessControl(raw.files ?? raw.storage, {
        defaultReason: PERMISSION_MESSAGES.files,
      }),
      chat: resolveAccessControl(raw.chat ?? raw.conversations, {
        defaultReason: PERMISSION_MESSAGES.chat,
      }),
    };
  }, [operations?.permissions]);

  const permissionState = useMemo(() => {
    return Object.keys(PERMISSION_MESSAGES).reduce((accumulator, key) => {
      const access = accessControls[key] ?? { allowed: true, reason: null };
      const allowed = access.allowed !== false;
      accumulator[key] = {
        allowed,
        disabled: !projectId || !allowed,
        reason: !projectId ? null : access.reason ?? null,
      };
      return accumulator;
    }, {});
  }, [accessControls, projectId]);

  const handleLoadProject = async () => {
    if (!projectIdInput) {
      setProjectError('Enter a project ID to load the workspace.');
      return;
    }
    const trimmed = projectIdInput.trim();
    setProjectId(trimmed || null);
    setProjectError(null);
    setActiveView('home');
  };

  const handleCreateProject = async (payload) => {
    const response = await projectsService.createProject({
      title: payload.title,
      description: payload.description,
      status: payload.status,
    });
    const createdProject = response?.project ?? response;
    const newId = createdProject?.id ?? response?.id;
    if (!newId) {
      throw new Error('Project creation failed.');
    }
    const stringId = String(newId);
    setProjectId(stringId);
    setProjectIdInput(stringId);
    setActiveView('home');
    return response;
  };

  const handleRefresh = () => {
    if (projectId) {
      refresh({ force: true });
    }
  };

  const handleBriefSave = async (payload) => {
    if (!projectId) {
      throw new Error('Load a project before updating the brief.');
    }
    await projectsService.updateProjectWorkspaceBrief(projectId, payload);
    await refresh({ force: true });
  };

  const timelineUpdater = (payload) => manager.updateOperations(payload);

  const renderView = () => {
    if (activeView === 'home') {
      return null;
    }
    if (!projectId) {
      return <LoadProjectNotice />;
    }

    const fallbackGuard = { disabled: !projectId, reason: null };

    switch (activeView) {
      case 'overview': {
        const guard = permissionState.overview ?? fallbackGuard;
        return (
          <>
            {guard.reason ? <AccessNotice message={guard.reason} /> : null}
            <OverviewTab
              operations={operations}
              onUpdateTimeline={timelineUpdater}
              disabled={guard.disabled}
              readOnlyReason={guard.reason}
            />
          </>
        );
      }
      case 'brief': {
        const guard = permissionState.brief ?? fallbackGuard;
        return (
          <>
            {guard.reason ? <AccessNotice message={guard.reason} /> : null}
            <BriefTab brief={operations?.brief} disabled={guard.disabled} onSave={handleBriefSave} />
          </>
        );
      }
      case 'board':
        return (
          <div className="rounded-4xl border border-slate-200 bg-white p-4 shadow-sm">
            <ProjectOperationsSection projectId={projectId} />
          </div>
        );
      case 'budget': {
        const guard = permissionState.budgets ?? fallbackGuard;
        return (
          <>
            {guard.reason ? <AccessNotice message={guard.reason} /> : null}
            <BudgetsTab budgets={operations?.budgets} manager={manager} disabled={guard.disabled} loading={loading} />
          </>
        );
      }
      case 'assets': {
        const guard = permissionState.objects ?? fallbackGuard;
        return (
          <>
            {guard.reason ? <AccessNotice message={guard.reason} /> : null}
            <DeliverablesPanel
              objects={operations?.objects}
              submissions={operations?.submissions}
              manager={manager}
              disabled={guard.disabled}
              loading={loading}
              readOnlyReason={guard.reason}
            />
          </>
        );
      }
      case 'timeline': {
        const guard = permissionState.timeline ?? fallbackGuard;
        return (
          <>
            {guard.reason ? <AccessNotice message={guard.reason} /> : null}
            <TimelineEventsTab
              timelineEvents={operations?.timelineEvents}
              manager={manager}
              disabled={guard.disabled}
              readOnlyReason={guard.reason}
              loading={loading}
            />
          </>
        );
      }
      case 'schedule': {
        const guard = permissionState.schedule ?? fallbackGuard;
        return (
          <>
            {guard.reason ? <AccessNotice message={guard.reason} /> : null}
            <MeetingsCalendarTab
              meetings={operations?.meetings}
              calendarEntries={operations?.calendarEntries}
              manager={manager}
              disabled={guard.disabled}
              readOnlyReason={guard.reason}
              loading={loading}
            />
          </>
        );
      }
      case 'roles': {
        const guard = permissionState.roles ?? fallbackGuard;
        return (
          <>
            {guard.reason ? <AccessNotice message={guard.reason} /> : null}
            <RolesTab
              roles={operations?.roles}
              manager={manager}
              disabled={guard.disabled}
              readOnlyReason={guard.reason}
              loading={loading}
            />
          </>
        );
      }
      case 'invites': {
        const guard = permissionState.invites ?? fallbackGuard;
        return (
          <>
            {guard.reason ? <AccessNotice message={guard.reason} /> : null}
            <InvitesTab
              invites={operations?.invites}
              manager={manager}
              disabled={guard.disabled}
              readOnlyReason={guard.reason}
              loading={loading}
            />
          </>
        );
      }
      case 'team': {
        const guard = permissionState.team ?? fallbackGuard;
        return (
          <>
            {guard.reason ? <AccessNotice message={guard.reason} /> : null}
            <TeamTab
              records={operations?.hrRecords}
              manager={manager}
              disabled={guard.disabled}
              readOnlyReason={guard.reason}
              loading={loading}
            />
          </>
        );
      }
      case 'hours': {
        const guard = permissionState.hours ?? fallbackGuard;
        return (
          <>
            {guard.reason ? <AccessNotice message={guard.reason} /> : null}
            <TimeLogsTab
              entries={operations?.timeLogs}
              manager={manager}
              disabled={guard.disabled}
              readOnlyReason={guard.reason}
              loading={loading}
            />
          </>
        );
      }
      case 'goals': {
        const guard = permissionState.goals ?? fallbackGuard;
        return (
          <>
            {guard.reason ? <AccessNotice message={guard.reason} /> : null}
            <TargetsObjectivesTab
              targets={operations?.targets}
              objectives={operations?.objectives}
              manager={manager}
              disabled={guard.disabled}
              readOnlyReason={guard.reason}
              loading={loading}
            />
          </>
        );
      }
      case 'files': {
        const guard = permissionState.files ?? fallbackGuard;
        return (
          <>
            {guard.reason ? <AccessNotice message={guard.reason} /> : null}
            <FilesTab
              files={operations?.files}
              manager={manager}
              disabled={guard.disabled}
              readOnlyReason={guard.reason}
              loading={loading}
            />
          </>
        );
      }
      case 'chat': {
        const guard = permissionState.chat ?? fallbackGuard;
        return (
          <>
            {guard.reason ? <AccessNotice message={guard.reason} /> : null}
            <ChatTab
              conversations={operations?.conversations}
              manager={manager}
              disabled={guard.disabled}
              loading={loading}
              readOnlyReason={guard.reason}
            />
          </>
        );
      }
      default:
        return null;
    }
  };

  const viewContent = renderView();

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        projectIdInput={projectIdInput}
        onProjectIdChange={setProjectIdInput}
        onLoadProject={handleLoadProject}
        onRefresh={handleRefresh}
        loading={loading}
        hasProject={Boolean(projectId)}
        project={operations?.project}
        fromCache={fromCache}
        lastUpdated={lastUpdated}
        onCreateProject={handleCreateProject}
      />

      {projectError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
          {projectError}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
          {error.message || 'Unable to load project workspace operations.'}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <WorkspaceSectionNav
          items={NAV_ITEMS}
          activeId={activeView}
          onSelect={setActiveView}
          disabled={!projectId}
        />
        <div className="space-y-6">
          {activeView === 'home' ? (
            <WorkspaceLanding
              project={operations?.project}
              metrics={operations?.metrics}
              navItems={NAV_ITEMS}
              onSelect={(view) => setActiveView(view)}
              disabled={!projectId}
            />
          ) : (
            viewContent ?? <WorkspaceLanding project={operations?.project} metrics={operations?.metrics} navItems={NAV_ITEMS} onSelect={(view) => setActiveView(view)} disabled={!projectId} />
          )}
        </div>
      </div>
    </div>
  );
}

ProjectWorkspaceModule.propTypes = {
  defaultProjectId: PropTypes.string,
};

function LoadProjectNotice() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
      Load a project to unlock this workspace view.
    </div>
  );
}

function WorkspaceLanding({ project, metrics, navItems, onSelect, disabled }) {
  const cards = useMemo(() => {
    if (!metrics) {
      return [];
    }
    return [
      { id: 'budget', label: 'Planned budget', value: metrics.plannedBudgetCents ?? 0, type: 'currency', currency: metrics.currency ?? 'USD' },
      { id: 'actual', label: 'Actual spend', value: metrics.actualBudgetCents ?? 0, type: 'currency', currency: metrics.currency ?? 'USD' },
      { id: 'open', label: 'Open tasks', value: metrics.openTasks ?? 0, type: 'number' },
      { id: 'upcoming-events', label: 'Upcoming events', value: metrics.upcomingTimelineEvents ?? 0, type: 'number' },
    ];
  }, [metrics]);

  const formatValue = (card) => {
    if (card.type === 'currency') {
      const amount = Number(card.value || 0) / 100;
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: card.currency || 'USD',
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat().format(card.value || 0);
  };

  return (
    <div className="space-y-6">
      {project ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Active project</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{project.title}</h3>
          {project.description ? <p className="mt-1 text-sm text-slate-600">{project.description}</p> : null}
        </div>
      ) : null}

      {cards.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{formatValue(card)}</p>
            </div>
          ))}
        </div>
      ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
                disabled ? 'opacity-60' : ''
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">{item.label}</p>
              <p className="mt-2 text-xs text-slate-500">{item.description}</p>
            </button>
          ))}
        </div>
    </div>
  );
}

WorkspaceLanding.propTypes = {
  project: PropTypes.object,
  metrics: PropTypes.object,
  navItems: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

function WorkspaceSectionNav({ items, activeId, onSelect, disabled }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSelect = (value) => {
    onSelect(value);
    setDrawerOpen(false);
  };

  const buttonClasses = (id) => {
    const active = activeId === id;
    const muted = disabled && id !== 'home';
    return `w-full rounded-2xl px-4 py-2 text-left text-sm font-semibold transition ${
      active
        ? 'bg-blue-600 text-white shadow-sm'
        : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600'
    } ${muted ? 'opacity-60' : ''}`;
  };

  return (
    <div className="space-y-3">
      <div className="hidden lg:flex lg:flex-col lg:gap-2">
        <button type="button" onClick={() => handleSelect('home')} className={buttonClasses('home')}>
          Home
        </button>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelect(item.id)}
            className={buttonClasses(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
        >
          <Bars3Icon className="h-5 w-5" /> Menu
        </button>

        <Transition.Root show={drawerOpen} as={Fragment}>
          <Dialog as="div" className="relative z-40" onClose={setDrawerOpen}>
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

            <div className="fixed inset-y-0 right-0 flex w-full max-w-xs">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="ease-in duration-150"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="flex w-full flex-col bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <Dialog.Title className="text-sm font-semibold text-slate-900">Workspace</Dialog.Title>
                    <button
                      type="button"
                      onClick={() => setDrawerOpen(false)}
                      className="rounded-full border border-slate-200 p-1 text-slate-500"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto p-4">
                    <button type="button" onClick={() => handleSelect('home')} className={buttonClasses('home')}>
                      Home
                    </button>
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelect(item.id)}
                        className={buttonClasses(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>
      </div>
    </div>
  );
}

WorkspaceSectionNav.propTypes = {
  items: PropTypes.array.isRequired,
  activeId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

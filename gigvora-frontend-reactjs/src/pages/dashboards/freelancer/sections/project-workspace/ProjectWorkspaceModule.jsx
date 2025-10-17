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

    switch (activeView) {
      case 'overview':
        return <OverviewTab operations={operations} onUpdateTimeline={timelineUpdater} disabled={!projectId} />;
      case 'brief':
        return <BriefTab brief={operations?.brief} disabled={!projectId} onSave={handleBriefSave} />;
      case 'board':
        return (
          <div className="rounded-4xl border border-slate-200 bg-white p-4 shadow-sm">
            <ProjectOperationsSection projectId={projectId} />
          </div>
        );
      case 'budget':
        return <BudgetsTab budgets={operations?.budgets} manager={manager} disabled={!projectId} />;
      case 'assets':
        return (
          <DeliverablesPanel
            objects={operations?.objects}
            submissions={operations?.submissions}
            manager={manager}
            disabled={!projectId}
          />
        );
      case 'timeline':
        return <TimelineEventsTab timelineEvents={operations?.timelineEvents} manager={manager} disabled={!projectId} />;
      case 'schedule':
        return (
          <MeetingsCalendarTab
            meetings={operations?.meetings}
            calendarEntries={operations?.calendarEntries}
            manager={manager}
            disabled={!projectId}
          />
        );
      case 'roles':
        return <RolesTab roles={operations?.roles} manager={manager} disabled={!projectId} />;
      case 'invites':
        return <InvitesTab invites={operations?.invites} manager={manager} disabled={!projectId} />;
      case 'team':
        return <TeamTab records={operations?.hrRecords} manager={manager} disabled={!projectId} />;
      case 'hours':
        return <TimeLogsTab entries={operations?.timeLogs} manager={manager} disabled={!projectId} />;
      case 'goals':
        return (
          <TargetsObjectivesTab
            targets={operations?.targets}
            objectives={operations?.objectives}
            manager={manager}
            disabled={!projectId}
          />
        );
      case 'files':
        return <FilesTab files={operations?.files} manager={manager} disabled={!projectId} />;
      case 'chat':
        return <ChatTab conversations={operations?.conversations} manager={manager} disabled={!projectId} />;
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

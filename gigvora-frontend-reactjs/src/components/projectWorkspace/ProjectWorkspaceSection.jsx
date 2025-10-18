import PropTypes from 'prop-types';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import classNames from '../../utils/classNames.js';
import WorkspaceOverviewTab from './tabs/WorkspaceOverviewTab.jsx';
import BudgetManagementTab from './tabs/BudgetManagementTab.jsx';
import DeliverablesTab from './tabs/DeliverablesTab.jsx';
import ProjectChatTab from './tabs/ProjectChatTab.jsx';
import ProjectTasksTab from './tabs/ProjectTasksTab.jsx';
import TaskBoardTab from './tabs/TaskBoardTab.jsx';
import GanttChartTab from './tabs/GanttChartTab.jsx';
import TaskDelegationTab from './tabs/TaskDelegationTab.jsx';
import TimelineTab from './tabs/TimelineTab.jsx';
import MeetingsTab from './tabs/MeetingsTab.jsx';
import CalendarTab from './tabs/CalendarTab.jsx';
import RolesManagementTab from './tabs/RolesManagementTab.jsx';
import ProjectDescriptionTab from './tabs/ProjectDescriptionTab.jsx';
import SubmissionsTab from './tabs/SubmissionsTab.jsx';
import FileManagerTab from './tabs/FileManagerTab.jsx';
import InvitationsTab from './tabs/InvitationsTab.jsx';
import HrManagementTab from './tabs/HrManagementTab.jsx';

const NAV_SECTIONS = [
  {
    id: 'plan',
    label: 'Plan',
    items: [
      { id: 'workspace', label: 'Home' },
      { id: 'budget', label: 'Budget' },
      { id: 'description', label: 'Brief' },
      { id: 'timeline', label: 'Timeline' },
      { id: 'gantt', label: 'Gantt' },
    ],
  },
  {
    id: 'work',
    label: 'Work',
    items: [
      { id: 'tasks', label: 'Tasks' },
      { id: 'task-board', label: 'Board' },
      { id: 'delegation', label: 'Assign' },
      { id: 'objects', label: 'Assets' },
      { id: 'chat', label: 'Chat' },
    ],
  },
  {
    id: 'sync',
    label: 'Sync',
    items: [
      { id: 'meetings', label: 'Meet' },
      { id: 'calendar', label: 'Calendar' },
      { id: 'submissions', label: 'Reviews' },
      { id: 'files', label: 'Files' },
      { id: 'invitations', label: 'Invite' },
    ],
  },
  {
    id: 'people',
    label: 'People',
    items: [
      { id: 'roles', label: 'Roles' },
      { id: 'hr', label: 'People' },
    ],
  },
];

function renderTab({ id, project, actions, canManage }) {
  switch (id) {
    case 'workspace':
      return <WorkspaceOverviewTab project={project} actions={actions} canManage={canManage} />;
    case 'budget':
      return <BudgetManagementTab project={project} actions={actions} canManage={canManage} />;
    case 'objects':
      return <DeliverablesTab project={project} actions={actions} canManage={canManage} />;
    case 'chat':
      return <ProjectChatTab project={project} actions={actions} canManage={canManage} />;
    case 'tasks':
      return <ProjectTasksTab project={project} actions={actions} canManage={canManage} />;
    case 'task-board':
      return <TaskBoardTab project={project} actions={actions} canManage={canManage} />;
    case 'gantt':
      return <GanttChartTab project={project} actions={actions} canManage={canManage} />;
    case 'delegation':
      return <TaskDelegationTab project={project} actions={actions} canManage={canManage} />;
    case 'timeline':
      return <TimelineTab project={project} actions={actions} canManage={canManage} />;
    case 'meetings':
      return <MeetingsTab project={project} actions={actions} canManage={canManage} />;
    case 'calendar':
      return <CalendarTab project={project} actions={actions} canManage={canManage} />;
    case 'roles':
      return <RolesManagementTab project={project} actions={actions} canManage={canManage} />;
    case 'description':
      return <ProjectDescriptionTab project={project} actions={actions} canManage={canManage} />;
    case 'submissions':
      return <SubmissionsTab project={project} actions={actions} canManage={canManage} />;
    case 'files':
      return <FileManagerTab project={project} actions={actions} canManage={canManage} />;
    case 'invitations':
      return <InvitationsTab project={project} actions={actions} canManage={canManage} />;
    case 'hr':
      return <HrManagementTab project={project} actions={actions} canManage={canManage} />;
    default:
      return null;
  }
}

function formatStatus(value) {
  if (!value) {
    return 'pending';
  }
  return value.replace(/_/g, ' ');
}

function formatDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString('en-GB');
}

export default function ProjectWorkspaceSection({
  className,
  projects,
  selectedProjectId,
  onSelectProject,
  activeTab,
  onTabChange,
  actions,
  canManage,
  summary,
}) {
  const activeProject =
    projects.find((project) => String(project.id) === String(selectedProjectId)) ?? projects[0] ?? null;

  if (!activeProject) {
    return null;
  }

  const activeProjectId = String(activeProject.id);
  const meetingCount = activeProject.meetings?.length ?? summary?.meetingCount ?? 0;
  const upcomingMeetings = activeProject.meetings
    ? activeProject.meetings.filter((meeting) => (meeting.scheduledAt ? new Date(meeting.scheduledAt) > new Date() : false)).length
    : summary?.upcomingMeetings ?? 0;
  const pendingInvitations = activeProject.invitations
    ? activeProject.invitations.filter((invitation) => invitation.status === 'pending').length
    : summary?.invitationCount ?? 0;

  return (
    <div
      className={classNames(
        'grid min-h-[70vh] gap-6 rounded-3xl border border-slate-100 bg-slate-50/60 p-6 shadow-inner lg:grid-cols-[200px_1fr]',
        className,
      )}
    >
      <aside className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Menu</p>
          <nav className="mt-3 space-y-4 text-sm">
            {NAV_SECTIONS.map((section) => (
              <div key={section.id}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{section.label}</p>
                <div className="mt-2 flex flex-col gap-2">
                  {section.items.map((item) => {
                    const isActive = item.id === activeTab;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onTabChange(item.id)}
                        className={`inline-flex items-center justify-between rounded-2xl px-3 py-2 text-left font-semibold transition ${
                          isActive
                            ? 'bg-white text-slate-900 shadow-soft'
                            : 'text-slate-500 hover:bg-white/70 hover:text-slate-900'
                        }`}
                      >
                        <span>{item.label}</span>
                        <ChevronRightIcon className={`h-4 w-4 ${isActive ? 'text-accent' : 'text-slate-400'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white">
        <header className="border-b border-slate-100 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">{activeProjectId}</p>
              <h3 className="text-xl font-semibold text-slate-900">{activeProject.title}</h3>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1">{formatStatus(activeProject.status)}</span>
                {activeProject.workspace?.progressPercent != null ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {Number(activeProject.workspace.progressPercent).toFixed(0)}% progress
                  </span>
                ) : null}
                {activeProject.dueDate ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1">Due {formatDate(activeProject.dueDate)}</span>
                ) : null}
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  Tasks {summary?.taskCount ?? activeProject.tasks?.length ?? 0}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">Meet {meetingCount}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">Upcoming {upcomingMeetings}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">Invites {pendingInvitations}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-500">
              <button
                type="button"
                onClick={() => onSelectProject(activeProjectId)}
                className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300"
              >
                Focus
              </button>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {renderTab({ id: activeTab, project: activeProject, actions, canManage })}
        </div>
      </div>
    </div>
  );
}

ProjectWorkspaceSection.propTypes = {
  className: PropTypes.string,
  projects: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedProjectId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectProject: PropTypes.func.isRequired,
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  actions: PropTypes.object.isRequired,
  canManage: PropTypes.bool.isRequired,
  summary: PropTypes.object,
};

ProjectWorkspaceSection.defaultProps = {
  className: undefined,
  selectedProjectId: undefined,
  summary: {},
};

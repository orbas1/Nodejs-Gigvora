import { useMemo } from 'react';
import SectionShell from '../../SectionShell.jsx';
import TaskSprintManager from '../../../../components/dashboard/TaskSprintManager.jsx';
import useRoleAccess from '../../../../hooks/useRoleAccess.js';

function AccessOverlay({ allowedRoles, children }) {
  const { hasAccess, isAuthenticated } = useRoleAccess(allowedRoles, { autoSelectActive: false });
  if (hasAccess) {
    return children;
  }

  const buttonClass = isAuthenticated
    ? 'inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500'
    : 'inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500';

  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 text-center shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Workspace upgrade required</h3>
      <p className="mt-3 text-sm text-slate-600">
        {isAuthenticated
          ? 'Switch to a freelancer workspace with delivery permissions to unlock the sprint cockpit.'
          : 'Sign in with your authorised freelancer workspace to unlock the sprint cockpit.'}
      </p>
      <div className="mt-5 flex justify-center">
        <a href={isAuthenticated ? '/settings' : '/login'} className={buttonClass}>
          {isAuthenticated ? 'Manage memberships' : 'Sign in'}
        </a>
      </div>
    </div>
  );
}

export default function TaskManagementSection() {
  const allowedRoles = useMemo(() => ['freelancer'], []);
  return (
    <SectionShell
      id="task-management"
      title="Task management & delegation"
      description="Launch disciplined sprints, orchestrate backlogs, and route governance requests without leaving your mission control."
    >
      <AccessOverlay allowedRoles={allowedRoles}>
        <TaskSprintManager />
      </AccessOverlay>
    </SectionShell>
  );
}

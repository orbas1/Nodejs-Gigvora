import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DashboardAccessGuard from '../../components/security/DashboardAccessGuard.jsx';
import useSession from '../../hooks/useSession.js';
import DataStatus from '../../components/DataStatus.jsx';
import UserProjectsWorkspace from './user/projects/UserProjectsWorkspace.jsx';

const AVAILABLE_DASHBOARDS = [
  { id: 'user', label: 'User', href: '/dashboard/user' },
  { id: 'freelancer', label: 'Freelancer', href: '/dashboard/freelancer' },
  { id: 'agency', label: 'Agency', href: '/dashboard/agency' },
  { id: 'company', label: 'Company', href: '/dashboard/company' },
  { id: 'headhunter', label: 'Headhunter', href: '/dashboard/headhunter' },
];

const ALLOWED_ROLES = AVAILABLE_DASHBOARDS.map((dashboard) => dashboard.id);

const MENU_SECTIONS = [
  {
    label: 'Projects',
    items: [
      { id: 'overview', name: 'Overview', sectionId: 'user-projects-overview' },
      { id: 'board', name: 'Board', sectionId: 'user-projects-board' },
      { id: 'gigs', name: 'Gigs', sectionId: 'user-projects-operations' },
    ],
  },
];

function resolveUserId(session) {
  if (!session) {
    return null;
  }
  return session.userId ?? session.user?.id ?? session.id ?? null;
}

export default function UserProjectManagementPage() {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const userId = useMemo(() => resolveUserId(session), [session]);

  const handleMenuSelect = (itemId, item) => {
    if (item?.href) {
      navigate(item.href);
      return;
    }
    const targetId = item?.sectionId ?? itemId;
    if (!targetId || typeof document === 'undefined') {
      return;
    }
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!isAuthenticated || !userId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <DataStatus
            loading={false}
            error={{ message: 'Sign in to manage your projects.' }}
            fromCache={false}
            onRefresh={null}
          />
        </div>
      </main>
    );
  }

  return (
    <DashboardAccessGuard requiredRoles={ALLOWED_ROLES}>
      <DashboardLayout
        currentDashboard="user"
        title="Projects"
        subtitle="Command centre for every build"
        description="Launch, coordinate, and review gigs without leaving the dashboard."
        menuSections={MENU_SECTIONS}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem="overview"
        onMenuItemSelect={handleMenuSelect}
      >
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <UserProjectsWorkspace userId={userId} session={session} />
        </div>
      </DashboardLayout>
    </DashboardAccessGuard>
  );
}


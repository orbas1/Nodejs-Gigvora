import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import ProjectsBoard from '../../components/admin/projects/ProjectsBoard.jsx';
import useSession from '../../hooks/useSession.js';
import { fetchProjectPortfolio } from '../../services/adminProjectManagement.js';

const MENU_SECTIONS = [
  {
    label: 'Menu',
    items: [
      { name: 'Home', href: '/dashboard/admin' },
      { name: 'Projects', href: '/dashboard/admin/projects' },
      { name: 'Blog', href: '/dashboard/admin/blog' },
    ],
  },
];

const ADMIN_ACCESS_ALIASES = new Set(['admin', 'administrator', 'super-admin', 'superadmin']);

function normalizeList(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => (item != null ? String(item).toLowerCase().trim() : ''))
      .filter(Boolean);
  }
  return [String(value).toLowerCase().trim()].filter(Boolean);
}

function useAdminAccess(session) {
  return useMemo(() => {
    if (!session) {
      return false;
    }
    const memberships = normalizeList(session.memberships);
    const roles = normalizeList(session.roles);
    const permissions = normalizeList(session.permissions);
    const capabilities = normalizeList(session.capabilities);
    const role = normalizeList(session.role)[0] ?? '';
    const userType = normalizeList(session.userType)[0] ?? '';
    const primary = normalizeList(session.primaryDashboard)[0] ?? '';

    if (permissions.includes('admin:full') || capabilities.includes('admin:access')) {
      return true;
    }

    return (
      memberships.some((item) => ADMIN_ACCESS_ALIASES.has(item)) ||
      roles.some((item) => ADMIN_ACCESS_ALIASES.has(item)) ||
      ADMIN_ACCESS_ALIASES.has(role) ||
      ADMIN_ACCESS_ALIASES.has(userType) ||
      primary === 'admin'
    );
  }, [session]);
}

function GateCard({ title, message, primaryLabel, onPrimary, secondaryLabel, secondaryHref }) {
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-3 text-sm text-slate-600">{message}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onPrimary}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
        >
          {primaryLabel}
        </button>
        {secondaryLabel && secondaryHref ? (
          <a
            href={secondaryHref}
            className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            {secondaryLabel}
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminProjectsPage() {
  const navigate = useNavigate();
  const { session, isAuthenticated } = useSession();
  const hasAdminAccess = useAdminAccess(session);

  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSnapshot = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const snapshot = await fetchProjectPortfolio();
      setInitialSnapshot(snapshot);
    } catch (err) {
      setError(err.message || 'Unable to load projects.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  let content = null;
  if (!isAuthenticated) {
    content = (
      <GateCard
        title="Sign in required"
        message="Sign in with your Gigvora admin credentials to manage projects."
        primaryLabel="Go to admin login"
        onPrimary={() => navigate('/admin')}
        secondaryLabel="Need help?"
        secondaryHref="mailto:ops@gigvora.com"
      />
    );
  } else if (!hasAdminAccess) {
    content = (
      <GateCard
        title="Admin clearance required"
        message="Project controls are limited to administrators. Request elevated access from the operations team."
        primaryLabel="Switch account"
        onPrimary={() => navigate('/admin')}
        secondaryLabel="Contact operations"
        secondaryHref="mailto:ops@gigvora.com"
      />
    );
  } else if (loading) {
    content = (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">Loading projects…</div>
    );
  } else if (error) {
    content = (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-rose-600">{error}</p>
        <button
          type="button"
          onClick={loadSnapshot}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark"
        >
          Retry
        </button>
      </div>
    );
  } else {
    content = <ProjectsBoard initialSnapshot={initialSnapshot} />;
  }

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Projects"
      subtitle="Control"
      menuSections={MENU_SECTIONS}
      sections={[]}
      profile={session}
      availableDashboards={['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter']}
    >
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-indigo-50/40 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6">{content}</div>
      </div>
    </DashboardLayout>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { ArrowPathIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import AdminOverviewPanel from '../../components/admin/AdminOverviewPanel.jsx';
import useSession from '../../hooks/useSession.js';
import { fetchAdminDashboard, updateAdminOverview as persistAdminOverview } from '../../services/admin.js';

const ADMIN_ACCESS_ALIASES = new Set(['admin', 'administrator', 'super-admin', 'superadmin']);

const MENU_SECTIONS = [
  {
    label: 'Home',
    items: [
      { name: 'Start', sectionId: 'overview-home' },
      { name: 'Profile', sectionId: 'overview-profile' },
      { name: 'Stats', sectionId: 'overview-metrics' },
    ],
  },
];

const SECTIONS = [
  { id: 'overview-home', title: 'Start' },
  { id: 'overview-profile', title: 'Profile' },
  { id: 'overview-metrics', title: 'Stats' },
];

function normalizeRoles(roles) {
  if (!Array.isArray(roles)) {
    return [];
  }
  return roles
    .map((role) => (role == null ? null : `${role}`.trim().toLowerCase()))
    .filter(Boolean);
}

function hasAdminAccess(session) {
  if (!session) {
    return false;
  }
  const roleCandidates = [session.userType, session.primaryDashboard];
  if (Array.isArray(session.roles)) {
    roleCandidates.push(...session.roles);
  }
  if (Array.isArray(session.accountTypes)) {
    roleCandidates.push(...session.accountTypes);
  }
  if (Array.isArray(session.memberships)) {
    roleCandidates.push(...session.memberships);
  }
  const normalised = normalizeRoles(roleCandidates);
  return normalised.some((role) => ADMIN_ACCESS_ALIASES.has(role));
}

export default function AdminDashboardPage() {
  const { session, loading: sessionLoading } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [overviewStatus, setOverviewStatus] = useState('');
  const [overviewError, setOverviewError] = useState('');

  const adminAllowed = useMemo(() => hasAdminAccess(session), [session]);

  const loadDashboard = async () => {
    if (!adminAllowed) {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetchAdminDashboard();
      setData(response);
    } catch (err) {
      const message = err?.body?.message || (err instanceof Error ? err.message : 'Unable to load admin overview.');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionLoading) {
      return;
    }
    if (!session) {
      setLoading(false);
      setError('Sign in to view the admin dashboard.');
      return;
    }
    if (!adminAllowed) {
      setLoading(false);
      setError('Admin access required.');
      return;
    }
    loadDashboard();
  }, [sessionLoading, session, adminAllowed]);

  const adminOverview = data?.overview ?? null;

  const handleRefresh = () => {
    if (loading || saving) {
      return;
    }
    loadDashboard();
  };

  const handleOverviewSave = async (payload = {}) => {
    if (!payload || typeof payload !== 'object') {
      return;
    }
    setSaving(true);
    setOverviewError('');
    setOverviewStatus('');
    try {
      const response = await persistAdminOverview(payload);
      setData((previous) => {
        if (!previous) {
          return { overview: response };
        }
        return { ...previous, overview: response };
      });
      setOverviewStatus('Profile updated.');
    } catch (err) {
      const message = err?.body?.message || (err instanceof Error ? err.message : 'Failed to update profile.');
      setOverviewError(message);
    } finally {
      setSaving(false);
    }
  };

  const renderState = () => {
    if (!adminAllowed) {
      return (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-amber-200 bg-amber-50 p-12 text-center text-amber-900">
          <LockClosedIcon className="h-10 w-10" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold">Restricted</h2>
          <p className="mt-2 text-sm">Switch to an admin account to open this dashboard.</p>
        </div>
      );
    }

    if (loading && !adminOverview) {
      return (
        <div className="space-y-6">
          <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/60 p-10 text-center text-sm text-blue-700">
            Loading your overview…
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-32 rounded-3xl bg-slate-100" />
            ))}
          </div>
        </div>
      );
    }

    if (error && !adminOverview) {
      return (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center text-rose-700">
          <p className="text-base font-semibold">{error}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-700 transition hover:border-rose-300 hover:bg-rose-50"
          >
            <ArrowPathIcon className="h-4 w-4" /> Try again
          </button>
        </div>
      );
    }

    return (
      <AdminOverviewPanel
        overview={adminOverview}
        saving={saving}
        status={overviewStatus}
        error={overviewError || error}
        onSave={handleOverviewSave}
        onRefresh={handleRefresh}
      />
    );
  };

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Admin Overview"
      subtitle="Realtime snapshot"
      description="Stay on top of member sentiment, trust, and weather cues at a glance."
      menuSections={MENU_SECTIONS}
      sections={SECTIONS}
      availableDashboards={['admin', 'user', 'freelancer', 'company', 'agency', 'headhunter']}
    >
      <div className="space-y-10">
        {renderState()}
      </div>
    </DashboardLayout>
  );
}

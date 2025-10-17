import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import useSession from '../../hooks/useSession.js';
import useCachedResource from '../../hooks/useCachedResource.js';
import { fetchAutoMatchOverview } from '../../services/freelancerAutoMatch.js';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from './freelancer/menuConfig.js';

function resolveFreelancerId(session) {
  if (!session) return null;
  return session.freelancerId ?? session.id ?? session.userId ?? null;
}

function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) {
    return '—';
  }
  return `${Math.round(Number(value))}%`;
}

export default function FreelancerDashboardPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const freelancerId = useMemo(() => {
    const resolved = resolveFreelancerId(session);
    return resolved != null ? String(resolved) : null;
  }, [session]);

  const displayName = useMemo(() => {
    if (!session) {
      return 'Freelancer';
    }
    const nameFromParts = [session.firstName, session.lastName].filter(Boolean).join(' ').trim();
    const fallback = nameFromParts || session.email || null;
    return session.name ?? fallback ?? 'Freelancer';
  }, [session]);

  const {
    data: overview,
    loading: overviewLoading,
    error: overviewError,
    refresh: refreshOverview,
    lastUpdated: overviewUpdatedAt,
  } = useCachedResource(
    freelancerId ? `freelancer:auto-match:overview:${freelancerId}` : null,
    ({ signal }) => fetchAutoMatchOverview(freelancerId, { signal }),
    { dependencies: [freelancerId], enabled: Boolean(freelancerId) },
  );

  const metrics = useMemo(() => {
    return [
      {
        id: 'live',
        label: 'Live matches',
        value: overview?.summary?.liveInvites ?? 0,
      },
      {
        id: 'pending',
        label: 'Pending',
        value: overview?.summary?.pendingDecisions ?? 0,
      },
      {
        id: 'acceptance',
        label: 'Accept rate',
        value: formatPercent(overview?.stats?.acceptanceRate),
      },
    ];
  }, [overview?.summary, overview?.stats]);

  const availabilityStatus = overview?.preference?.availabilityStatus ?? 'unknown';
  const availabilityLabel =
    availabilityStatus === 'available'
      ? 'Online'
      : availabilityStatus === 'snoozed'
      ? 'Paused'
      : availabilityStatus === 'offline'
      ? 'Offline'
      : 'Unset';

  const quickActions = [
    { id: 'auto', label: 'Auto match', href: '/dashboard/freelancer/automatch' },
    { id: 'pipeline', label: 'Pipeline', href: '/dashboard/freelancer/pipeline' },
    { id: 'finance', label: 'Finance', href: '/finance' },
    { id: 'profile', label: 'Profile', href: session?.id ? `/profile/${session.id}` : '/profile/me' },
  ];

  const handleMenuSelect = (itemId, item) => {
    if (item?.href) {
      navigate(item.href);
      return;
    }
    if (itemId === 'auto') {
      navigate('/dashboard/freelancer/automatch');
    }
  };

  return (
    <DashboardLayout
      currentDashboard="freelancer"
      title="Freelancer"
      subtitle="Workspace overview"
      menuSections={MENU_GROUPS}
      availableDashboards={AVAILABLE_DASHBOARDS}
      activeMenuItem="home"
      onMenuItemSelect={handleMenuSelect}
    >
      <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-10">
        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Welcome</p>
              <h1 className="text-2xl font-semibold text-slate-900">{displayName}</h1>
            </div>
            <button
              type="button"
              onClick={() => refreshOverview({ force: true })}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
              disabled={overviewLoading}
            >
              Refresh
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.id}
                className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-6 text-center"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{metric.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Availability</h2>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                availabilityStatus === 'available'
                  ? 'bg-emerald-50 text-emerald-700'
                  : availabilityStatus === 'snoozed'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-slate-100 text-slate-500'
              }`}
              >
                {availabilityLabel}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Auto accept</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {formatPercent(overview?.preference?.autoAcceptThreshold)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quiet hours</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">
                  {overview?.preference?.quietHoursStart && overview?.preference?.quietHoursEnd
                    ? `${overview.preference.quietHoursStart} – ${overview.preference.quietHoursEnd}`
                    : 'Not set'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/freelancer/automatch')}
              className="mt-auto inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Manage auto match
            </button>
            {overviewError ? (
              <p className="text-sm text-rose-600">{overviewError.message ?? 'Unable to load automatch data.'}</p>
            ) : null}
            {overviewUpdatedAt ? (
              <p className="text-xs text-slate-400">Updated {new Date(overviewUpdatedAt).toLocaleTimeString()}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-slate-900">Shortcuts</h2>
            <div className="grid gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => navigate(action.href)}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  <span>{action.label}</span>
                  <span className="text-xs text-slate-400">Open</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

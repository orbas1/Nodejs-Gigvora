import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout.jsx';
import DashboardAccessGuard from '../../components/security/DashboardAccessGuard.jsx';
import useSession from '../../hooks/useSession.js';
import useCachedResource from '../../hooks/useCachedResource.js';
import {
  fetchAutoMatchMatches,
  fetchAutoMatchOverview,
  respondToAutoMatch,
  updateAutoMatchPreferences,
} from '../../services/freelancerAutoMatch.js';
import AvailabilityWizard from '../../features/autoMatch/AvailabilityWizard.jsx';
import OverviewPanel from '../../features/autoMatch/OverviewPanel.jsx';
import MatchBoard from '../../features/autoMatch/MatchBoard.jsx';
import ResponseHistory from '../../features/autoMatch/ResponseHistory.jsx';
import { MENU_GROUPS, AVAILABLE_DASHBOARDS } from './freelancer/menuConfig.js';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'matches', label: 'Matches' },
  { id: 'history', label: 'History' },
];

const ALLOWED_ROLES = ['freelancer'];

function useFreelancerId(session) {
  if (!session) return null;
  return session.freelancerId ?? session.id ?? session.userId ?? null;
}

export default function FreelancerAutoMatchPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const freelancerId = useMemo(() => {
    const resolved = useFreelancerId(session);
    return resolved != null ? String(resolved) : null;
  }, [session]);
  const [tab, setTab] = useState('overview');
  const [saving, setSaving] = useState(false);

  const overviewKey = useMemo(
    () => (freelancerId ? `freelancer:auto-match:overview:${freelancerId}` : null),
    [freelancerId],
  );

  const matchesKey = useMemo(
    () => (freelancerId ? `freelancer:auto-match:matches:${freelancerId}` : null),
    [freelancerId],
  );

  const {
    data: overview,
    loading: overviewLoading,
    error: overviewError,
    refresh: refreshOverview,
    lastUpdated: overviewUpdatedAt,
  } = useCachedResource(
    overviewKey,
    ({ signal }) => fetchAutoMatchOverview(freelancerId, { signal }),
    { dependencies: [freelancerId], enabled: Boolean(freelancerId) },
  );

  const {
    data: matchesData,
    loading: matchesLoading,
    error: matchesError,
    refresh: refreshMatches,
    lastUpdated: matchesUpdatedAt,
  } = useCachedResource(
    matchesKey,
    ({ signal }) =>
      fetchAutoMatchMatches(freelancerId, { includeHistorical: true, pageSize: 50, signal }).then((payload) => ({
        entries: Array.isArray(payload?.entries) ? payload.entries : Array.isArray(payload) ? payload : [],
        pagination: payload?.pagination ?? null,
      })),
    { dependencies: [freelancerId], enabled: Boolean(freelancerId) },
  );

  const entries = matchesData?.entries ?? [];

  const handleSavePreferences = async (payload) => {
    if (!freelancerId) return;
    setSaving(true);
    try {
      await updateAutoMatchPreferences(freelancerId, payload);
      await refreshOverview({ force: true });
      await refreshMatches({ force: true });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (nextStatus) => {
    if (!freelancerId) return;
    const current = overview?.preference ?? {};
    await handleSavePreferences({
      ...current,
      availabilityStatus: nextStatus,
    });
  };

  const handleRespond = async (entry, payload) => {
    if (!freelancerId || !entry) return;
    await respondToAutoMatch(freelancerId, entry.id, payload);
    await Promise.all([refreshMatches({ force: true }), refreshOverview({ force: true })]);
  };

  const handleMenuSelect = (itemId, item) => {
    if (item?.href) {
      navigate(item.href);
      return;
    }
    if (itemId === 'home') {
      navigate('/dashboard/freelancer');
    }
  };

  const summaryChips = [
    { label: 'Live', value: overview?.summary?.liveInvites ?? 0 },
    { label: 'Pending', value: overview?.summary?.pendingDecisions ?? 0 },
    { label: 'Accept %', value: overview?.stats?.acceptanceRate },
  ];

  return (
    <DashboardAccessGuard requiredRoles={ALLOWED_ROLES}>
      <DashboardLayout
        currentDashboard="freelancer"
        title="Auto match"
        subtitle="Availability and queue"
        menuSections={MENU_GROUPS}
        availableDashboards={AVAILABLE_DASHBOARDS}
        activeMenuItem="auto"
        onMenuItemSelect={handleMenuSelect}
      >
        <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-10">
          <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Auto match</h1>
                <p className="text-sm text-slate-500">Fast actions for invites</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {summaryChips.map((chip) => {
                  const formattedValue =
                    typeof chip.value === 'number'
                      ? chip.label === 'Accept %'
                        ? `${Math.round(chip.value)}%`
                        : chip.value
                      : '—';
                  return (
                    <span
                      key={chip.label}
                      className="inline-flex min-w-[4.5rem] items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      <span className="text-slate-400">{chip.label}</span>
                      <span className="ml-2 text-slate-900">{formattedValue}</span>
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {TABS.map((item) => {
                const isActive = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </section>

          {freelancerId ? (
            <>
              {tab === 'overview' ? (
                <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                  <OverviewPanel
                    summary={overview?.summary}
                    stats={overview?.stats}
                    preference={overview?.preference}
                    onToggleAvailability={handleToggleAvailability}
                    loading={overviewLoading}
                    error={overviewError}
                    onRefresh={() => refreshOverview({ force: true })}
                    lastUpdated={overviewUpdatedAt}
                  />
                  <AvailabilityWizard
                    preference={overview?.preference}
                    onSubmit={handleSavePreferences}
                    saving={saving}
                    disabled={overviewLoading}
                  />
                </div>
              ) : null}

              {tab === 'matches' ? (
                <MatchBoard
                  entries={entries}
                  loading={matchesLoading}
                  error={matchesError}
                  onRefresh={() => refreshMatches({ force: true })}
                  onRespond={handleRespond}
                />
              ) : null}

              {tab === 'history' ? (
                <ResponseHistory
                  entries={entries}
                  loading={matchesLoading}
                  error={matchesError}
                  onRefresh={() => refreshMatches({ force: true })}
                />
              ) : null}
            </>
          ) : (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 px-6 py-8 text-sm text-amber-700">
              Freelancer profile not found.
            </div>
          )}
        </div>
      </DashboardLayout>
    </DashboardAccessGuard>
  );
}

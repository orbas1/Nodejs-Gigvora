import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useSession from '../../../hooks/useSession.js';
import useDisputesData from './disputes/useDisputesData.js';
import DisputeWizard from './disputes/components/DisputeWizard.jsx';
import DisputeDashboard from '../../../components/disputes/DisputeDashboard.jsx';

export default function FreelancerDisputesPage() {
  const { session } = useSession();
  const freelancerId = session?.id ?? null;
  const {
    dashboard,
    loading,
    refreshing,
    error,
    filters,
    setFilters,
    reload,
    selectedId,
    selectDispute,
    clearSelection,
    selectedDetail,
    detailLoading,
    detailError,
    openDispute,
    logEvent,
    toast,
    dismissToast,
  } = useDisputesData(freelancerId);

  const [wizardOpen, setWizardOpen] = useState(false);

  const handleSelect = (disputeId) => {
    selectDispute(disputeId).catch(() => {});
  };

  const timelineEvents = useMemo(
    () =>
      (dashboard?.disputes ?? [])
        .map((dispute) => dispute.latestEvent)
        .filter(Boolean)
        .sort((a, b) => new Date(b.eventAt).getTime() - new Date(a.eventAt).getTime()),
    [dashboard?.disputes],
  );

  const dashboardFilters = useMemo(
    () => ({
      ...filters,
      options: {
        stages: dashboard?.filters?.stages ?? [],
        statuses: dashboard?.filters?.statuses ?? [],
        priorities: dashboard?.filters?.priorities ?? [],
      },
    }),
    [filters, dashboard?.filters?.stages, dashboard?.filters?.statuses, dashboard?.filters?.priorities],
  );

  return (
    <div className="min-h-screen bg-surfaceMuted pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-10">
        <nav className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          <Link to="/dashboard/freelancer" className="text-slate-500 hover:text-slate-700">
            Dashboard
          </Link>
          <span>•</span>
          <span className="text-slate-900">Disputes</span>
        </nav>

        <div className="mt-6">
          <DisputeDashboard
            summary={dashboard?.summary}
            metrics={dashboard?.metrics}
            disputes={dashboard?.disputes ?? []}
            upcomingDeadlines={dashboard?.upcomingDeadlines ?? []}
            filters={dashboardFilters}
            onFiltersChange={setFilters}
            onRefresh={() => reload().catch(() => {})}
            loading={loading}
            refreshing={refreshing}
            selectedId={selectedId}
            onSelectDispute={handleSelect}
            onClearSelection={clearSelection}
            detail={selectedDetail}
            detailLoading={detailLoading}
            detailError={detailError}
            onLogEvent={logEvent}
            onCreateDispute={() => setWizardOpen(true)}
            permissions={dashboard?.permissions}
            lastRefreshedAt={dashboard?.lastRefreshedAt}
            timelineEvents={timelineEvents}
            toast={toast}
            onDismissToast={dismissToast}
            error={error}
            currentUserId={freelancerId}
          />
        </div>
      </div>

      <DisputeWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreate={(payload) =>
          openDispute(payload)
            .then(() => setWizardOpen(false))
            .catch((cause) => {
              throw cause;
            })
        }
        transactions={dashboard?.eligibleTransactions ?? []}
        reasons={dashboard?.filters?.reasonCodes ?? []}
        priorities={dashboard?.filters?.priorities ?? ['low', 'medium', 'high', 'urgent']}
      />
    </div>
  );
}

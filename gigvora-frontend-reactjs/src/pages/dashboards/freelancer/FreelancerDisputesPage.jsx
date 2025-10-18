import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowPathIcon, FunnelIcon, PlusIcon } from '@heroicons/react/24/outline';
import useSession from '../../hooks/useSession.js';
import useDisputesData from './disputes/useDisputesData.js';
import DisputeBoard from './disputes/components/DisputeBoard.jsx';
import DisputeDrawer from './disputes/components/DisputeDrawer.jsx';
import DisputeWizard from './disputes/components/DisputeWizard.jsx';
import TimelinePanel from './disputes/components/TimelinePanel.jsx';
import MetricsBar from './disputes/components/MetricsBar.jsx';

const STATUS_COLUMNS = [
  { id: 'open', label: 'Open', statuses: ['open'] },
  { id: 'client', label: 'Client', statuses: ['awaiting_customer'] },
  { id: 'review', label: 'Review', statuses: ['under_review'] },
  { id: 'done', label: 'Done', statuses: ['settled', 'closed'] },
];

function buildColumns(disputes = []) {
  return STATUS_COLUMNS.map((column) => ({
    ...column,
    items: disputes.filter((dispute) => column.statuses.includes(dispute.status)),
  }));
}

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1 text-sm font-semibold transition ${
        active ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

function Toast({ toast, onDismiss }) {
  if (!toast) {
    return null;
  }
  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-sm rounded-2xl border border-emerald-200 bg-white p-4 text-sm text-emerald-700 shadow-xl">
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold">{toast.message}</span>
        <button type="button" onClick={onDismiss} className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
          Close
        </button>
      </div>
    </div>
  );
}

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

  const columns = useMemo(() => buildColumns(dashboard?.disputes), [dashboard?.disputes]);
  const stageOptions = useMemo(() => ['all', ...(dashboard?.filters?.stages ?? [])], [dashboard?.filters?.stages]);
  const statusOptions = useMemo(() => ['all', ...(dashboard?.filters?.statuses ?? [])], [dashboard?.filters?.statuses]);

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

        <header className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Disputes</h1>
            <p className="mt-1 text-sm text-slate-500">Manage escrow issues with a clear board, instant actions, and history.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => reload().catch(() => {})}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-800"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
            >
              <PlusIcon className="h-4 w-4" /> New dispute
            </button>
          </div>
        </header>

        {error ? (
          <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
            {error.message || 'Unable to load disputes right now.'}
          </div>
        ) : null}

        <div className="mt-6 space-y-6">
          <MetricsBar summary={dashboard?.summary} refreshing={refreshing} />

          <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200/70 bg-white p-4 shadow-soft">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <FunnelIcon className="h-4 w-4" /> Filters
            </div>
            <div className="flex flex-wrap gap-2">
              {stageOptions.map((option) => (
                <Chip
                  key={`stage-${option}`}
                  active={filters.stage === option}
                  onClick={() => setFilters((prev) => ({ ...prev, stage: option }))}
                >
                  {option}
                </Chip>
              ))}
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <Chip
                  key={`status-${option}`}
                  active={filters.status === option}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, status: option, includeClosed: option === 'all' || option === 'closed' }))
                  }
                >
                  {option}
                </Chip>
              ))}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <DisputeBoard
              columns={columns}
              activeDisputeId={selectedId}
              onSelect={handleSelect}
              loading={loading}
            />
            <TimelinePanel
              deadlines={dashboard?.upcomingDeadlines ?? []}
              events={timelineEvents}
              onSelect={handleSelect}
            />
          </div>
        </div>
      </div>

      <DisputeDrawer
        open={Boolean(selectedId)}
        detail={selectedDetail}
        loading={detailLoading}
        error={detailError}
        onClose={clearSelection}
        onSubmit={logEvent}
      />

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

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

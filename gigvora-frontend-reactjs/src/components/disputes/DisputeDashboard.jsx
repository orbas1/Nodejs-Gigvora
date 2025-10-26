import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowPathIcon, FunnelIcon, PlusIcon } from '@heroicons/react/24/outline';
import DisputeMetricsSummary from './DisputeMetricsSummary.jsx';
import DisputeCaseList from './DisputeCaseList.jsx';
import DisputeFilterDrawer from './DisputeFilterDrawer.jsx';
import CaseDetailView from './CaseDetailView.jsx';
import ResolutionTimeline from './ResolutionTimeline.jsx';
import { DISPUTE_PRIORITY_OPTIONS, DISPUTE_STAGE_OPTIONS, DISPUTE_STATUS_OPTIONS } from '../../constants/disputes.js';

const PRIORITY_ORDER = { urgent: 4, high: 3, medium: 2, low: 1 };

function humanise(value) {
  if (!value) {
    return '';
  }
  return value.replace(/_/g, ' ');
}

function resolveOptionLabel(options = [], value) {
  if (!value) {
    return null;
  }
  const match = options.find((option) => option.value === value || option === value || option?.id === value);
  if (!match) {
    return humanise(String(value));
  }
  if (typeof match === 'string') {
    return humanise(match);
  }
  return match.label ?? humanise(String(match.value ?? match.id));
}

function buildFilterChips(filters, localFilters, filterOptions) {
  const chips = [];
  if (filters.stage && filters.stage !== 'all') {
    chips.push({ id: 'stage', label: `Stage: ${resolveOptionLabel(filterOptions.stages, filters.stage)}` });
  }
  if (filters.status && filters.status !== 'all') {
    chips.push({ id: 'status', label: `Status: ${resolveOptionLabel(filterOptions.statuses, filters.status)}` });
  }
  if (filters.includeClosed) {
    chips.push({ id: 'closed', label: 'Closed cases included' });
  }
  if (localFilters.priority) {
    chips.push({ id: 'priority', label: `Priority: ${resolveOptionLabel(filterOptions.priorities, localFilters.priority)}` });
  }
  if (localFilters.onlyMine) {
    chips.push({ id: 'mine', label: 'My queue' });
  }
  if (localFilters.search) {
    chips.push({ id: 'search', label: `Search: ${localFilters.search}` });
  }
  if (localFilters.assignedToId) {
    chips.push({ id: 'assignee', label: `Owner: ${localFilters.assignedToId}` });
  }
  return chips;
}

function sortDisputes(disputes, sortBy, direction) {
  const multiplier = direction === 'ASC' ? 1 : -1;
  const normalisedSort = sortBy ?? 'updatedAt';
  return disputes.slice().sort((a, b) => {
    let left;
    let right;
    switch (normalisedSort) {
      case 'openedAt':
        left = new Date(a.openedAt ?? 0).getTime();
        right = new Date(b.openedAt ?? 0).getTime();
        break;
      case 'priority':
        left = PRIORITY_ORDER[a.priority] ?? 0;
        right = PRIORITY_ORDER[b.priority] ?? 0;
        break;
      case 'stage':
        left = (a.stage ?? '').localeCompare(b.stage ?? '');
        right = 0;
        break;
      case 'status':
        left = (a.status ?? '').localeCompare(b.status ?? '');
        right = 0;
        break;
      case 'amount':
        left = Number(a.transaction?.amount ?? 0);
        right = Number(b.transaction?.amount ?? 0);
        break;
      case 'reference':
        left = (a.transaction?.reference ?? '').localeCompare(b.transaction?.reference ?? '');
        right = 0;
        break;
      case 'updatedAt':
      default:
        left = new Date(a.updatedAt ?? 0).getTime();
        right = new Date(b.updatedAt ?? 0).getTime();
        break;
    }
    if (left === right) {
      return 0;
    }
    if (typeof left === 'string' || typeof right === 'string') {
      return left < right ? -1 * multiplier : 1 * multiplier;
    }
    return left < right ? -1 * multiplier : 1 * multiplier;
  });
}

export default function DisputeDashboard({
  summary = null,
  metrics = null,
  disputes = [],
  upcomingDeadlines = [],
  filters = { stage: 'all', status: 'all', includeClosed: false, options: {} },
  onFiltersChange,
  onRefresh,
  loading = false,
  refreshing = false,
  selectedId = null,
  onSelectDispute,
  onClearSelection,
  detail = null,
  detailLoading = false,
  detailError = null,
  onLogEvent,
  onCreateDispute,
  permissions = null,
  lastRefreshedAt = null,
  timelineEvents = [],
  toast = null,
  onDismissToast,
  error = null,
  currentUserId = null,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    search: '',
    priority: '',
    assignedToId: '',
    transactionReference: '',
    sortBy: 'updatedAt',
    sortDirection: 'DESC',
    onlyMine: false,
  });

  const filterOptions = useMemo(
    () => ({
      stages: filters?.options?.stages ?? DISPUTE_STAGE_OPTIONS,
      statuses: filters?.options?.statuses ?? DISPUTE_STATUS_OPTIONS,
      priorities: filters?.options?.priorities ?? DISPUTE_PRIORITY_OPTIONS,
    }),
    [filters?.options?.stages, filters?.options?.statuses, filters?.options?.priorities],
  );

  const filteredDisputes = useMemo(() => {
    if (!Array.isArray(disputes)) {
      return [];
    }
    const searchTerm = localFilters.search.trim().toLowerCase();
    const assignee = localFilters.assignedToId.trim();
    const reference = localFilters.transactionReference.trim().toLowerCase();
    const mine = localFilters.onlyMine;

    const base = disputes.filter((dispute) => {
      if (localFilters.priority && dispute.priority !== localFilters.priority) {
        return false;
      }
      if (mine && currentUserId) {
        const ownsCase =
          Number.parseInt(dispute.assignedToId, 10) === Number.parseInt(currentUserId, 10) ||
          Number.parseInt(dispute.openedById, 10) === Number.parseInt(currentUserId, 10);
        if (!ownsCase) {
          return false;
        }
      }
      if (assignee && String(dispute.assignedToId ?? '') !== assignee) {
        return false;
      }
      if (reference) {
        const ref = dispute.transaction?.reference ?? '';
        if (!ref.toLowerCase().includes(reference)) {
          return false;
        }
      }
      if (searchTerm) {
        const haystack = [
          dispute.summary,
          dispute.reasonCode,
          dispute.transaction?.reference,
          dispute.transaction?.milestoneLabel,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(searchTerm)) {
          return false;
        }
      }
      return true;
    });

    return sortDisputes(base, localFilters.sortBy, localFilters.sortDirection);
  }, [disputes, localFilters, currentUserId]);

  const totals = useMemo(
    () => ({
      openDisputes: summary?.openCases ?? 0,
      overdue: (upcomingDeadlines ?? []).filter((deadline) => deadline.isPastDue).length,
      byStage: metrics?.byStage ?? {},
      byStatus: metrics?.byStatus ?? {},
      byPriority: metrics?.byPriority ?? {},
    }),
    [summary?.openCases, upcomingDeadlines, metrics?.byStage, metrics?.byStatus, metrics?.byPriority],
  );

  const chips = useMemo(
    () => buildFilterChips(filters ?? {}, localFilters, filterOptions),
    [filters, localFilters, filterOptions],
  );

  const handleToggleIncludeClosed = () => {
    onFiltersChange?.((current) => ({
      ...current,
      includeClosed: !current.includeClosed,
      status: current.includeClosed ? current.status : current.status === 'closed' ? 'all' : current.status,
    }));
  };

  const handleToggleMine = () => {
    setLocalFilters((current) => ({ ...current, onlyMine: !current.onlyMine }));
  };

  const handleFilterChange = (field, value) => {
    setLocalFilters((current) => ({ ...current, [field]: value }));
  };

  const handleDrawerReset = () => {
    setLocalFilters({
      search: '',
      priority: '',
      assignedToId: '',
      transactionReference: '',
      sortBy: 'updatedAt',
      sortDirection: 'DESC',
      onlyMine: false,
    });
  };

  const formattedRefreshedAt = useMemo(() => {
    if (!lastRefreshedAt) {
      return null;
    }
    const date = new Date(lastRefreshedAt);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [lastRefreshedAt]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Support dispute workspace</h1>
          <p className="mt-2 text-sm text-slate-600">
            Monitor trust signals, triage escalations, and resolve customer disputes with premium care.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {formattedRefreshedAt ? (
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Refreshed {formattedRefreshedAt}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={onCreateDispute}
            disabled={!permissions?.canOpen}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold shadow-soft transition ${
              permissions?.canOpen
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500'
                : 'bg-slate-300 text-slate-500'
            }`}
          >
            <PlusIcon className="h-4 w-4" />
            New dispute
          </button>
        </div>
      </header>

      <DisputeMetricsSummary totals={totals} loading={loading} />

      {toast ? (
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-soft">
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={onDismissToast}
            className="text-xs font-semibold uppercase tracking-wide text-emerald-700"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error.message || 'Unable to load disputes right now.'}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <FunnelIcon className="h-4 w-4" /> Filters
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', ...(filters?.options?.stages ?? [])].map((stage) => {
            const value = typeof stage === 'string' ? stage : stage.value ?? stage.id;
            const label = typeof stage === 'string' ? stage : stage.label ?? stage.name;
            return (
              <button
                type="button"
                key={`stage-${value}`}
                onClick={() =>
                  onFiltersChange?.((current) => ({
                    ...current,
                    stage: value,
                  }))
                }
                className={`rounded-full px-4 py-1 text-sm font-semibold transition ${
                  (filters?.stage ?? 'all') === value
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {typeof label === 'string' ? label : humanise(String(label))}
              </button>
            );
          })}
        </div>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex flex-wrap gap-2">
          {['all', ...(filters?.options?.statuses ?? [])].map((status) => {
            const value = typeof status === 'string' ? status : status.value ?? status.id;
            const label = typeof status === 'string' ? status : status.label ?? status.name;
            return (
              <button
                type="button"
                key={`status-${value}`}
                onClick={() =>
                  onFiltersChange?.((current) => ({
                    ...current,
                    status: value,
                    includeClosed: value === 'all' ? current.includeClosed : value === 'closed' || current.includeClosed,
                  }))
                }
                className={`rounded-full px-4 py-1 text-sm font-semibold transition ${
                  (filters?.status ?? 'all') === value
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {typeof label === 'string' ? label : humanise(String(label))}
              </button>
            );
          })}
        </div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          Advanced filters
        </button>
      </div>

      {chips.length ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {chips.map((chip) => (
            <span key={chip.id} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
              {chip.label}
            </span>
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <DisputeCaseList
          disputes={filteredDisputes}
          totals={totals}
          loading={loading}
          selectedId={selectedId}
          onSelect={onSelectDispute}
          onRefresh={onRefresh}
          pagination={{ page: 1, totalPages: 1, totalItems: filteredDisputes.length }}
          onPageChange={() => {}}
          onOpenFilters={() => setDrawerOpen(true)}
          onToggleOnlyMine={handleToggleMine}
          onToggleIncludeClosed={handleToggleIncludeClosed}
          onlyMine={localFilters.onlyMine}
          includeClosed={Boolean(filters?.includeClosed)}
          filterSummary={chips}
          error={error}
        />
        <div className="space-y-6">
          <ResolutionTimeline
            deadlines={upcomingDeadlines}
            events={timelineEvents}
            onSelectDeadline={onSelectDispute}
            activeDisputeId={selectedId}
            onRefresh={onRefresh}
            refreshing={refreshing}
          />
          <CaseDetailView
            detail={detail}
            loading={detailLoading}
            error={detailError}
            busy={refreshing}
            onSubmit={onLogEvent}
            onClose={onClearSelection}
          />
        </div>
      </div>

      <DisputeFilterDrawer
        open={drawerOpen}
        filters={{
          stage: filters?.stage ?? 'all',
          status: filters?.status ?? 'all',
          priority: localFilters.priority,
          search: localFilters.search,
          assignedToId: localFilters.assignedToId,
          transactionReference: localFilters.transactionReference,
          sortBy: localFilters.sortBy,
          sortDirection: localFilters.sortDirection,
          includeClosed: Boolean(filters?.includeClosed),
          onlyMine: Boolean(localFilters.onlyMine),
        }}
        onClose={() => setDrawerOpen(false)}
        onChange={(field, value) => {
          if (['stage', 'status'].includes(field)) {
            onFiltersChange?.((current) => ({ ...current, [field]: value || 'all' }));
          } else {
            handleFilterChange(field, value);
          }
        }}
        onReset={handleDrawerReset}
        onToggleOnlyMine={(checked) => setLocalFilters((current) => ({ ...current, onlyMine: checked }))}
        onToggleIncludeClosed={(checked) =>
          onFiltersChange?.((current) => ({
            ...current,
            includeClosed: checked,
            status: checked ? current.status : current.status === 'closed' ? 'all' : current.status,
          }))
        }
        canFilterMyCases={Boolean(currentUserId)}
      />
    </div>
  );
}

DisputeDashboard.propTypes = {
  summary: PropTypes.shape({ openCases: PropTypes.number }),
  metrics: PropTypes.shape({
    byStage: PropTypes.object,
    byStatus: PropTypes.object,
    byPriority: PropTypes.object,
  }),
  disputes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      summary: PropTypes.string.isRequired,
      status: PropTypes.string,
      stage: PropTypes.string,
      priority: PropTypes.string,
      transaction: PropTypes.shape({
        reference: PropTypes.string,
        amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        currencyCode: PropTypes.string,
      }),
    }),
  ),
  upcomingDeadlines: PropTypes.array,
  filters: PropTypes.shape({
    stage: PropTypes.string,
    status: PropTypes.string,
    includeClosed: PropTypes.bool,
    options: PropTypes.shape({
      stages: PropTypes.array,
      statuses: PropTypes.array,
      priorities: PropTypes.array,
    }),
  }),
  onFiltersChange: PropTypes.func,
  onRefresh: PropTypes.func,
  loading: PropTypes.bool,
  refreshing: PropTypes.bool,
  selectedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectDispute: PropTypes.func,
  onClearSelection: PropTypes.func,
  detail: PropTypes.object,
  detailLoading: PropTypes.bool,
  detailError: PropTypes.instanceOf(Error),
  onLogEvent: PropTypes.func,
  onCreateDispute: PropTypes.func,
  permissions: PropTypes.shape({ canOpen: PropTypes.bool }),
  lastRefreshedAt: PropTypes.string,
  timelineEvents: PropTypes.array,
  toast: PropTypes.shape({ message: PropTypes.string }),
  onDismissToast: PropTypes.func,
  error: PropTypes.instanceOf(Error),
  currentUserId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

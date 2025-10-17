import { useCallback, useEffect, useMemo, useState } from 'react';
import { FunnelIcon, PlusIcon } from '@heroicons/react/24/outline';
import {
  DISPUTE_PRIORITY_OPTIONS,
  DISPUTE_STAGE_OPTIONS,
  DISPUTE_STATUS_OPTIONS,
  DISPUTE_SORT_FIELDS,
  findDisputeOption,
} from '../../constants/disputes.js';
import useSession from '../../hooks/useSession.js';
import {
  fetchDisputes,
  fetchDispute,
  createDispute,
  updateDispute,
  appendDisputeEvent,
} from '../../services/trust.js';
import DisputeCaseList from './DisputeCaseList.jsx';
import DisputeCaseDetail from './DisputeCaseDetail.jsx';
import DisputeCaseForm from './DisputeCaseForm.jsx';
import DisputeMetricsSummary from './DisputeMetricsSummary.jsx';
import DisputeFilterDrawer from './DisputeFilterDrawer.jsx';

function initialFilters() {
  return {
    stage: '',
    status: 'open',
    priority: '',
    assignedToId: '',
    transactionReference: '',
    includeClosed: false,
    onlyMine: false,
    search: '',
    sortBy: 'updatedAt',
    sortDirection: 'DESC',
  };
}

const DEFAULT_FILTERS = initialFilters();

export default function DisputeManagementSection() {
  const { session } = useSession();
  const [filters, setFilters] = useState(() => initialFilters());
  const [disputes, setDisputes] = useState([]);
  const [totals, setTotals] = useState({});
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalPages: 1, totalItems: 0 });
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [addingEvent, setAddingEvent] = useState(false);
  const [pendingSelectId, setPendingSelectId] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [detailOverlayOpen, setDetailOverlayOpen] = useState(false);

  const loadDisputes = useCallback(
    async (targetPage = pagination.page) => {
      setListLoading(true);
      setListError(null);
      try {
        const query = {
          page: targetPage,
          pageSize: pagination.pageSize,
          stage: filters.stage || undefined,
          status: filters.status || undefined,
          priority: filters.priority || undefined,
          includeClosed: filters.includeClosed,
          search: filters.search || undefined,
          sortBy: filters.sortBy,
          sortDirection: filters.sortDirection,
        };

        const assignedFilter = filters.onlyMine ? session?.id : filters.assignedToId;
        if (assignedFilter) {
          query.assignedToId = assignedFilter;
        }
        if (filters.transactionReference) {
          query.transactionReference = filters.transactionReference;
        }

        const response = await fetchDisputes(query);
        const items = response.disputes ?? [];
        setDisputes(items);
        setTotals(response.totals ?? {});
        setPagination((previous) => ({
          ...previous,
          page: response.pagination?.page ?? targetPage,
          totalPages: response.pagination?.totalPages ?? previous.totalPages,
          totalItems: response.pagination?.totalItems ?? previous.totalItems,
        }));

        if (!items.length) {
          setSelectedId(null);
          setDetail(null);
        } else if (!selectedId) {
          setSelectedId(items[0].id);
          setPendingSelectId(null);
        }

        if (pendingSelectId) {
          const found = items.find((item) => Number(item.id) === Number(pendingSelectId));
          if (found) {
            setSelectedId(found.id);
            setPendingSelectId(null);
          }
        }
      } catch (error) {
        setListError(error?.message ?? 'Unable to load disputes.');
      } finally {
        setListLoading(false);
      }
    },
    [filters, pagination.pageSize, pendingSelectId, selectedId, session?.id],
  );

  useEffect(() => {
    loadDisputes(1);
  }, [loadDisputes]);

  const loadDetail = useCallback(async (id) => {
    if (!id) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    setDetailError(null);
    try {
      const dispute = await fetchDispute(id);
      setDetail(dispute);
    } catch (error) {
      setDetailError(error?.message ?? 'Unable to load dispute details.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId != null) {
      loadDetail(selectedId);
    } else {
      setDetail(null);
    }
  }, [selectedId, loadDetail]);

  const setFilterValue = useCallback((field, value) => {
    setFilters((previous) => {
      const nextValue = value;
      if (previous[field] === nextValue) {
        return previous;
      }
      setPagination((prev) => ({ ...prev, page: 1 }));
      return { ...previous, [field]: nextValue };
    });
  }, []);

  const toggleFilter = useCallback((field, value) => {
    setFilters((previous) => {
      const nextValue = typeof value === 'boolean' ? value : !previous[field];
      if (previous[field] === nextValue) {
        return previous;
      }
      setPagination((prev) => ({ ...prev, page: 1 }));
      return { ...previous, [field]: nextValue };
    });
  }, []);

  const handleSelect = (item) => {
    if (!item) {
      return;
    }
    setSelectedId(item.id);
  };

  const handlePageChange = (nextPage) => {
    setPagination((previous) => ({ ...previous, page: nextPage }));
    loadDisputes(nextPage);
  };

  const handleCreateDispute = async (payload) => {
    if (!session?.id) {
      throw new Error('You need to be signed in to open a dispute.');
    }
    setCreating(true);
    try {
      const dispute = await createDispute({
        ...payload,
        openedById: session.id,
      });
      setCreateOpen(false);
      setPendingSelectId(dispute?.id ?? null);
      await loadDisputes(1);
      await loadDetail(dispute?.id ?? null);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateDispute = async (payload) => {
    if (!selectedId) {
      return;
    }
    setUpdating(true);
    try {
      const dispute = await updateDispute(selectedId, payload);
      setDetail(dispute);
      await loadDisputes(pagination.page);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddEvent = async (payload) => {
    if (!selectedId || !session?.id) {
      throw new Error('You must select a dispute to add events.');
    }
    setAddingEvent(true);
    try {
      await appendDisputeEvent(selectedId, { ...payload, actorId: session.id });
      await loadDetail(selectedId);
      await loadDisputes(pagination.page);
    } finally {
      setAddingEvent(false);
    }
  };

  const activeFilters = useMemo(() => {
    const summary = [];
    if (filters.stage) {
      summary.push({ id: 'stage', label: findDisputeOption(DISPUTE_STAGE_OPTIONS, filters.stage)?.label ?? filters.stage });
    }
    if (filters.priority) {
      summary.push({ id: 'priority', label: findDisputeOption(DISPUTE_PRIORITY_OPTIONS, filters.priority)?.label ?? filters.priority });
    }
    if (filters.status && filters.status !== DEFAULT_FILTERS.status) {
      summary.push({ id: 'status', label: findDisputeOption(DISPUTE_STATUS_OPTIONS, filters.status)?.label ?? filters.status });
    }
    if (filters.assignedToId) {
      summary.push({ id: 'assignee', label: `Assignee #${filters.assignedToId}` });
    }
    if (filters.transactionReference) {
      summary.push({ id: 'reference', label: `Ref ${filters.transactionReference}` });
    }
    if (filters.search) {
      summary.push({ id: 'search', label: `Search: ${filters.search}` });
    }
    if (filters.sortBy !== DEFAULT_FILTERS.sortBy) {
      summary.push({ id: 'sortBy', label: findDisputeOption(DISPUTE_SORT_FIELDS, filters.sortBy)?.label ?? filters.sortBy });
    }
    if (filters.sortDirection !== DEFAULT_FILTERS.sortDirection) {
      summary.push({ id: 'sortDirection', label: filters.sortDirection === 'ASC' ? 'Asc' : 'Desc' });
    }
    if (filters.includeClosed) {
      summary.push({ id: 'includeClosed', label: 'Closed' });
    }
    if (filters.onlyMine) {
      summary.push({ id: 'mine', label: 'My queue' });
    }
    return summary;
  }, [filters]);

  const filterCount = activeFilters.length;
  const canFilterMyCases = Boolean(session?.id);

  const handleResetFilters = useCallback(() => {
    setFilters(initialFilters());
    setPagination((previous) => ({ ...previous, page: 1 }));
  }, []);

  return (
    <section id="agency-dispute-management" className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-soft">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Disputes</h2>
          <p className="mt-1 text-sm text-slate-500">Live escrow escalations with case controls, evidence, and SLAs.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600"
          >
            <FunnelIcon className="h-5 w-5" />
            Filters{filterCount ? ` (${filterCount})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5" />
            New case
          </button>
        </div>
      </div>

      <DisputeMetricsSummary totals={totals} loading={listLoading && disputes.length === 0} />

      <div className="grid gap-8 xl:grid-cols-[minmax(340px,420px)_1fr]">
        <DisputeCaseList
          disputes={disputes}
          totals={totals}
          loading={listLoading}
          selectedId={selectedId}
          onSelect={handleSelect}
          onRefresh={() => loadDisputes(pagination.page)}
          pagination={pagination}
          onPageChange={handlePageChange}
          onOpenFilters={() => setFiltersOpen(true)}
          onToggleOnlyMine={() => toggleFilter('onlyMine')}
          onToggleIncludeClosed={() => toggleFilter('includeClosed')}
          onlyMine={filters.onlyMine}
          includeClosed={filters.includeClosed}
          filterSummary={activeFilters}
          error={listError}
        />

        <div className="space-y-4">
          {detailError ? (
            <p className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{detailError}</p>
          ) : null}
          <DisputeCaseDetail
            dispute={detail}
            updating={updating || detailLoading}
            onUpdate={handleUpdateDispute}
            onAddEvent={handleAddEvent}
            addingEvent={addingEvent}
            onRefresh={() => loadDetail(selectedId)}
            onExpand={() => setDetailOverlayOpen(true)}
          />
        </div>
      </div>

      <DisputeCaseForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateDispute}
        submitting={creating}
      />

      <DisputeFilterDrawer
        open={filtersOpen}
        filters={filters}
        onClose={() => setFiltersOpen(false)}
        onChange={(field, value) => setFilterValue(field, value)}
        onReset={handleResetFilters}
        onToggleOnlyMine={(checked) => setFilterValue('onlyMine', checked)}
        onToggleIncludeClosed={(checked) => setFilterValue('includeClosed', checked)}
        canFilterMyCases={canFilterMyCases}
      />

      {detailOverlayOpen && detail ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/70 px-4 py-10">
          <div className="w-full max-w-5xl">
            <DisputeCaseDetail
              dispute={detail}
              updating={updating || detailLoading}
              onUpdate={handleUpdateDispute}
              onAddEvent={handleAddEvent}
              addingEvent={addingEvent}
              onRefresh={() => loadDetail(selectedId)}
              variant="modal"
              onClose={() => setDetailOverlayOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

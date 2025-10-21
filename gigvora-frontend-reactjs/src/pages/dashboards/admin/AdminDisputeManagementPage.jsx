import { useCallback, useEffect, useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import useSession from '../../../hooks/useSession.js';
import DataStatus from '../../../components/DataStatus.jsx';
import DisputeMetricsCards from '../../../components/admin/disputes/DisputeMetricsCards.jsx';
import DisputeFiltersPanel from '../../../components/admin/disputes/DisputeFiltersPanel.jsx';
import DisputeTable from '../../../components/admin/disputes/DisputeTable.jsx';
import DisputeDetailDrawer from '../../../components/admin/disputes/DisputeDetailDrawer.jsx';
import DisputeCreateForm from '../../../components/admin/disputes/DisputeCreateForm.jsx';
import {
  fetchDisputeCases,
  fetchDisputeCase,
  updateDisputeCase,
  appendDisputeEvent,
  createDispute,
} from '../../../services/trust.js';

const MENU_SECTIONS = [
  {
    label: 'Desk',
    items: [
      { id: 'summary', name: 'Summary', sectionId: 'section-summary' },
      { id: 'queue', name: 'Queue', sectionId: 'section-queue' },
      { id: 'case', name: 'Case', sectionId: 'section-case' },
      { id: 'new', name: 'New', sectionId: 'section-create' },
    ],
  },
  {
    label: 'Nav',
    items: [{ id: 'admin', name: 'Admin', href: '/dashboard/admin' }],
  },
];

const DEFAULT_FILTERS = {
  search: '',
  status: ['open', 'awaiting_customer', 'under_review'],
  stage: [],
  priority: [],
  assignedToId: 'any',
  sortBy: 'updatedAt',
  sortDirection: 'desc',
  openOnly: true,
};

function buildQueryParams(filters, page, pageSize) {
  const params = {
    page,
    pageSize,
    sortBy: filters.sortBy,
    sortDirection: filters.sortDirection,
  };
  if (filters.search) {
    params.search = filters.search;
  }
  if (filters.openOnly) {
    params.openOnly = true;
  }
  if (Array.isArray(filters.status) && filters.status.length) {
    params.status = filters.status.join(',');
  }
  if (Array.isArray(filters.stage) && filters.stage.length) {
    params.stage = filters.stage.join(',');
  }
  if (Array.isArray(filters.priority) && filters.priority.length) {
    params.priority = filters.priority.join(',');
  }
  if (filters.assignedToId === 'unassigned') {
    params.assignedToId = 'unassigned';
  } else if (filters.assignedToId && filters.assignedToId !== 'any') {
    params.assignedToId = filters.assignedToId;
  }
  return params;
}

function humanize(value) {
  if (!value) {
    return '—';
  }
  return value
    .toString()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function scrollToSection(targetId) {
  if (typeof document === 'undefined') {
    return;
  }
  const target = document.getElementById(targetId);
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function AdminDisputeManagementPage() {
  const { session } = useSession();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState({ items: [], summary: {}, pagination: { page: 1, pageSize: 25, totalItems: 0, totalPages: 1 } });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [previewDispute, setPreviewDispute] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [eventLoading, setEventLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [flashMessage, setFlashMessage] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState('');

  const fetchDisputes = useCallback(
    async (targetPage, targetFilters) => {
      setLoading(true);
      setError(null);
      try {
        const params = buildQueryParams(targetFilters, targetPage, pageSize);
        const disputes = await fetchDisputeCases(params);
        setResponse(disputes);
        setLastUpdated(new Date().toISOString());
      } catch (err) {
        setError(err?.message || 'Unable to load disputes at this time.');
      } finally {
        setLoading(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    fetchDisputes(page, filters);
  }, [fetchDisputes, filters, page]);

  const formatExportDate = (value) => {
    if (!value) {
      return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toISOString();
  };

  useEffect(() => {
    if (!flashMessage) {
      return undefined;
    }
    const timeout = setTimeout(() => setFlashMessage(null), 4000);
    return () => clearTimeout(timeout);
  }, [flashMessage]);

  useEffect(() => {
    if (!exportStatus) {
      return undefined;
    }
    const timeout = setTimeout(() => setExportStatus(''), 3000);
    return () => clearTimeout(timeout);
  }, [exportStatus]);

  const handleApplyFilters = (nextFilters) => {
    setFilters((current) => ({
      ...current,
      ...nextFilters,
      status: Array.isArray(nextFilters.status) ? nextFilters.status : [],
      stage: Array.isArray(nextFilters.stage) ? nextFilters.stage : [],
      priority: Array.isArray(nextFilters.priority) ? nextFilters.priority : [],
    }));
    setPage(1);
    setFilterOpen(false);
  };

  const handleResetFilters = (resetFilters) => {
    setFilters({ ...DEFAULT_FILTERS, ...resetFilters });
    setPage(1);
  };

  const handleExportCases = () => {
    const exportItems = Array.isArray(response?.items) ? response.items : [];
    if (!exportItems.length) {
      setExportStatus('No cases available to export.');
      return;
    }
    try {
      const rows = [];
      const pushRow = (values) => {
        const serialised = values.map((value) => {
          if (value == null) {
            return '""';
          }
          const text = `${value}`.replace(/"/g, '""');
          return `"${text}"`;
        });
        rows.push(serialised.join(','));
      };

      pushRow(['Case ID', 'Status', 'Stage', 'Priority', 'Assigned', 'Reference', 'Opened at', 'Updated at']);
      exportItems.forEach((dispute) => {
        pushRow([
          dispute.id,
          dispute.status,
          dispute.stage,
          dispute.priority,
          dispute.assignedTo?.displayName || dispute.assignedTo?.email || 'Unassigned',
          dispute.transaction?.reference || '—',
          formatExportDate(dispute.createdAt || dispute.openedAt),
          formatExportDate(dispute.updatedAt),
        ]);
      });

      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
      anchor.download = `gigvora-disputes-${timestamp}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      setExportStatus('Exported dispute queue snapshot.');
    } catch (err) {
      console.error('Failed to export disputes', err);
      setExportStatus('Export failed.');
    }
  };

  const handleMetricSelect = (metricKey) => {
    switch (metricKey) {
      case 'unassignedCount':
        handleApplyFilters({ ...filters, assignedToId: 'unassigned' });
        break;
      case 'overdueCount':
      case 'dueSoonCount':
        handleApplyFilters({ ...filters, openOnly: true, sortBy: 'customerDeadlineAt', sortDirection: 'asc' });
        break;
      case 'totalHeldAmount':
        handleApplyFilters({ ...filters, sortBy: 'amount', sortDirection: 'desc' });
        break;
      default:
        handleApplyFilters({ ...DEFAULT_FILTERS });
        break;
    }
  };

  const handleMenuItemSelect = (itemId) => {
    switch (itemId) {
      case 'queue':
        scrollToSection('section-queue');
        break;
      case 'case':
        scrollToSection('section-case');
        break;
      case 'new':
        setCreateOpen(true);
        break;
      case 'summary':
      default:
        scrollToSection('section-summary');
        break;
    }
  };

  const handleSelectDispute = async (item) => {
    setDetailLoading(true);
    try {
      const detail = await fetchDisputeCase(item.id);
      setSelectedDispute(detail);
      setPreviewDispute(detail);
    } catch (err) {
      setFlashMessage(err?.message || 'Unable to load dispute details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const refreshDispute = useCallback(
    async (disputeId) => {
      try {
        const detail = await fetchDisputeCase(disputeId);
        setSelectedDispute(detail);
        setPreviewDispute(detail);
      } catch (err) {
        setFlashMessage(err?.message || 'Unable to refresh dispute details.');
      }
    },
    [],
  );

  const handleUpdateCase = async (payload) => {
    if (!selectedDispute) {
      return;
    }
    setDetailLoading(true);
    try {
      await updateDisputeCase(selectedDispute.id, { ...payload, actorId: session?.id });
      await Promise.all([refreshDispute(selectedDispute.id), fetchDisputes(page, filters)]);
      setFlashMessage('Dispute updated successfully.');
    } catch (err) {
      setFlashMessage(err?.message || 'Failed to update dispute.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateEvent = async (payload) => {
    if (!selectedDispute) {
      return;
    }
    setEventLoading(true);
    try {
      await appendDisputeEvent(selectedDispute.id, { ...payload, actorId: session?.id });
      await Promise.all([refreshDispute(selectedDispute.id), fetchDisputes(page, filters)]);
      setFlashMessage('Timeline updated.');
    } catch (err) {
      setFlashMessage(err?.message || 'Failed to append dispute event.');
    } finally {
      setEventLoading(false);
    }
  };

  const handleCreateDispute = async (payload, resetCallback) => {
    setCreateLoading(true);
    try {
      const dispute = await createDispute(payload);
      resetCallback?.();
      setFlashMessage('Dispute created.');
      await fetchDisputes(1, filters);
      setPage(1);
      const detail = await fetchDisputeCase(dispute.id);
      setSelectedDispute(detail);
      setPreviewDispute(detail);
      setCreateOpen(false);
    } catch (err) {
      setFlashMessage(err?.message || 'Failed to create dispute.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDisputes(page, filters);
    if (selectedDispute) {
      refreshDispute(selectedDispute.id);
    }
  };

  const summary = response?.summary ?? {};
  const items = response?.items ?? [];
  const pagination = response?.pagination ?? { page: 1, pageSize: 25, totalItems: 0, totalPages: 1 };

  const isErrorFlash = typeof flashMessage === 'string' && flashMessage.toLowerCase().includes('fail');
  const flashTone = isErrorFlash
    ? 'bg-rose-100 text-rose-800 border-rose-200'
    : 'bg-emerald-100 text-emerald-800 border-emerald-200';

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Disputes"
      subtitle="Case desk"
      description=""
      menuSections={MENU_SECTIONS}
      activeMenuItem="summary"
      onMenuItemSelect={handleMenuItemSelect}
    >
      <div className="relative flex h-full flex-col gap-8 px-4 py-6 sm:px-6">
        {flashMessage ? (
          <div className={`pointer-events-none fixed right-6 top-6 z-30 max-w-sm rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg ${flashTone}`}>
            {flashMessage}
          </div>
        ) : null}

        <section id="section-summary" className="space-y-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <DataStatus
              loading={loading}
              error={error}
              lastUpdated={lastUpdated}
              onRefresh={handleRefresh}
              fromCache={false}
              statusLabel="Live"
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportCases}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
                disabled={loading || !items.length}
              >
                <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" /> Export view
              </button>
              {exportStatus ? (
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{exportStatus}</span>
              ) : null}
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
              >
                Filters
              </button>
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                New case
              </button>
            </div>
          </div>
          <DisputeMetricsCards summary={summary} onSelect={handleMetricSelect} />
        </section>

        <section id="section-queue" className="space-y-6">
          <DisputeTable
            items={items}
            summary={summary}
            pagination={pagination}
            loading={loading}
            onSelect={handleSelectDispute}
            onPageChange={(nextPage) => setPage(nextPage)}
          />
        </section>

        <section id="section-case" className="hidden xl:block">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 text-sm text-slate-600">
            {previewDispute ? (
              <div className="flex flex-col gap-3 text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-slate-900">Case #{previewDispute.id}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewDispute(null);
                      setSelectedDispute(null);
                    }}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  >
                    Clear
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase text-slate-400">Stage</p>
                    <p className="text-sm font-semibold text-slate-800">{humanize(previewDispute.stage)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase text-slate-400">Status</p>
                    <p className="text-sm font-semibold text-slate-800">{humanize(previewDispute.status)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase text-slate-400">Priority</p>
                    <p className="text-sm font-semibold text-slate-800">{humanize(previewDispute.priority)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-xs font-semibold uppercase text-slate-400">Assigned</p>
                    <p className="text-sm font-semibold text-slate-800">
                      {previewDispute.assignedTo?.displayName || previewDispute.assignedTo?.email || 'Unassigned'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDispute(previewDispute)}
                  className="self-start rounded-full border border-blue-500 bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Open workspace
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Pick a row to preview the case.</p>
            )}
          </div>
        </section>
      </div>

      <DisputeDetailDrawer
        open={Boolean(selectedDispute)}
        dispute={selectedDispute}
        onClose={() => setSelectedDispute(null)}
        onUpdateCase={handleUpdateCase}
        updateLoading={detailLoading}
        eventLoading={eventLoading}
        onCreateEvent={handleCreateEvent}
        currentUserId={session?.id}
      />

      {filterOpen ? (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-slate-900/40" onClick={() => setFilterOpen(false)} aria-hidden="true" />
          <aside className="relative flex w-full max-w-xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              >
                Close
              </button>
            </header>
            <div className="flex-1 overflow-hidden px-5 py-5">
              <DisputeFiltersPanel
                value={filters}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
                loading={loading}
                sessionUserId={session?.id}
                title="Filters"
              />
            </div>
          </aside>
        </div>
      ) : null}

      {createOpen ? (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-slate-900/40" onClick={() => setCreateOpen(false)} aria-hidden="true" />
          <aside className="relative flex w-full max-w-2xl flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">New dispute</h2>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              >
                Close
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <DisputeCreateForm onSubmit={handleCreateDispute} loading={createLoading} />
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

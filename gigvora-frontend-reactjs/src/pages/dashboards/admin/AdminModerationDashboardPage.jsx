import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import DataStatus from '../../../components/DataStatus.jsx';
import useSession from '../../../hooks/useSession.js';
import ModerationOverviewCards from '../../../components/admin/moderation/ModerationOverviewCards.jsx';
import ModerationQueueTable from '../../../components/admin/moderation/ModerationQueueTable.jsx';
import ModerationAuditTimeline from '../../../components/admin/moderation/ModerationAuditTimeline.jsx';
import AdminGovernanceSection from '../../../components/admin/ui/AdminGovernanceSection.jsx';
import useAdminAutoRefresh from '../../../hooks/useAdminAutoRefresh.js';
import {
  fetchModerationOverview,
  fetchModerationQueue,
  fetchModerationEvents,
  resolveModerationEvent,
} from '../../../services/moderation.js';

const MENU_SECTIONS = [
  {
    label: 'Moderation',
    items: [
      { id: 'summary', name: 'Overview', sectionId: 'section-summary' },
      { id: 'queue', name: 'Review queue', sectionId: 'section-queue' },
      { id: 'audit', name: 'Audit trail', sectionId: 'section-audit' },
    ],
  },
  {
    label: 'Navigation',
    items: [
      { id: 'admin-home', name: 'Admin', href: '/dashboard/admin' },
      { id: 'support', name: 'Support desk', href: '/dashboard/admin/inbox' },
    ],
  },
];

const SEVERITY_OPTIONS = ['critical', 'high', 'medium', 'low'];
const STATUS_OPTIONS = ['open', 'acknowledged', 'resolved', 'dismissed'];

const DEFAULT_FILTERS = {
  severities: ['critical', 'high', 'medium'],
  status: ['open', 'acknowledged'],
  search: '',
};

function scrollToSection(sectionId) {
  if (typeof document === 'undefined') {
    return;
  }
  const element = document.getElementById(sectionId);
  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function QueuePagination({ pagination, onPageChange, disabled }) {
  if (!pagination) {
    return null;
  }
  const { page = 1, totalPages = 1 } = pagination;
  const go = (next) => {
    if (next >= 1 && next <= totalPages) {
      onPageChange(next);
    }
  };
  return (
    <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
      <span className="text-slate-500">
        Page <span className="font-semibold text-slate-900">{page}</span> of{' '}
        <span className="font-semibold text-slate-900">{totalPages}</span>
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => go(page - 1)}
          disabled={disabled || page <= 1}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => go(page + 1)}
          disabled={disabled || page >= totalPages}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function ModerationResolveDialog({ open, event, notes, busy, onNotesChange, onClose, onConfirm }) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={busy ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/30" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title className="text-lg font-semibold text-slate-900">Resolve moderation event</Dialog.Title>
                {event ? (
                  <p className="mt-2 text-sm text-slate-600">
                    Channel <span className="font-semibold text-slate-800">#{event.channelSlug}</span> •{' '}
                    <span className="capitalize">{event.severity}</span> severity • {event.reason}
                  </p>
                ) : null}
                <div className="mt-4">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500" htmlFor="moderation-notes">
                    Resolution notes
                  </label>
                  <textarea
                    id="moderation-notes"
                    value={notes}
                    onChange={(eventNotes) => onNotesChange(eventNotes.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-100"
                    placeholder="Summarise what action you took and why."
                  />
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onConfirm}
                    disabled={busy}
                    className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {busy ? 'Resolving…' : 'Mark resolved'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={busy}
                    className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function AdminModerationDashboardPage() {
  const { session } = useSession();
  const [overview, setOverview] = useState(null);
  const [queueResponse, setQueueResponse] = useState({ items: [], pagination: { page: 1, totalPages: 1 } });
  const [eventsResponse, setEventsResponse] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [flashMessage, setFlashMessage] = useState(null);
  const [resolveDialog, setResolveDialog] = useState({ open: false, event: null, notes: '' });
  const [resolveBusy, setResolveBusy] = useState(false);

  const queueItems = queueResponse?.items ?? [];
  const queuePagination = queueResponse?.pagination ?? { page: 1, totalPages: 1 };

  const loadOverview = useCallback(async () => {
    try {
      setOverviewLoading(true);
      const data = await fetchModerationOverview();
      setOverview(data ?? null);
    } catch (err) {
      setError(err);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const loadQueue = useCallback(async () => {
    try {
      setQueueLoading(true);
      const params = {
        page,
        pageSize: 25,
      };
      if (Array.isArray(filters.severities) && filters.severities.length) {
        params.severities = filters.severities.join(',');
      }
      if (Array.isArray(filters.status) && filters.status.length) {
        params.status = filters.status.join(',');
      }
      if (filters.search) {
        params.search = filters.search.trim();
      }
      const response = await fetchModerationQueue(params);
      setQueueResponse(response ?? { items: [], pagination: { page: 1, totalPages: 1 } });
      setLastUpdated(new Date().toISOString());
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setQueueLoading(false);
    }
  }, [filters, page]);

  const loadEvents = useCallback(async () => {
    try {
      setEventsLoading(true);
      const response = await fetchModerationEvents({ status: 'resolved,dismissed', pageSize: 25 });
      setEventsResponse(response?.items ?? []);
    } catch (err) {
      setError((previous) => previous ?? err);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    loadOverview();
    loadQueue();
    loadEvents();
  }, [loadOverview, loadQueue, loadEvents]);

  useAdminAutoRefresh(handleRefresh, { interval: 60000 });

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!flashMessage) {
      return undefined;
    }
    const timeout = setTimeout(() => setFlashMessage(null), 4000);
    return () => clearTimeout(timeout);
  }, [flashMessage]);

  const handleMenuItemSelect = (itemId) => {
    switch (itemId) {
      case 'queue':
        scrollToSection('section-queue');
        break;
      case 'audit':
        scrollToSection('section-audit');
        break;
      case 'summary':
      default:
        scrollToSection('section-summary');
        break;
    }
  };

  const toggleSeverity = (severity) => {
    setFilters((current) => {
      const exists = current.severities.includes(severity);
      const next = exists ? current.severities.filter((entry) => entry !== severity) : [...current.severities, severity];
      return { ...current, severities: next };
    });
    setPage(1);
  };

  const toggleStatus = (status) => {
    setFilters((current) => {
      const exists = current.status.includes(status);
      const next = exists ? current.status.filter((entry) => entry !== status) : [...current.status, status];
      return { ...current, status: next };
    });
    setPage(1);
  };

  const handleSearchChange = (event) => {
    setFilters((current) => ({ ...current, search: event.target.value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const handleResolve = (event) => {
    setResolveDialog({ open: true, event, notes: '' });
  };

  const closeResolveDialog = () => {
    setResolveDialog({ open: false, event: null, notes: '' });
  };

  const confirmResolve = async () => {
    if (!resolveDialog.event) {
      return;
    }
    try {
      setResolveBusy(true);
      await resolveModerationEvent(resolveDialog.event.id, {
        resolution: {
          status: 'resolved',
          notes: resolveDialog.notes,
        },
      });
      setFlashMessage('Moderation event resolved.');
      closeResolveDialog();
      await loadQueue();
      await loadOverview();
      await loadEvents();
    } catch (err) {
      setFlashMessage(err?.message || 'Failed to resolve moderation event.');
    } finally {
      setResolveBusy(false);
    }
  };

  const severitySelection = useMemo(() => new Set(filters.severities.map((value) => value.toLowerCase())), [filters.severities]);
  const statusSelection = useMemo(() => new Set(filters.status.map((value) => value.toLowerCase())), [filters.status]);

  const isErrorFlash = typeof flashMessage === 'string' && flashMessage.toLowerCase().includes('fail');
  const flashTone = isErrorFlash
    ? 'bg-rose-100 text-rose-800 border-rose-200'
    : 'bg-emerald-100 text-emerald-800 border-emerald-200';

  const queueTotal = queuePagination?.totalItems ?? queuePagination?.total ?? queueItems.length;

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Moderation"
      subtitle="Community safety desk"
      description="Monitor community signals, review flagged conversations, and capture decision trails for compliance."
      menuSections={MENU_SECTIONS}
      activeMenuItem="summary"
      onMenuItemSelect={handleMenuItemSelect}
      session={session}
    >
      <div className="relative flex h-full flex-col gap-8 px-4 py-6 sm:px-6">
        {flashMessage ? (
          <div className={`pointer-events-none fixed right-6 top-6 z-30 max-w-sm rounded-2xl border px-4 py-3 text-sm font-semibold shadow-lg ${flashTone}`}>
            {flashMessage}
          </div>
        ) : null}

        <AdminGovernanceSection
          id="section-summary"
          kicker="Live moderation pulse"
          title="Moderation control tower"
          description="Tune severity and workflow filters to focus on the riskiest community conversations while automation keeps the low-signal items muted."
          meta={
            <DataStatus
              loading={overviewLoading || queueLoading}
              error={error}
              lastUpdated={lastUpdated}
              onRefresh={handleRefresh}
              statusLabel="Auto-refresh"
              fromCache={false}
            />
          }
          actions={
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              Reset filters
            </button>
          }
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Severity</span>
              {SEVERITY_OPTIONS.map((severity) => {
                const active = severitySelection.has(severity);
                return (
                  <button
                    key={severity}
                    type="button"
                    onClick={() => toggleSeverity(severity)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition ${
                      active
                        ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {severity}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</span>
              {STATUS_OPTIONS.map((status) => {
                const active = statusSelection.has(status);
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => toggleStatus(status)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize transition ${
                      active
                        ? 'border-emerald-500 bg-emerald-600 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
              <input
                type="search"
                value={filters.search}
                onChange={handleSearchChange}
                placeholder="Search reasons or notes"
                className="w-full min-w-[220px] rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-100 sm:w-auto"
              />
            </div>
          </div>
          <ModerationOverviewCards overview={overview} onSelect={() => scrollToSection('section-queue')} />
        </AdminGovernanceSection>

        <AdminGovernanceSection
          id="section-queue"
          kicker="Review queue"
          title="Flagged conversations"
          description="Work through the AI-prioritised review queue and record transparent decisions for future audits."
          meta={
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {queueTotal} {queueTotal === 1 ? 'case' : 'cases'} in view
            </span>
          }
        >
          <ModerationQueueTable items={queueItems} loading={queueLoading} onResolve={handleResolve} />
          <QueuePagination pagination={queuePagination} onPageChange={setPage} disabled={queueLoading} />
        </AdminGovernanceSection>

        <AdminGovernanceSection
          id="section-audit"
          kicker="Audit trail"
          title="Recent moderation activity"
          description="Escalations, resolutions, and dismissals stay on the record so compliance and trust partners can reconcile decisions."
          meta={eventsLoading ? <span className="text-xs text-slate-500">Refreshing…</span> : null}
        >
          <ModerationAuditTimeline events={eventsResponse} />
        </AdminGovernanceSection>
      </div>

      <ModerationResolveDialog
        open={resolveDialog.open}
        event={resolveDialog.event}
        notes={resolveDialog.notes}
        busy={resolveBusy}
        onNotesChange={(value) => setResolveDialog((current) => ({ ...current, notes: value }))}
        onClose={closeResolveDialog}
        onConfirm={confirmResolve}
      />
    </DashboardLayout>
  );
}

AdminModerationDashboardPage.propTypes = {};

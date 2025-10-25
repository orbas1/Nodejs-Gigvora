import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ArrowDownTrayIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import AdminGovernanceLayout from '../../../components/admin/AdminGovernanceLayout.jsx';
import AdminAuditLogDrawer from '../../../components/admin/AdminAuditLogDrawer.jsx';
import useSession from '../../../hooks/useSession.js';
import ModerationOverviewCards from '../../../components/admin/moderation/ModerationOverviewCards.jsx';
import ModerationQueueTable from '../../../components/admin/moderation/ModerationQueueTable.jsx';
import ModerationAuditTimeline from '../../../components/admin/moderation/ModerationAuditTimeline.jsx';
import {
  fetchModerationOverview,
  fetchModerationQueue,
  fetchModerationEvents,
  resolveModerationEvent,
} from '../../../services/moderation.js';
import { exportToCsv } from '../../../utils/exportUtils.js';

const MENU_CONFIG = [
  {
    label: 'Moderation',
    items: [
      {
        id: 'summary',
        name: 'Overview',
        sectionId: 'section-summary',
        requiredPermissions: ['admin:moderation', 'admin:trust'],
      },
      {
        id: 'queue',
        name: 'Review queue',
        sectionId: 'section-queue',
        requiredPermissions: ['admin:moderation'],
      },
      {
        id: 'audit',
        name: 'Audit trail',
        sectionId: 'section-audit',
        requiredPermissions: ['admin:moderation'],
      },
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

const SECTION_IDS = {
  summary: 'section-summary',
  queue: 'section-queue',
  audit: 'section-audit',
};

const SEVERITY_OPTIONS = ['critical', 'high', 'medium', 'low'];
const STATUS_OPTIONS = ['open', 'acknowledged', 'resolved', 'dismissed'];

const DEFAULT_FILTERS = {
  severities: ['critical', 'high', 'medium'],
  status: ['open', 'acknowledged'],
  search: '',
};

const MODERATION_CACHE_KEY = 'admin-moderation-snapshot';

function restoreModerationCache() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = window.sessionStorage.getItem(MODERATION_CACHE_KEY);
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored);
    return parsed ?? null;
  } catch (error) {
    return null;
  }
}

function persistModerationCache(snapshot) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(MODERATION_CACHE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    // Non-blocking persistence failure.
  }
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
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [queueResponse, setQueueResponse] = useState({ items: [], pagination: { page: 1, totalPages: 1 } });
  const [eventsResponse, setEventsResponse] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [statusMessage, setStatusMessage] = useState('Moderation queue streaming live updates.');
  const [resolveDialog, setResolveDialog] = useState({ open: false, event: null, notes: '' });
  const [resolveBusy, setResolveBusy] = useState(false);
  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);

  const queueItems = queueResponse?.items ?? [];
  const queuePagination = queueResponse?.pagination ?? { page: 1, totalPages: 1 };
  const initialQueueSync = useRef(true);

  const [fromCache, setFromCache] = useState(false);

  const loadOverview = useCallback(
    async ({ signal } = {}) => {
      setOverviewLoading(true);
      try {
        const data = await fetchModerationOverview({}, { signal });
        setOverview(data ?? null);
        setError('');
        setFromCache(false);
        return data ?? null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load moderation overview.';
        setError((previous) => previous || message);
        throw err;
      } finally {
        setOverviewLoading(false);
      }
    },
    [],
  );

  const loadQueue = useCallback(
    async ({ signal, pageOverride } = {}) => {
      setQueueLoading(true);
      try {
        const params = {
          page: pageOverride ?? page,
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
        const response = await fetchModerationQueue(params, { signal });
        const snapshot = response ?? { items: [], pagination: { page: params.page, totalPages: 1 } };
        setQueueResponse({
          items: snapshot.items ?? [],
          pagination: snapshot.pagination ?? { page: params.page, totalPages: 1 },
        });
        const now = new Date();
        setLastUpdated(now);
        setError('');
        setStatusMessage('Queue refreshed with live moderation events.');
        setFromCache(false);
        return snapshot;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load moderation queue.';
        setError(message);
        throw err;
      } finally {
        setQueueLoading(false);
      }
    },
    [filters, page],
  );

  const loadEvents = useCallback(
    async ({ signal } = {}) => {
      setEventsLoading(true);
      try {
        const response = await fetchModerationEvents({ status: 'resolved,dismissed', pageSize: 50 }, { signal });
        const events = Array.isArray(response?.items) ? response.items : Array.isArray(response) ? response : [];
        setEventsResponse(events);
        setError('');
        setFromCache(false);
        return events;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load moderation audit trail.';
        setError((previous) => previous || message);
        throw err;
      } finally {
        setEventsLoading(false);
      }
    },
    [],
  );

  const refreshAll = useCallback(
    async ({ signal } = {}) => {
      let hadError = false;
      await Promise.all([
        loadOverview({ signal }).catch(() => {
          hadError = true;
          return null;
        }),
        loadQueue({ signal }).catch(() => {
          hadError = true;
          return null;
        }),
        loadEvents({ signal }).catch(() => {
          hadError = true;
          return null;
        }),
      ]);
      if (hadError) {
        setStatusMessage('Loaded cached moderation snapshot. Retry to sync live data.');
      } else {
        setStatusMessage('Live moderation data synced successfully.');
      }
    },
    [loadEvents, loadOverview, loadQueue],
  );

  useEffect(() => {
    const cached = restoreModerationCache();
    if (cached) {
      setOverview(cached.overview ?? null);
      setQueueResponse(
        cached.queueResponse ?? {
          items: [],
          pagination: { page: 1, totalPages: 1 },
        },
      );
      setEventsResponse(cached.eventsResponse ?? []);
      if (cached.lastUpdated) {
        const cachedDate = new Date(cached.lastUpdated);
        if (!Number.isNaN(cachedDate.getTime())) {
          setLastUpdated(cachedDate);
        }
      }
      setStatusMessage('Showing cached moderation snapshot while syncing live data.');
      setFromCache(true);
    }
    const controller = new AbortController();
    refreshAll({ signal: controller.signal });
    return () => controller.abort();
  }, [refreshAll]);

  useEffect(() => {
    if (fromCache) {
      return;
    }
    if (!overview && !queueItems.length && !eventsResponse.length) {
      return;
    }
    const payload = {
      overview,
      queueResponse,
      eventsResponse,
      lastUpdated: lastUpdated instanceof Date ? lastUpdated.toISOString() : lastUpdated,
    };
    persistModerationCache(payload);
  }, [eventsResponse, fromCache, overview, queueItems.length, queueResponse, lastUpdated]);

  useEffect(() => {
    if (initialQueueSync.current) {
      initialQueueSync.current = false;
      return;
    }
    const controller = new AbortController();
    loadQueue({ signal: controller.signal }).catch(() => {});
    return () => controller.abort();
  }, [filters, page, loadQueue]);

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
        status: 'resolved',
        notes: resolveDialog.notes,
      });
      setStatusMessage('Moderation event resolved.');
      setError('');
      closeResolveDialog();
      await Promise.all([loadQueue(), loadOverview(), loadEvents()]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resolve moderation event.';
      setStatusMessage(message);
      setError(message);
    } finally {
      setResolveBusy(false);
    }
  };

  const severitySelection = useMemo(() => new Set(filters.severities.map((value) => value.toLowerCase())), [filters.severities]);
  const statusSelection = useMemo(() => new Set(filters.status.map((value) => value.toLowerCase())), [filters.status]);
  const handlePageChange = useCallback(
    (nextPage) => {
      setPage(nextPage);
      loadQueue({ pageOverride: nextPage }).catch(() => {});
    },
    [loadQueue],
  );

  const handleRefreshAll = useCallback(() => {
    refreshAll();
  }, [refreshAll]);

  const handleNavigate = useCallback((href) => navigate(href), [navigate]);

  const handleExportQueue = useCallback(() => {
    if (!queueItems.length) {
      setStatusMessage('No moderation events available to export.');
      return;
    }
    const timestamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
    exportToCsv({
      filename: `moderation-queue-${timestamp}.csv`,
      headers: [
        { key: 'id', label: 'Event ID' },
        { key: 'createdAt', label: 'Created' },
        { key: 'channelSlug', label: 'Channel' },
        { key: 'severity', label: 'Severity' },
        { key: 'status', label: 'Status' },
        { key: 'reason', label: 'Reason' },
        { key: 'signals', label: 'Signals' },
        { key: 'score', label: 'Score' },
      ],
      rows: queueItems.map((item) => ({
        id: item.id,
        createdAt: item.createdAt,
        channelSlug: item.channelSlug,
        severity: item.severity,
        status: item.status,
        reason: item.reason,
        signals: (item.metadata?.signals ?? []).map((signal) => signal.message || signal.code).join(' | '),
        score: item.metadata?.score ?? item.metadata?.moderationScore ?? '',
      })),
    });
    setStatusMessage('Exported moderation queue to CSV.');
  }, [queueItems]);

  const filterSummary = useMemo(() => {
    const severityLabel =
      filters.severities.length === SEVERITY_OPTIONS.length
        ? 'All severities'
        : filters.severities.length
          ? `Severity: ${filters.severities.join(', ')}`
          : 'No severities selected';
    const statusLabel =
      filters.status.length === STATUS_OPTIONS.length
        ? 'All statuses'
        : filters.status.length
          ? `Status: ${filters.status.join(', ')}`
          : 'No statuses selected';
    const searchLabel = filters.search ? `Search: “${filters.search}”` : null;
    return [severityLabel, statusLabel, searchLabel].filter(Boolean).join(' • ');
  }, [filters]);

  const statusContent = useMemo(
    () => (
      <div className="space-y-1 text-sm text-slate-600">
        <p>{statusMessage}</p>
        <p className="text-xs text-slate-500">{filterSummary}</p>
      </div>
    ),
    [filterSummary, statusMessage],
  );

  const headerActions = useMemo(
    () => [
      {
        label: 'Export queue CSV',
        onClick: handleExportQueue,
        variant: 'secondary',
        icon: ArrowDownTrayIcon,
        disabled: !queueItems.length,
        title: 'Download the current moderation queue',
      },
      {
        label: 'Open audit log',
        onClick: () => setAuditDrawerOpen(true),
        variant: 'primary',
        icon: ClipboardDocumentCheckIcon,
      },
    ],
    [handleExportQueue, queueItems.length],
  );

  const auditLogEntries = useMemo(
    () =>
      eventsResponse.map((event) => ({
        id: event.id,
        title: event.action?.replace(/_/g, ' ') ?? 'Moderation event',
        description: event.reason,
        actor: event.actorId ? `User #${event.actorId}` : 'System',
        timestamp: event.createdAt,
        metadata: {
          channel: event.channelSlug,
          severity: event.severity,
          status: event.status,
          resolutionNotes: event.metadata?.resolutionNotes,
        },
      })),
    [eventsResponse],
  );

  const scrollToQueue = useCallback(() => {
    const element = typeof document !== 'undefined' ? document.getElementById(SECTION_IDS.queue) : null;
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <Fragment>
      <AdminGovernanceLayout
        session={session}
        title="Moderation"
        subtitle="Community safety desk"
        description="Monitor community signals, review flagged conversations, and capture decision trails for compliance."
        menuConfig={MENU_CONFIG}
        sections={[
          { id: SECTION_IDS.summary, title: 'Overview' },
          { id: SECTION_IDS.queue, title: 'Review queue' },
          { id: SECTION_IDS.audit, title: 'Audit trail' },
        ]}
        statusLabel={fromCache ? 'Offline snapshot' : 'Trust & safety data'}
        fromCache={fromCache}
        statusChildren={statusContent}
        lastUpdated={lastUpdated}
        loading={overviewLoading || queueLoading || eventsLoading}
        error={error}
        onRefresh={handleRefreshAll}
        headerActions={headerActions}
        onNavigate={handleNavigate}
      >
        <section id={SECTION_IDS.summary} className="space-y-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-2">
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
              <div className="flex flex-wrap gap-2">
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
              </div>
              <input
                type="search"
                value={filters.search}
                onChange={handleSearchChange}
                placeholder="Search reasons or notes"
                className="w-full min-w-[220px] rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 shadow-inner focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-100 sm:w-auto"
              />
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
              >
                Reset
              </button>
            </div>
          </div>
          <ModerationOverviewCards overview={overview} onSelect={scrollToQueue} />
        </section>

        <section id={SECTION_IDS.queue} className="space-y-6">
          <ModerationQueueTable items={queueItems} loading={queueLoading} onResolve={handleResolve} />
          <QueuePagination pagination={queuePagination} onPageChange={handlePageChange} disabled={queueLoading} />
        </section>

        <section id={SECTION_IDS.audit} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent moderation activity</h2>
            {eventsLoading ? <span className="text-xs text-slate-500">Refreshing…</span> : null}
          </div>
          <ModerationAuditTimeline events={eventsResponse} />
        </section>
      </AdminGovernanceLayout>

      <ModerationResolveDialog
        open={resolveDialog.open}
        event={resolveDialog.event}
        notes={resolveDialog.notes}
        busy={resolveBusy}
        onNotesChange={(value) => setResolveDialog((current) => ({ ...current, notes: value }))}
        onClose={closeResolveDialog}
        onConfirm={confirmResolve}
      />

      <AdminAuditLogDrawer
        open={auditDrawerOpen}
        onClose={() => setAuditDrawerOpen(false)}
        logs={auditLogEntries}
        loading={eventsLoading}
        title="Moderation audit log"
        description="Review every decision captured across the moderation desks."
        emptyState="No moderation actions recorded yet."
      />
    </Fragment>
  );
}

AdminModerationDashboardPage.propTypes = {};

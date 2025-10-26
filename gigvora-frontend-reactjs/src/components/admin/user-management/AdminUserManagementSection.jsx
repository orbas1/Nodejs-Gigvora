import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  PauseCircleIcon,
  PlusIcon,
  ShieldExclamationIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import CreateUserWizard from './CreateUserWizard.jsx';
import UserManagementTable from '../admin-console/UserManagementTable.jsx';
import RoleAssignmentModal from '../admin-console/RoleAssignmentModal.jsx';
import * as adminUsers from '../../../services/adminUsers.js';

function SummaryTile({ label, value, caption, icon: Icon }) {
  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
      </div>
      <p className="text-sm text-slate-500">{caption}</p>
    </div>
  );
}

SummaryTile.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  caption: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
};

function ConfirmStatusDialog({ open, loading, status, user, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!open) {
      setReason('');
    }
  }, [open]);

  if (!open || !user) {
    return null;
  }

  const titleMap = {
    suspended: 'Suspend user',
    archived: 'Archive user',
    active: 'Reinstate user',
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => (loading ? null : onCancel?.())}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center px-4 py-10">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-white shadow-xl transition-all">
                <div className="space-y-6 p-8">
                  <div className="flex items-start gap-3">
                    <span className="rounded-2xl bg-amber-100 p-2 text-amber-600">
                      <ShieldExclamationIcon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div>
                      <Dialog.Title className="text-xl font-semibold text-slate-900">
                        {titleMap[status] ?? 'Update status'}
                      </Dialog.Title>
                      <p className="mt-2 text-sm text-slate-500">
                        {user.firstName} {user.lastName} • {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Reason (optional)
                      <textarea
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        rows={3}
                        className="rounded-3xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                    <p className="text-xs text-slate-500">
                      The user will be notified and the action will be logged in the audit trail.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onCancel}
                      className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => onConfirm?.({ status, reason })}
                      className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? 'Updating…' : 'Confirm'}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

ConfirmStatusDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  loading: PropTypes.bool,
  status: PropTypes.string.isRequired,
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
  }),
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
};

ConfirmStatusDialog.defaultProps = {
  loading: false,
  user: null,
  onConfirm: undefined,
  onCancel: undefined,
};

export default function AdminUserManagementSection() {
  const [directory, setDirectory] = useState({ items: [], summary: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardMetadata, setWizardMetadata] = useState(null);
  const [metadataStatus, setMetadataStatus] = useState('idle');
  const [filters, setFilters] = useState({ search: '', status: 'all', role: 'all', risk: 'all' });
  const [sort, setSort] = useState({ field: 'activity', direction: 'desc' });
  const [pagination, setPagination] = useState({ offset: 0, limit: 25, total: 0 });
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [roleModalState, setRoleModalState] = useState({ open: false, user: null, saving: false });
  const [confirmState, setConfirmState] = useState({ open: false, user: null, status: 'active', loading: false });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!feedback && !error) return undefined;
    const timeout = setTimeout(() => {
      setFeedback('');
      setError('');
    }, 4000);
    return () => clearTimeout(timeout);
  }, [feedback, error]);

  const loadDirectory = useCallback(
    async (options = {}) => {
      const limit = options.limit ?? pagination.limit ?? 25;
      const offset = options.offset ?? (options.page != null ? (options.page - 1) * limit : 0);
      const page = options.page ?? Math.floor(offset / limit) + 1;

      setLoading(true);
      setError('');
      try {
        const response = await adminUsers.fetchDirectory(
          {
            status: filters.status !== 'all' ? filters.status : undefined,
            role: filters.role !== 'all' ? filters.role : undefined,
            risk: filters.risk !== 'all' ? filters.risk : undefined,
            search: filters.search || undefined,
            sort: `${sort.field}:${sort.direction}`,
            page,
            pageSize: limit,
          },
          { forceRefresh: options.forceRefresh ?? false },
        );
        const items = Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response?.data)
            ? response.data
            : [];
        const total = response?.summary?.total ?? response?.total ?? response?.count ?? items.length;
        setDirectory({ items, summary: response?.summary ?? null });
        setPagination({ offset, limit, total });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load users.');
        setDirectory({ items: [], summary: null });
        setPagination((current) => ({ ...current, total: 0 }));
      } finally {
        setLoading(false);
      }
    },
    [filters, sort, pagination.limit],
  );

  const loadMetadata = useCallback(
    async (force = false) => {
      let shouldFetch = true;
      setMetadataStatus((current) => {
        if (current === 'loading') {
          shouldFetch = false;
          return current;
        }
        if (!force && current === 'ready') {
          shouldFetch = false;
          return current;
        }
        return 'loading';
      });

      if (!shouldFetch) {
        return;
      }

      try {
        const response = await adminUsers.fetchMetadata();
        setWizardMetadata(response ?? null);
        setMetadataStatus('ready');
      } catch (metadataError) {
        setMetadataStatus('error');
        setError((currentError) =>
          currentError ||
          (metadataError instanceof Error
            ? metadataError.message
            : 'Unable to load user metadata. Defaults applied.'),
        );
      }
    },
    [],
  );

  useEffect(() => {
    setSelectedUserIds([]);
    loadDirectory({ offset: 0 });
  }, [loadDirectory]);

  useEffect(() => {
    if (wizardOpen && metadataStatus === 'idle') {
      loadMetadata();
    }
  }, [wizardOpen, metadataStatus, loadMetadata]);

  const summaryMetrics = useMemo(() => {
    const summary = directory.summary ?? {};
    const counts = summary.counts ?? {};
    return [
      {
        label: 'Active',
        value: counts.active ?? summary.active ?? 0,
        caption: 'Active workspace members across all roles.',
        icon: CheckCircleIcon,
      },
      {
        label: 'Invited',
        value: counts.invited ?? summary.invited ?? 0,
        caption: 'Awaiting onboarding or email confirmation.',
        icon: UserGroupIcon,
      },
      {
        label: 'Suspended',
        value: counts.suspended ?? summary.suspended ?? 0,
        caption: 'Temporarily restricted accounts pending review.',
        icon: PauseCircleIcon,
      },
    ];
  }, [directory.summary]);

  const handleCreateUser = async (payload) => {
    await adminUsers.createUser(payload);
    setFeedback('User created and invited successfully.');
    setWizardOpen(false);
    loadDirectory({ offset: 0, forceRefresh: true });
  };

  const handleWizardOpen = () => {
    setWizardOpen(true);
    if (metadataStatus === 'error') {
      loadMetadata(true);
    }
  };

  const handleWizardClose = () => {
    setWizardOpen(false);
  };

  const handleFiltersChange = useCallback((nextFilters) => {
    setFilters((current) => ({ ...current, ...(nextFilters ?? {}) }));
  }, []);

  const handleSortChange = useCallback((nextSort) => {
    if (!nextSort) return;
    setSort((current) => ({
      field: nextSort.field ?? current.field,
      direction: nextSort.direction ?? current.direction,
    }));
  }, []);

  const handleSelectionChange = useCallback((ids = []) => {
    setSelectedUserIds(ids.map(String));
  }, []);

  const handlePageChange = useCallback(
    ({ offset }) => {
      if (typeof offset !== 'number') {
        return;
      }
      loadDirectory({ offset });
    },
    [loadDirectory],
  );

  const handleApplySegment = useCallback(
    (segment) => {
      if (!segment) return;
      setFeedback(`Applied segment: ${segment.label}`);
    },
    [],
  );

  const handleExport = useCallback(() => {
    if (typeof window === 'undefined' || exporting) {
      return;
    }
    try {
      setExporting(true);
      const headers = ['Name', 'Email', 'Status', 'Roles', 'Risk', 'Last seen'];
      const rows = directory.items.map((user) => {
        const name = user.name ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
        const lastSeen = user.lastSeenAt ?? user.lastLoginAt ?? user.updatedAt ?? user.createdAt ?? '';
        return [
          name,
          user.email ?? '',
          user.status ?? '',
          (user.roles ?? []).join('; '),
          user.riskLevel ?? user.risk ?? '',
          lastSeen ? new Date(lastSeen).toISOString() : '',
        ]
          .map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`)
          .join(',');
      });
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'gigvora-admin-users.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setFeedback('Export generated successfully.');
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Unable to export directory.');
    } finally {
      setExporting(false);
    }
  }, [directory.items, exporting]);

  const handleBulkAction = useCallback(
    async (action) => {
      if (!selectedUserIds.length) {
        return;
      }
      try {
        const status =
          action === 'activate' ? 'active' : action === 'suspend' ? 'suspended' : action === 'archive' ? 'archived' : null;
        if (!status) {
          return;
        }
        setLoading(true);
        await Promise.all(
          selectedUserIds.map((identifier) =>
            adminUsers.updateStatus(identifier, {
              status,
              reason: `${action} from admin command center`,
            }),
          ),
        );
        setFeedback(`Updated ${selectedUserIds.length} users.`);
        setSelectedUserIds([]);
        await loadDirectory({ offset: pagination.offset, forceRefresh: true });
      } catch (bulkError) {
        setError(bulkError instanceof Error ? bulkError.message : 'Unable to apply bulk action.');
      } finally {
        setLoading(false);
      }
    },
    [selectedUserIds, loadDirectory, pagination.offset],
  );

  const handleOpenStatus = (user, status) => {
    setConfirmState({ open: true, user, status, loading: false });
  };

  const handleOpenRoleModal = useCallback(
    (user) => {
      if (!user) {
        return;
      }
      setRoleModalState({ open: true, user, saving: false });
      if (metadataStatus === 'idle') {
        loadMetadata();
      } else if (metadataStatus === 'error') {
        loadMetadata(true);
      }
    },
    [metadataStatus, loadMetadata],
  );

  const handleCloseRoleModal = useCallback(() => {
    setRoleModalState({ open: false, user: null, saving: false });
  }, []);

  const handleRoleSubmit = useCallback(
    async (payload) => {
      if (!roleModalState.user?.id) {
        return;
      }
      try {
        setRoleModalState((current) => ({ ...current, saving: true }));
        await adminUsers.updateRoles(roleModalState.user.id, payload.roles);
        if (payload.notes) {
          await adminUsers.createNote(roleModalState.user.id, {
            body: payload.notes,
            visibility: 'internal',
            context: {
              type: 'role-assignment',
              primaryRole: payload.primaryRole,
              expiresAt: payload.expiresAt,
            },
          });
        }
        setFeedback(`Updated roles for ${roleModalState.user.firstName ?? roleModalState.user.email}.`);
        setRoleModalState({ open: false, user: null, saving: false });
        await loadDirectory({ offset: pagination.offset, forceRefresh: true });
      } catch (roleError) {
        setError(roleError instanceof Error ? roleError.message : 'Unable to update roles.');
        setRoleModalState({ open: false, user: null, saving: false });
      }
    },
    [roleModalState.user, loadDirectory, pagination.offset],
  );

  const handleInspectUser = useCallback(async (user) => {
    if (!user?.id) {
      return;
    }
    try {
      setFeedback(`Fetching details for ${user.firstName ?? user.email}…`);
      await adminUsers.fetchUser(user.id, { forceRefresh: true });
      setFeedback(`Detailed profile updated for ${user.firstName ?? user.email}.`);
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : 'Unable to load user detail.');
    }
  }, []);

  const handleConfirmStatus = async ({ status, reason }) => {
    const { user } = confirmState;
    if (!user?.id) return;
    setConfirmState((current) => ({ ...current, loading: true }));
    try {
      await adminUsers.updateStatus(user.id, { status, reason });
      setFeedback(`Updated status for ${user.firstName ?? user.email}.`);
      setConfirmState({ open: false, user: null, status: 'active', loading: false });
      loadDirectory({ offset: pagination.offset, forceRefresh: true });
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Unable to update status.');
      setConfirmState({ open: false, user: null, status: 'active', loading: false });
    }
  };

  const handleRefresh = () => {
    loadDirectory({ offset: pagination.offset, forceRefresh: true });
  };

  return (
    <section id="admin-users" className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">User management</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Directory snapshot</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-500">
            Monitor user lifecycle health and take quick actions without leaving the admin dashboard. The full console remains
            available for deep governance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-slate-300"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Refresh
          </button>
          <button
            type="button"
            onClick={handleWizardOpen}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" /> Create user
          </button>
        </div>
      </div>

      {feedback ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          {feedback}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">{error}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {summaryMetrics.map((metric) => (
          <SummaryTile key={metric.label} {...metric} />
        ))}
      </div>

      <UserManagementTable
        items={directory.items}
        loading={loading}
        error={error}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        sort={sort}
        onSortChange={handleSortChange}
        selectedIds={selectedUserIds}
        onSelectionChange={handleSelectionChange}
        onOpenRoleModal={handleOpenRoleModal}
        onInspectUser={handleInspectUser}
        onChangeStatus={handleOpenStatus}
        onExport={handleExport}
        pagination={pagination}
        onPageChange={handlePageChange}
        roleOptions={wizardMetadata?.roles ?? wizardMetadata?.availableRoles ?? []}
        segments={wizardMetadata?.segments ?? wizardMetadata?.savedSegments}
        onApplySegment={handleApplySegment}
        onBulkAction={handleBulkAction}
      />

      <CreateUserWizard
        open={wizardOpen}
        onClose={handleWizardClose}
        metadata={wizardMetadata}
        onSubmit={handleCreateUser}
      />

      <RoleAssignmentModal
        open={roleModalState.open}
        user={roleModalState.user}
        metadata={wizardMetadata}
        saving={roleModalState.saving}
        onClose={handleCloseRoleModal}
        onSubmit={handleRoleSubmit}
      />

      <ConfirmStatusDialog
        open={confirmState.open}
        loading={confirmState.loading}
        status={confirmState.status}
        user={confirmState.user}
        onCancel={() => setConfirmState({ open: false, user: null, status: 'active', loading: false })}
        onConfirm={handleConfirmStatus}
      />
    </section>
  );
}

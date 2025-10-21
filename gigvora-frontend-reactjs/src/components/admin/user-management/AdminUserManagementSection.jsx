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
import * as adminUsers from '../../../services/adminUsers.js';

const STATUS_BADGES = {
  active: 'bg-emerald-100 text-emerald-700',
  invited: 'bg-blue-100 text-blue-700',
  suspended: 'bg-amber-100 text-amber-700',
  archived: 'bg-slate-200 text-slate-600',
};

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
  const [confirmState, setConfirmState] = useState({ open: false, user: null, status: 'active', loading: false });

  useEffect(() => {
    if (!feedback && !error) return undefined;
    const timeout = setTimeout(() => {
      setFeedback('');
      setError('');
    }, 4000);
    return () => clearTimeout(timeout);
  }, [feedback, error]);

  const loadDirectory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminUsers.fetchDirectory({ limit: 5, offset: 0, sort: 'recent' });
      const items = Array.isArray(response?.items) ? response.items : Array.isArray(response?.data) ? response.data : [];
      setDirectory({ items, summary: response?.summary ?? null });
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load users.');
      setDirectory({ items: [], summary: null });
    } finally {
      setLoading(false);
    }
  }, []);

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
    loadDirectory();
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
    loadDirectory();
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

  const handleOpenStatus = (user, status) => {
    setConfirmState({ open: true, user, status, loading: false });
  };

  const handleConfirmStatus = async ({ status, reason }) => {
    const { user } = confirmState;
    if (!user?.id) return;
    setConfirmState((current) => ({ ...current, loading: true }));
    try {
      await adminUsers.updateStatus(user.id, { status, reason });
      setFeedback(`Updated status for ${user.firstName ?? user.email}.`);
      setConfirmState({ open: false, user: null, status: 'active', loading: false });
      loadDirectory();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Unable to update status.');
      setConfirmState({ open: false, user: null, status: 'active', loading: false });
    }
  };

  const handleRefresh = () => {
    loadDirectory();
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

      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-blue-100/20">
        <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent users</h3>
        </div>
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">User</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Roles</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Joined</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                  Loading directory…
                </td>
              </tr>
            ) : directory.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                  No users found.
                </td>
              </tr>
            ) : (
              directory.items.map((user) => {
                const status = user.status ?? 'active';
                const badgeClass = STATUS_BADGES[status] ?? 'bg-slate-200 text-slate-600';
                const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—';
                return (
                  <tr key={user.id} className="hover:bg-blue-50/40">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">
                          {user.firstName} {user.lastName}
                        </span>
                        <span className="text-xs text-slate-500">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {(user.roles ?? []).slice(0, 4).map((role) => (
                          <span key={role} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClass}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{joined}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {status !== 'active' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenStatus(user, 'active')}
                            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 transition hover:border-emerald-300"
                          >
                            Reinstate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenStatus(user, 'suspended')}
                            className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 transition hover:border-amber-300"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenStatus(user, 'archived')}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300"
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <CreateUserWizard
        open={wizardOpen}
        onClose={handleWizardClose}
        metadata={wizardMetadata}
        onSubmit={handleCreateUser}
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

import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';
import clsx from 'clsx';
import DashboardLayout from '../../../layouts/DashboardLayout.jsx';
import DirectoryFilters from '../../../components/admin/user-management/DirectoryFilters.jsx';
import UserDirectoryTable from '../../../components/admin/user-management/UserDirectoryTable.jsx';
import UserDetailPanel from '../../../components/admin/user-management/UserDetailPanel.jsx';
import CreateUserWizard from '../../../components/admin/user-management/CreateUserWizard.jsx';
import * as adminUsers from '../../../services/adminUsers.js';
import useSession from '../../../hooks/useSession.js';

const MENU_SECTIONS = [
  {
    label: 'Users',
    items: [
      { name: 'Summary', sectionId: 'users-summary' },
      { name: 'List', sectionId: 'users-list' },
    ],
  },
  {
    label: 'Nav',
    items: [{ name: 'Admin', href: '/dashboard/admin' }],
  },
];

function defaultPagination(limit = 20, offset = 0, total = 0) {
  return { limit, offset, total };
}

export default function AdminUserManagementPage() {
  const { session } = useSession();
  const [metadata, setMetadata] = useState({ roles: [], statuses: [], memberships: [] });
  const [directory, setDirectory] = useState({ items: [], pagination: defaultPagination(), summary: null });
  const [filters, setFilters] = useState({ limit: 20, offset: 0 });
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [directoryError, setDirectoryError] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState('');

  useEffect(() => {
    let mounted = true;
    adminUsers
      .fetchMetadata()
      .then((data) => {
        if (!mounted) return;
        setMetadata({
          roles: Array.isArray(data?.roles) ? data.roles : [],
          statuses: Array.isArray(data?.statuses) ? data.statuses : [],
          memberships: Array.isArray(data?.memberships) ? data.memberships : [],
        });
      })
      .catch(() => {
        if (!mounted) return;
        setMetadata((prev) => ({ ...prev }));
      });
    return () => {
      mounted = false;
    };
  }, []);

  const loadDirectory = async (nextFilters = filters) => {
    setLoadingDirectory(true);
    setDirectoryError(null);
    try {
      const payload = await adminUsers.fetchDirectory(nextFilters);
      setDirectory({
        items: Array.isArray(payload?.items) ? payload.items : [],
        pagination: payload?.pagination ?? defaultPagination(nextFilters.limit, nextFilters.offset, 0),
        summary: payload?.summary ?? null,
      });
      if (!payload?.items?.some((item) => String(item.id) === String(selectedUserId))) {
        setSelectedUserId(null);
        setSelectedUser(null);
        setDetailOpen(false);
      }
    } catch (error) {
      setDirectoryError(error?.message ?? 'Unable to load users.');
      setDirectory({ items: [], pagination: defaultPagination(nextFilters.limit, nextFilters.offset, 0), summary: null });
    } finally {
      setLoadingDirectory(false);
    }
  };

  useEffect(() => {
    loadDirectory(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.limit, filters.offset, filters.status, filters.role, filters.membership, filters.search]);

  useEffect(() => {
    setSearchDraft(filters.search ?? '');
  }, [filters.search]);

  const loadUser = async (userId) => {
    if (!userId) {
      setSelectedUser(null);
      return;
    }
    setLoadingUser(true);
    try {
      const payload = await adminUsers.fetchUser(userId);
      setSelectedUser(payload);
    } catch (error) {
      setSelectedUser(null);
      setDirectoryError(error?.message ?? 'Unable to load user.');
    } finally {
      setLoadingUser(false);
    }
  };

  const handleSelectUser = (user) => {
    const userId = user?.id ?? null;
    setSelectedUserId(userId);
    if (userId == null) {
      setSelectedUser(null);
      setDetailOpen(false);
      return;
    }
    loadUser(userId).then(() => setDetailOpen(true));
  };

  const handleFiltersChange = (nextFilters) => {
    setFilters((prev) => ({
      limit: nextFilters.limit ?? prev.limit,
      offset: 0,
      status: nextFilters.status,
      role: nextFilters.role,
      membership: nextFilters.membership,
      search: nextFilters.search ?? prev.search,
    }));
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const value = searchDraft.trim();
    setFilters((prev) => ({
      ...prev,
      offset: 0,
      search: value || undefined,
    }));
  };

  const handleClearSearch = () => {
    setSearchDraft('');
    setFilters((prev) => ({ ...prev, offset: 0, search: undefined }));
  };

  const handlePageChange = ({ offset }) => {
    setFilters((prev) => ({ ...prev, offset }));
  };

  const handleRefresh = () => {
    loadDirectory(filters);
    if (selectedUserId) {
      loadUser(selectedUserId);
    }
  };

  const handleCreateUser = async (payload) => {
    const created = await adminUsers.createUser(payload);
    await loadDirectory(filters);
    if (created?.id) {
      setSelectedUserId(created.id);
      await loadUser(created.id);
      setDetailOpen(true);
    }
  };

  const updateFeedback = (key, message) => {
    setFeedback((prev) => ({ ...prev, [key]: message }));
    setTimeout(() => {
      setFeedback((prev) => ({ ...prev, [key]: null }));
    }, 4000);
  };

  const handleUpdateUser = async (payload) => {
    if (!selectedUserId) return;
    await adminUsers.updateUser(selectedUserId, payload);
    await loadUser(selectedUserId);
    updateFeedback('profile', 'Saved');
    await loadDirectory(filters);
  };

  const handleUpdateSecurity = async (payload) => {
    if (!selectedUserId) return;
    await adminUsers.updateSecurity(selectedUserId, payload);
    await loadUser(selectedUserId);
    updateFeedback('security', 'Security saved');
  };

  const handleUpdateStatus = async (payload) => {
    if (!selectedUserId) return;
    await adminUsers.updateStatus(selectedUserId, payload);
    await loadUser(selectedUserId);
    updateFeedback('status', 'Status saved');
    await loadDirectory(filters);
  };

  const handleUpdateRoles = async (roles) => {
    if (!selectedUserId) return;
    await adminUsers.updateRoles(selectedUserId, roles);
    await loadUser(selectedUserId);
    updateFeedback('roles', 'Roles saved');
  };

  const handleResetPassword = async () => {
    if (!selectedUserId) return null;
    return adminUsers.resetPassword(selectedUserId, { rotateSessions: true });
  };

  const handleCreateNote = async (payload) => {
    if (!selectedUserId) return;
    await adminUsers.createNote(selectedUserId, payload);
    await loadUser(selectedUserId);
  };

  const summaryCards = useMemo(() => {
    const summary = directory.summary;
    if (!summary) {
      return [];
    }
    const total = summary.total ?? 0;
    const active = summary.status?.active ?? 0;
    const twoFactorEnabled = summary.twoFactor?.enabled ?? 0;
    return [
      {
        title: 'Users',
        value: total,
        icon: UserGroupIcon,
        accent: 'bg-slate-900 text-white',
        detail: `${active} active`,
      },
      {
        title: 'Secure',
        value: twoFactorEnabled,
        icon: ShieldCheckIcon,
        accent: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        detail: `${Math.round(total ? (twoFactorEnabled / total) * 100 : 0)}% 2FA`,
      },
      {
        title: 'Roles',
        value: Object.keys(summary.roles ?? {}).length,
        icon: AdjustmentsHorizontalIcon,
        accent: 'bg-sky-50 text-sky-700 border border-sky-200',
        detail: 'Unique roles',
      },
    ];
  }, [directory.summary]);

  const activeFilters = useMemo(() => {
    const chips = [];
    if (filters.status) chips.push({ label: `Status: ${filters.status}` });
    if (filters.role) chips.push({ label: `Role: ${filters.role}` });
    if (filters.membership) chips.push({ label: `Type: ${filters.membership}` });
    if (filters.search) chips.push({ label: `Search: ${filters.search}` });
    return chips;
  }, [filters.status, filters.role, filters.membership, filters.search]);

  return (
    <DashboardLayout
      currentDashboard="admin"
      title="Users"
      subtitle=""
      description=""
      menuSections={MENU_SECTIONS}
      sections={[]}
      availableDashboards={['admin', 'user', 'freelancer', 'company', 'agency']}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-8">
        <section id="users-summary" className="space-y-6">
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 px-6 py-6 shadow-soft lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Users</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">{directory.summary?.total ?? 0} accounts</h2>
              <p className="text-sm text-slate-500">Signed in as {session?.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <form onSubmit={handleSearchSubmit} className="flex w-full min-w-[220px] flex-1 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-inner lg:w-auto">
                <input
                  type="search"
                  value={searchDraft}
                  onChange={(event) => setSearchDraft(event.target.value)}
                  placeholder="Search"
                  className="w-full border-none bg-transparent text-sm text-slate-700 focus:outline-none"
                />
                {searchDraft && (
                  <button type="button" onClick={handleClearSearch} className="text-xs text-slate-400 hover:text-slate-600">
                    Clear
                  </button>
                )}
                <button type="submit" className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white">
                  Go
                </button>
              </form>
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" aria-hidden="true" /> Filters
              </button>
              <button
                type="button"
                onClick={() => setWizardOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                <PlusIcon className="h-4 w-4" aria-hidden="true" /> Add
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900"
              >
                <ArrowPathIcon className={clsx('h-4 w-4', loadingDirectory && 'animate-spin')} aria-hidden="true" /> Refresh
              </button>
            </div>
          </div>

          {summaryCards.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {summaryCards.map((card) => (
                <div key={card.title} className={clsx('rounded-3xl border border-transparent p-5 shadow-soft', card.accent)}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide opacity-70">{card.title}</p>
                      <p className="mt-2 text-3xl font-semibold">{card.value}</p>
                    </div>
                    {card.icon && <card.icon className="h-8 w-8 opacity-70" aria-hidden="true" />}
                  </div>
                  <p className="mt-3 text-xs opacity-70">{card.detail}</p>
                </div>
              ))}
            </div>
          )}

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {activeFilters.map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600"
                >
                  {chip.label}
                </span>
              ))}
            </div>
          )}

          {directoryError && <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{directoryError}</p>}
        </section>

        <section id="users-list" className="flex flex-col gap-6">
          <UserDirectoryTable
            items={directory.items}
            selectedUserId={selectedUserId}
            onSelect={handleSelectUser}
            loading={loadingDirectory}
            pagination={directory.pagination}
            onPageChange={handlePageChange}
          />
        </section>
      </div>

      <DirectoryFilters
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        metadata={metadata}
        onChange={handleFiltersChange}
        onRefresh={handleRefresh}
        loading={loadingDirectory}
      />

      <CreateUserWizard open={wizardOpen} onClose={() => setWizardOpen(false)} metadata={metadata} onSubmit={handleCreateUser} />

      <Transition.Root show={detailOpen} as={Fragment}>
        <Dialog as="div" className="relative z-20" onClose={setDetailOpen}>
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

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 flex max-w-full justify-end">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-200"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-150"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="w-screen max-w-4xl">
                  <div className="flex h-full flex-col bg-slate-50 p-4 sm:p-6">
                    <UserDetailPanel
                      user={selectedUser}
                      metadata={metadata}
                      loading={loadingUser}
                      onUpdate={handleUpdateUser}
                      onUpdateSecurity={handleUpdateSecurity}
                      onUpdateStatus={handleUpdateStatus}
                      onUpdateRoles={handleUpdateRoles}
                      onResetPassword={handleResetPassword}
                      onCreateNote={handleCreateNote}
                      feedback={feedback}
                      onClose={() => setDetailOpen(false)}
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </DashboardLayout>
  );
}


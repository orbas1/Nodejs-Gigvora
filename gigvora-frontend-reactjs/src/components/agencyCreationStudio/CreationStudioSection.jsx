import { Fragment, useCallback, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  ArrowTopRightOnSquareIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  Squares2X2Icon,
  TableCellsIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import CreationItemForm from './CreationItemForm.jsx';
import useCachedResource from '../../hooks/useCachedResource.js';
import {
  createCreationStudioItem,
  deleteCreationStudioItem,
  fetchCreationStudioOverview,
  updateCreationStudioItem,
} from '../../services/agencyCreationStudio.js';

const BUILDER_ROUTES = {
  project: '/projects/new',
  gig: '/gigs',
  job: '/jobs',
  launchpad_job: '/experience-launchpad/jobs',
  launchpad_project: '/experience-launchpad/projects',
  volunteer_opportunity: '/volunteering',
  networking_session: '/dashboard/company/networking',
  blog_post: '/blog',
  group: '/groups',
  page: '/pages',
  ad: '/dashboard/agency/ads',
};

const STATUS_BADGES = {
  draft: 'bg-slate-100 text-slate-700',
  in_review: 'bg-amber-100 text-amber-700',
  scheduled: 'bg-sky-100 text-sky-700',
  published: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-200 text-slate-600',
};

const PRIORITY_PIPS = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  urgent: 'bg-rose-500',
};

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function CreationStudioSection() {
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('board');
  const [filters, setFilters] = useState({ targetType: 'all', status: 'all', search: '' });
  const [detailItem, setDetailItem] = useState(null);
  const [formItem, setFormItem] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const cacheKey = useMemo(() => {
    const normalisedSearch = filters.search.trim().toLowerCase();
    return `agency-creation:${viewMode}:${page}:${filters.targetType}:${filters.status}:${normalisedSearch}`;
  }, [filters.search, filters.status, filters.targetType, page, viewMode]);

  const fetcher = useCallback(
    ({ signal }) =>
      fetchCreationStudioOverview(
        {
          page,
          pageSize: viewMode === 'board' ? 9 : 15,
          targetType: filters.targetType === 'all' ? undefined : filters.targetType,
          status: filters.status === 'all' ? undefined : filters.status,
          search: filters.search.trim() || undefined,
        },
        { signal },
      ).then((response) => response.data),
    [filters.search, filters.status, filters.targetType, page, viewMode],
  );

  const resource = useCachedResource(cacheKey, fetcher, {
    ttl: 60,
    dependencies: [cacheKey],
  });

  const data = resource.data ?? null;
  const summary = data?.summary ?? null;
  const items = data?.items?.data ?? [];
  const pagination = data?.items?.pagination ?? { page: 1, pageSize: viewMode === 'board' ? 9 : 15, totalItems: items.length, totalPages: 1 };
  const config = data?.config ?? { targetTypes: [], statuses: [], priorities: [], visibilities: [] };

  const typeFilterOptions = useMemo(() => [{ value: 'all', label: 'All' }, ...(config.targetTypes ?? [])], [config.targetTypes]);
  const statusFilterOptions = useMemo(() => [{ value: 'all', label: 'All' }, ...(config.statuses ?? [])], [config.statuses]);

  const metrics = useMemo(() => {
    if (!summary) {
      return [];
    }
    return [
      { label: 'Active', value: summary.totalItems ?? 0 },
      { label: 'Backlog', value: summary.backlogCount ?? 0 },
      { label: 'Ready', value: summary.readyToPublishCount ?? 0 },
    ];
  }, [summary]);

  const upcoming = summary?.upcomingLaunches ?? [];

  const openCreate = () => {
    setFormItem(null);
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setFormItem(item);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormItem(null);
  };

  const handleSubmit = async (payload) => {
    setBusy(true);
    try {
      if (formItem?.id) {
        await updateCreationStudioItem(formItem.id, payload);
      } else {
        await createCreationStudioItem(payload);
      }
      await resource.refresh({ force: true });
      closeForm();
    } catch (error) {
      console.error('Failed to save creation item', error);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!detailItem?.id) {
      return;
    }
    setBusy(true);
    try {
      await deleteCreationStudioItem(detailItem.id);
      await resource.refresh({ force: true });
      setConfirmDelete(false);
      setDetailItem(null);
    } catch (error) {
      console.error('Failed to delete creation item', error);
    } finally {
      setBusy(false);
    }
  };

  const clearFilters = () => {
    setFilters({ targetType: 'all', status: 'all', search: '' });
    setPage(1);
  };

  return (
    <section id="creation-studio" className="w-full">
      <div className="rounded-3xl border border-slate-200 bg-white shadow-soft">
        <div className="flex flex-col gap-6 border-b border-slate-200 px-8 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Create</p>
            <h2 className="text-2xl font-semibold text-slate-900">Creation studio</h2>
            <div className="flex flex-wrap gap-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  <span className="text-slate-900">{metric.value}</span>
                  {metric.label}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center overflow-hidden rounded-full border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold ${
                  viewMode === 'board' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Squares2X2Icon className="h-4 w-4" />
                Board
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold ${
                  viewMode === 'table' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableCellsIcon className="h-4 w-4" />
                Table
              </button>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accentDark"
            >
              <PlusIcon className="h-4 w-4" />
              New
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-b border-slate-200 px-8 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">
              <FunnelIcon className="h-4 w-4 text-slate-400" />
              Filters
            </div>
            <select
              value={filters.targetType}
              onChange={(event) => {
                setFilters((prev) => ({ ...prev, targetType: event.target.value }));
                setPage(1);
              }}
              className="rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:border-accent focus:outline-none"
            >
              {typeFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(event) => {
                setFilters((prev) => ({ ...prev, status: event.target.value }));
                setPage(1);
              }}
              className="rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:border-accent focus:outline-none"
            >
              {statusFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-slate-500 transition hover:text-slate-800"
            >
              Reset
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-600">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => {
                setFilters((prev) => ({ ...prev, search: event.target.value }));
                setPage(1);
              }}
              placeholder="Search titles"
              className="w-40 border-none bg-transparent text-xs text-slate-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="px-8 py-6">
          {resource.error && !resource.loading && (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              Something went wrong while loading the creation studio. Please retry.
            </div>
          )}

          {resource.loading && (
            <div className="flex h-40 items-center justify-center text-sm text-slate-500">Loading…</div>
          )}

          {!resource.loading && items.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 py-16 text-center">
              <p className="text-sm font-medium text-slate-700">No items yet</p>
              <p className="max-w-sm text-xs text-slate-500">Create your first project, gig, job, or campaign to populate the board.</p>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
              >
                <PlusIcon className="h-4 w-4" />
                Start now
              </button>
            </div>
          )}

          {!resource.loading && items.length > 0 && viewMode === 'board' && (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => {
                const statusBadge = STATUS_BADGES[item.status] ?? STATUS_BADGES.draft;
                const priorityTone = PRIORITY_PIPS[item.priority] ?? PRIORITY_PIPS.medium;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDetailItem(item)}
                    className="group flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-1 hover:border-accent/60 hover:bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusBadge}`}>{item.statusLabel ?? item.status}</span>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                        <span className={`h-2 w-2 rounded-full ${priorityTone}`} />
                        {item.priority?.toUpperCase()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                    <p className="line-clamp-3 text-sm text-slate-600">{item.summary || 'No summary yet.'}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{item.targetLabel ?? item.targetType}</span>
                      <span>{formatDate(item.launchDate)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!resource.loading && items.length > 0 && viewMode === 'table' && (
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Launch</th>
                    <th className="px-4 py-3 text-left">Updated</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {items.map((item) => (
                    <tr key={item.id} className="text-sm text-slate-600">
                      <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                      <td className="px-4 py-3">{item.targetLabel ?? item.targetType}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${STATUS_BADGES[item.status] ?? STATUS_BADGES.draft}`}>
                          {item.statusLabel ?? item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{formatDate(item.launchDate)}</td>
                      <td className="px-4 py-3">{formatDate(item.updatedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setDetailItem(item)}
                            className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:border-slate-300"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:border-slate-300"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="mt-8 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming launches</p>
              <div className="grid gap-3 md:grid-cols-2">
                {upcoming.map((launch) => (
                  <div key={launch.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{launch.title}</p>
                      <p className="text-xs text-slate-500">{formatDate(launch.launchDate)} · {launch.statusLabel ?? launch.status}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${STATUS_BADGES[launch.status] ?? STATUS_BADGES.scheduled}`}>
                      {launch.targetLabel ?? launch.targetType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={pagination.page <= 1}
                className="rounded-full border border-slate-200 px-3 py-2 font-semibold text-slate-600 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-slate-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                disabled={pagination.page >= pagination.totalPages}
                className="rounded-full border border-slate-200 px-3 py-2 font-semibold text-slate-600 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      <Transition.Root show={Boolean(detailItem)} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={() => setDetailItem(null)}>
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
            <div className="flex min-h-full items-center justify-center p-6">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-4"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-4"
              >
                <Dialog.Panel className="w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-slate-900">{detailItem?.title}</Dialog.Title>
                      <p className="text-xs text-slate-500">{detailItem?.targetLabel ?? detailItem?.targetType}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setDetailItem(null);
                          openEdit(detailItem);
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 hover:border-slate-300"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 hover:border-rose-300"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-6 px-6 py-6 lg:grid-cols-[2fr_1fr]">
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600">{detailItem?.summary || 'No summary yet.'}</p>
                      {detailItem?.description && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                          {detailItem.description}
                        </div>
                      )}
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 p-4 text-xs text-slate-500">
                          <p className="text-[11px] font-semibold uppercase text-slate-400">Launch</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{formatDate(detailItem?.launchDate)}</p>
                          <p className="mt-2 text-[11px] text-slate-500">Status: {detailItem?.statusLabel ?? detailItem?.status}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 p-4 text-xs text-slate-500">
                          <p className="text-[11px] font-semibold uppercase text-slate-400">Contact</p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{detailItem?.contactEmail || 'Not set'}</p>
                          <p className="mt-2 text-[11px] text-slate-500">{detailItem?.contactPhone || '—'}</p>
                        </div>
                      </div>
                      {detailItem?.autoShareChannels?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Share</p>
                          <div className="flex flex-wrap gap-2">
                            {detailItem.autoShareChannels.map((channel) => (
                              <span key={channel} className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                                {channel.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {detailItem?.assets?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assets</p>
                          <div className="space-y-2">
                            {detailItem.assets.map((asset) => (
                              <a
                                key={asset.id ?? asset.url}
                                href={asset.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600 transition hover:border-accent/60 hover:text-accent"
                              >
                                <span>{asset.label}</span>
                                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Collaborators</p>
                        <div className="mt-3 space-y-3 text-sm text-slate-600">
                          {(detailItem?.collaborators ?? []).map((collaborator) => (
                            <div key={collaborator.id ?? collaborator.collaboratorEmail} className="rounded-xl border border-slate-200 px-3 py-2">
                              <p className="font-semibold text-slate-800">{collaborator.collaboratorName || collaborator.collaboratorEmail}</p>
                              <p className="text-xs text-slate-500">{collaborator.role}</p>
                            </div>
                          ))}
                          {(!detailItem?.collaborators || detailItem.collaborators.length === 0) && (
                            <p className="text-xs text-slate-500">No collaborators listed.</p>
                          )}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Audience</p>
                        <p className="mt-2 text-sm text-slate-600">{detailItem?.audience?.primary || 'Primary group not set.'}</p>
                        {detailItem?.audience?.secondary && (
                          <p className="text-xs text-slate-500">Secondary: {detailItem.audience.secondary}</p>
                        )}
                        {detailItem?.audience?.notes && <p className="mt-2 text-xs text-slate-500">{detailItem.audience.notes}</p>}
                      </div>
                      <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</p>
                        <div className="mt-3 flex flex-col gap-2">
                          <a
                            href={BUILDER_ROUTES[detailItem?.targetType] ?? '#'}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
                          >
                            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                            Open builder
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setFormItem({ ...detailItem, id: undefined });
                              setFormOpen(true);
                              setDetailItem(null);
                            }}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
                          >
                            Duplicate
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <Transition.Root show={formOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeForm}>
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
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-4"
                enterTo="opacity-100 translate-y-0"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-4"
              >
                <Dialog.Panel className="h-[85vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                  <CreationItemForm initialValue={formItem} config={config} busy={busy} onSubmit={handleSubmit} onCancel={closeForm} />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <Transition.Root show={confirmDelete} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setConfirmDelete}>
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
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                <Dialog.Title className="text-lg font-semibold text-slate-900">Delete item?</Dialog.Title>
                <p className="mt-2 text-sm text-slate-600">
                  This will remove “{detailItem?.title}” from the creation studio. You can always rebuild it later.
                </p>
                <div className="mt-6 flex justify-end gap-3 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-slate-600 hover:border-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleDelete}
                    className="rounded-full bg-rose-600 px-4 py-2 text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-rose-400"
                  >
                    Delete
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </section>
  );
}

export default CreationStudioSection;

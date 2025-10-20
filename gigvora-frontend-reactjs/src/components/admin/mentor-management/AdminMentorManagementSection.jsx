import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  EnvelopeIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import {
  listAdminMentors,
  fetchAdminMentorStats,
  createAdminMentor,
  updateAdminMentor,
  archiveAdminMentor,
  reactivateAdminMentor,
} from '../../../services/adminMentors.js';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'inactive', label: 'Inactive' },
];

function formatExpertise(expertise) {
  if (!Array.isArray(expertise)) {
    return [];
  }
  return expertise.filter(Boolean);
}

function SummaryCard({ title, value, caption }) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{caption}</p>
    </div>
  );
}

function MentorEditor({ open, submitting, defaults, onClose, onSubmit }) {
  const [form, setForm] = useState(() => ({
    firstName: defaults?.firstName ?? '',
    lastName: defaults?.lastName ?? '',
    email: defaults?.email ?? '',
    headline: defaults?.headline ?? '',
    expertise: formatExpertise(defaults?.expertise).join(', '),
    languages: formatExpertise(defaults?.languages).join(', '),
    timezone: defaults?.timezone ?? 'UTC',
    ratePerHour: defaults?.ratePerHour ?? '',
    availability: defaults?.availability ?? 'available',
    introVideoUrl: defaults?.introVideoUrl ?? '',
    avatarUrl: defaults?.avatarUrl ?? '',
    bio: defaults?.bio ?? '',
  }));

  useEffect(() => {
    if (!open) return;
    setForm({
      firstName: defaults?.firstName ?? '',
      lastName: defaults?.lastName ?? '',
      email: defaults?.email ?? '',
      headline: defaults?.headline ?? '',
      expertise: formatExpertise(defaults?.expertise).join(', '),
      languages: formatExpertise(defaults?.languages).join(', '),
      timezone: defaults?.timezone ?? 'UTC',
      ratePerHour: defaults?.ratePerHour ?? '',
      availability: defaults?.availability ?? 'available',
      introVideoUrl: defaults?.introVideoUrl ?? '',
      avatarUrl: defaults?.avatarUrl ?? '',
      bio: defaults?.bio ?? '',
    });
  }, [open, defaults?.id]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      expertise: form.expertise
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
      languages: form.languages
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
      ratePerHour: form.ratePerHour ? Number(form.ratePerHour) : null,
    };
    await onSubmit?.(payload);
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => (submitting ? null : onClose?.())}>
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
              <Dialog.Panel className="relative w-full max-w-3xl transform overflow-hidden rounded-3xl bg-white shadow-xl transition-all">
                <form onSubmit={handleSubmit} className="space-y-6 p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Dialog.Title className="text-xl font-semibold text-slate-900">
                        {defaults?.id ? 'Edit mentor' : 'Create mentor'}
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-slate-500">
                        Capture public details, onboarding metadata, and marketplace availability for this mentor.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:border-slate-300"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      First name
                      <input
                        required
                        value={form.firstName}
                        onChange={handleChange('firstName')}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-normal text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Last name
                      <input
                        required
                        value={form.lastName}
                        onChange={handleChange('lastName')}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-normal text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Email
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={handleChange('email')}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-normal text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Headline
                      <input
                        value={form.headline}
                        onChange={handleChange('headline')}
                        placeholder="Product strategist, Design leader"
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-normal text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Expertise tags
                      <input
                        value={form.expertise}
                        onChange={handleChange('expertise')}
                        placeholder="Growth, GTM, Leadership"
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-normal text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <span className="text-xs font-normal text-slate-500">Comma-separated. Displayed on mentor cards.</span>
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Languages
                      <input
                        value={form.languages}
                        onChange={handleChange('languages')}
                        placeholder="English, Spanish"
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-normal text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-3">
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Timezone
                      <input
                        value={form.timezone}
                        onChange={handleChange('timezone')}
                        placeholder="UTC"
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-normal text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Hourly rate
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-slate-400">$</span>
                        <input
                          value={form.ratePerHour}
                          onChange={handleChange('ratePerHour')}
                          type="number"
                          min="0"
                          step="1"
                          className="w-full rounded-2xl border border-slate-200 px-4 py-2 pl-8 text-sm font-normal text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        />
                      </div>
                      <span className="text-xs font-normal text-slate-500">Marketplace billing currency (USD).</span>
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Availability
                      <select
                        value={form.availability}
                        onChange={handleChange('availability')}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-normal text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="available">Available</option>
                        <option value="limited">Limited</option>
                        <option value="waitlist">Waitlist</option>
                      </select>
                    </label>
                  </div>

                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                    Bio
                    <textarea
                      value={form.bio}
                      onChange={handleChange('bio')}
                      rows={4}
                      className="rounded-3xl border border-slate-200 px-4 py-3 text-sm font-normal text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Intro video URL
                      <input
                        value={form.introVideoUrl}
                        onChange={handleChange('introVideoUrl')}
                        placeholder="https://loom.com/share/..."
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-normal text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Avatar URL
                      <input
                        value={form.avatarUrl}
                        onChange={handleChange('avatarUrl')}
                        placeholder="https://cdn.gigvora.com/avatars/..."
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-normal text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <ClipboardDocumentListIcon className="h-4 w-4" aria-hidden="true" />
                      {submitting ? 'Saving…' : 'Save mentor'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default function AdminMentorManagementSection() {
  const [mentors, setMentors] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, onboarding: 0, inactive: 0, averageRating: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', status: 'all' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, totalPages: 1, total: 0 });
  const [editorState, setEditorState] = useState({ open: false, submitting: false, mentor: null });
  const [statusMessage, setStatusMessage] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  useEffect(() => {
    if (!statusMessage && !error && !inviteMessage) return undefined;
    const timeout = setTimeout(() => {
      setStatusMessage('');
      setInviteMessage('');
      setError('');
    }, 4000);
    return () => clearTimeout(timeout);
  }, [statusMessage, error, inviteMessage]);

  const loadMentors = useCallback(
    async (nextFilters = filters, pageOverride) => {
      setLoading(true);
      try {
        const response = await listAdminMentors({
          search: nextFilters.search || undefined,
          status: nextFilters.status !== 'all' ? nextFilters.status : undefined,
          page: pageOverride ?? pagination.page ?? 1,
          pageSize: pagination.pageSize,
        });
        const items = Array.isArray(response?.items) ? response.items : Array.isArray(response?.data) ? response.data : [];
        setMentors(items);
        const pageData = response?.pagination ?? {};
        setPagination((current) => ({
          ...current,
          page: pageData.page ?? pageOverride ?? current.page,
          pageSize: pageData.pageSize ?? current.pageSize,
          totalPages: pageData.totalPages ?? pageData.pageCount ?? current.totalPages,
          total: pageData.total ?? pageData.count ?? items.length,
        }));
        setError('');
        return response;
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load mentors.');
        setMentors([]);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.page, pagination.pageSize],
  );

  const loadStats = useCallback(async () => {
    try {
      const response = await fetchAdminMentorStats();
      setStats({
        total: response?.total ?? response?.counts?.total ?? 0,
        active: response?.active ?? response?.counts?.active ?? 0,
        onboarding: response?.onboarding ?? response?.counts?.onboarding ?? 0,
        inactive: response?.inactive ?? response?.counts?.inactive ?? 0,
        averageRating: response?.averageRating ?? response?.avgRating ?? null,
      });
    } catch (statsError) {
      setStats((current) => ({ ...current }));
    }
  }, []);

  useEffect(() => {
    loadMentors(filters);
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadMentors({ ...filters }, 1);
  };

  const handleReset = () => {
    const reset = { search: '', status: 'all' };
    setFilters(reset);
    loadMentors(reset, 1);
  };

  const handlePageChange = (direction) => {
    const nextPage = Math.max(1, Math.min(pagination.totalPages || 1, pagination.page + direction));
    setPagination((current) => ({ ...current, page: nextPage }));
    loadMentors(filters, nextPage);
  };

  const openCreate = () => {
    setEditorState({ open: true, submitting: false, mentor: null });
  };

  const openEdit = (mentor) => {
    setEditorState({ open: true, submitting: false, mentor });
  };

  const closeEditor = () => {
    if (editorState.submitting) return;
    setEditorState({ open: false, submitting: false, mentor: null });
  };

  const handleSaveMentor = async (payload) => {
    setEditorState((current) => ({ ...current, submitting: true }));
    try {
      if (editorState.mentor?.id) {
        await updateAdminMentor(editorState.mentor.id, payload);
        setStatusMessage('Mentor updated successfully.');
      } else {
        await createAdminMentor(payload);
        setStatusMessage('Mentor created and queued for onboarding.');
      }
      setEditorState({ open: false, submitting: false, mentor: null });
      await Promise.all([loadMentors(filters), loadStats()]);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save mentor.');
      setEditorState((current) => ({ ...current, submitting: false }));
    }
  };

  const handleArchive = async (mentor) => {
    if (!mentor?.id) return;
    setEditorState((current) => ({ ...current, submitting: true }));
    try {
      await archiveAdminMentor(mentor.id);
      setStatusMessage(`Archived ${mentor.firstName} ${mentor.lastName}.`);
      await Promise.all([loadMentors(filters), loadStats()]);
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Unable to archive mentor.');
    } finally {
      setEditorState({ open: false, submitting: false, mentor: null });
    }
  };

  const handleReactivate = async (mentor) => {
    if (!mentor?.id) return;
    try {
      await reactivateAdminMentor(mentor.id);
      setInviteMessage(`${mentor.firstName} is active again.`);
      await Promise.all([loadMentors(filters), loadStats()]);
    } catch (activateError) {
      setError(activateError instanceof Error ? activateError.message : 'Unable to activate mentor.');
    }
  };

  const summaryCards = useMemo(() => {
    const ratingLabel = stats.averageRating ? `${Number(stats.averageRating).toFixed(2)} / 5.0` : '—';
    return [
      { title: 'Mentors', value: stats.total ?? 0, caption: 'Total mentors onboarded across the marketplace.' },
      { title: 'Active', value: stats.active ?? 0, caption: 'Currently receiving mentee bookings.' },
      { title: 'Onboarding', value: stats.onboarding ?? 0, caption: 'Completing verification and profile steps.' },
      { title: 'Inactive', value: stats.inactive ?? 0, caption: 'Suspended, archived, or unavailable mentors.' },
      { title: 'Avg rating', value: ratingLabel, caption: 'Weighted average of mentor feedback scores.' },
    ];
  }, [stats]);

  return (
    <section id="admin-mentors" className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Mentors management</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Marketplace mentors</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-500">
            Recruit, activate, and monitor Gigvora mentors with rich profiles, multimedia intros, and availability controls. Every
            change syncs to the public discovery surface instantly.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => loadMentors(filters)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-slate-300"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" /> New mentor
          </button>
        </div>
      </div>

      {statusMessage ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          {statusMessage}
        </div>
      ) : null}
      {inviteMessage ? (
        <div className="rounded-3xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700 shadow-sm">{inviteMessage}</div>
      ) : null}
      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">{error}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        {summaryCards.map((card) => (
          <SummaryCard key={card.title} title={card.title} value={card.value} caption={card.caption} />
        ))}
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-wrap items-end gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="flex flex-1 flex-col gap-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Search</label>
          <input
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search by name, email, expertise"
            className="rounded-[20px] border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Status</label>
          <div className="relative">
            <AdjustmentsHorizontalIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
            <select
              value={filters.status}
              onChange={(event) => {
                const nextStatus = event.target.value;
                const nextFilters = { ...filters, status: nextStatus };
                setFilters(nextFilters);
                loadMentors(nextFilters, 1);
              }}
              className="w-44 rounded-[20px] border border-slate-200 px-4 py-2 pl-9 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            Search
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300"
          >
            Reset
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-lg shadow-blue-100/20">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Mentor</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Expertise</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Rate</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Last session</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                  Loading mentors…
                </td>
              </tr>
            ) : mentors.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                  No mentors found.
                </td>
              </tr>
            ) : (
              mentors.map((mentor) => {
                const tags = formatExpertise(mentor.expertise);
                const lastSession = mentor.lastSessionAt ? new Date(mentor.lastSessionAt).toLocaleString() : '—';
                const statusLabel = mentor.status ?? mentor.lifecycleStatus ?? 'active';
                const statusStyles = {
                  active: 'bg-emerald-100 text-emerald-700',
                  onboarding: 'bg-sky-100 text-sky-700',
                  inactive: 'bg-slate-200 text-slate-600',
                  suspended: 'bg-amber-100 text-amber-700',
                }[statusLabel] || 'bg-slate-200 text-slate-600';

                return (
                  <tr key={mentor.id} className="hover:bg-blue-50/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {mentor.avatarUrl ? (
                          <img
                            src={mentor.avatarUrl}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover shadow-sm"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                            {`${mentor.firstName ?? ''}`.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {mentor.firstName} {mentor.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{mentor.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {tags.length ? (
                          tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {mentor.ratePerHour ? `$${mentor.ratePerHour}/h` : 'TBC'}
                      </p>
                      <p className="text-xs text-slate-500">{mentor.availability ?? 'available'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize', statusStyles)}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{lastSession}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(mentor)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300"
                        >
                          Edit
                        </button>
                        {statusLabel === 'inactive' ? (
                          <button
                            type="button"
                            onClick={() => handleReactivate(mentor)}
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 transition hover:border-emerald-300"
                          >
                            <PlayIcon className="h-4 w-4" aria-hidden="true" /> Activate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleArchive(mentor)}
                            className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 transition hover:border-amber-300"
                          >
                            <PauseIcon className="h-4 w-4" aria-hidden="true" /> Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-4 text-xs text-slate-500">
          <div>
            Page {pagination.page} of {pagination.totalPages || 1} • {pagination.total} mentors
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(-1)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(1)}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Onboarding checklist</h3>
          <p className="mt-2 text-sm text-slate-500">
            Keep mentors production ready with compliance, multimedia, and availability checks.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-3">
              <EnvelopeIcon className="mt-0.5 h-5 w-5 text-blue-500" aria-hidden="true" />
              Verify welcome email delivery and baseline onboarding documentation completion.
            </li>
            <li className="flex items-start gap-3">
              <VideoCameraIcon className="mt-0.5 h-5 w-5 text-blue-500" aria-hidden="true" />
              Encourage mentors to upload a 60–90 second Loom introducing their practice and focus areas.
            </li>
            <li className="flex items-start gap-3">
              <ClipboardDocumentListIcon className="mt-0.5 h-5 w-5 text-blue-500" aria-hidden="true" />
              Confirm identity verification, policies, and payout preferences are captured.
            </li>
          </ul>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg">
          <h3 className="text-base font-semibold">Quality guardrails</h3>
          <p className="mt-2 text-sm text-slate-300">
            Apply the Gigvora quality playbook before promoting mentors to featured status.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            <li>✔ Minimum of 5 verified testimonials with average rating above 4.7.</li>
            <li>✔ Response time under 12 hours across the last 30 days.</li>
            <li>✔ Availability blocks updated within the previous two weeks.</li>
          </ul>
        </div>
      </div>

      <MentorEditor
        open={editorState.open}
        submitting={editorState.submitting}
        defaults={editorState.mentor}
        onClose={closeEditor}
        onSubmit={handleSaveMentor}
      />
    </section>
  );
}

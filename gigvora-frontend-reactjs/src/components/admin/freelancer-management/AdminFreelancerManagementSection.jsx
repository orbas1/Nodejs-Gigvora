import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ClipboardDocumentListIcon,
  EnvelopeOpenIcon,
  ExclamationTriangleIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import {
  listAdminFreelancers,
  fetchAdminFreelancerStats,
  createAdminFreelancer,
  updateAdminFreelancer,
  archiveAdminFreelancer,
  reactivateAdminFreelancer,
  sendAdminFreelancerInvite,
} from '../../../services/adminFreelancers.js';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived', label: 'Archived' },
];

const SENIORITY_OPTIONS = ['junior', 'mid', 'senior', 'principal'];

function formatList(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(Boolean);
}

function FreelancerEditor({ open, submitting, defaults, onSubmit, onClose }) {
  const [form, setForm] = useState(() => ({
    firstName: defaults?.firstName ?? '',
    lastName: defaults?.lastName ?? '',
    email: defaults?.email ?? '',
    phone: defaults?.phone ?? '',
    location: defaults?.location ?? '',
    timezone: defaults?.timezone ?? 'UTC',
    hourlyRate: defaults?.hourlyRate ?? '',
    availability: defaults?.availability ?? 'immediate',
    seniority: defaults?.seniority ?? 'senior',
    skills: formatList(defaults?.skills).join(', '),
    industries: formatList(defaults?.industries).join(', '),
    portfolioUrl: defaults?.portfolioUrl ?? '',
    websiteUrl: defaults?.websiteUrl ?? '',
    status: defaults?.status ?? 'onboarding',
    verified: defaults?.verified ?? false,
    summary: defaults?.summary ?? '',
  }));

  useEffect(() => {
    if (!open) return;
    setForm({
      firstName: defaults?.firstName ?? '',
      lastName: defaults?.lastName ?? '',
      email: defaults?.email ?? '',
      phone: defaults?.phone ?? '',
      location: defaults?.location ?? '',
      timezone: defaults?.timezone ?? 'UTC',
      hourlyRate: defaults?.hourlyRate ?? '',
      availability: defaults?.availability ?? 'immediate',
      seniority: defaults?.seniority ?? 'senior',
      skills: formatList(defaults?.skills).join(', '),
      industries: formatList(defaults?.industries).join(', '),
      portfolioUrl: defaults?.portfolioUrl ?? '',
      websiteUrl: defaults?.websiteUrl ?? '',
      status: defaults?.status ?? 'onboarding',
      verified: defaults?.verified ?? false,
      summary: defaults?.summary ?? '',
    });
  }, [open, defaults?.id]);

  const handleChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : null,
      skills: form.skills
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
      industries: form.industries
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
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
                        {defaults?.id ? 'Edit freelancer' : 'Add freelancer'}
                      </Dialog.Title>
                      <p className="mt-1 text-sm text-slate-500">
                        Maintain freelancer records, verification status, and availability for the Gigvora marketplace.
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
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Last name
                      <input
                        required
                        value={form.lastName}
                        onChange={handleChange('lastName')}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Phone
                      <input
                        value={form.phone}
                        onChange={handleChange('phone')}
                        placeholder="+1 555 000 0000"
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-3">
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Location
                      <input
                        value={form.location}
                        onChange={handleChange('location')}
                        placeholder="Berlin, Germany"
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Timezone
                      <input
                        value={form.timezone}
                        onChange={handleChange('timezone')}
                        placeholder="Europe/Berlin"
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Seniority
                      <select
                        value={form.seniority}
                        onChange={handleChange('seniority')}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        {SENIORITY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-3">
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Hourly rate (USD)
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.hourlyRate}
                        onChange={handleChange('hourlyRate')}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Availability
                      <select
                        value={form.availability}
                        onChange={handleChange('availability')}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <option value="immediate">Immediate</option>
                        <option value="two_weeks">Within 2 weeks</option>
                        <option value="one_month">Within 1 month</option>
                        <option value="project">Project based</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Status
                      <select
                        value={form.status}
                        onChange={handleChange('status')}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        {STATUS_OPTIONS.filter((option) => option.value !== 'all').map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Skills
                      <input
                        value={form.skills}
                        onChange={handleChange('skills')}
                        placeholder="React, Node.js, GraphQL"
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                      <span className="text-xs font-normal text-slate-500">Comma-separated. Powers matching and discovery.</span>
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Industries
                      <input
                        value={form.industries}
                        onChange={handleChange('industries')}
                        placeholder="Fintech, SaaS, Climate"
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                  </div>

                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                    Summary
                    <textarea
                      value={form.summary}
                      onChange={handleChange('summary')}
                      rows={4}
                      className="rounded-3xl border border-slate-200 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </label>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Portfolio URL
                      <input
                        value={form.portfolioUrl}
                        onChange={handleChange('portfolioUrl')}
                        placeholder="https://portfolio.gigvora.com/"
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                      Website
                      <input
                        value={form.websiteUrl}
                        onChange={handleChange('websiteUrl')}
                        placeholder="https://freelancer.io"
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-3 rounded-3xl bg-slate-50 px-4 py-3">
                    <input
                      id="freelancer-verified"
                      type="checkbox"
                      checked={form.verified}
                      onChange={handleChange('verified')}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="freelancer-verified" className="text-sm font-medium text-slate-700">
                      Verified profile (ID & compliance checks complete)
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
                      {submitting ? 'Saving…' : 'Save freelancer'}
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

export default function AdminFreelancerManagementSection() {
  const [freelancers, setFreelancers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, verified: 0, invited: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', status: 'all' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, totalPages: 1, total: 0 });
  const [editorState, setEditorState] = useState({ open: false, submitting: false, freelancer: null });
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!feedback && !error) return undefined;
    const timeout = setTimeout(() => {
      setFeedback('');
      setError('');
    }, 4000);
    return () => clearTimeout(timeout);
  }, [feedback, error]);

  const loadFreelancers = useCallback(
    async (nextFilters = filters, pageOverride) => {
      setLoading(true);
      try {
        const response = await listAdminFreelancers({
          search: nextFilters.search || undefined,
          status: nextFilters.status !== 'all' ? nextFilters.status : undefined,
          page: pageOverride ?? pagination.page ?? 1,
          pageSize: pagination.pageSize,
        });
        const items = Array.isArray(response?.items) ? response.items : Array.isArray(response?.data) ? response.data : [];
        setFreelancers(items);
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
        setError(loadError instanceof Error ? loadError.message : 'Unable to load freelancers.');
        setFreelancers([]);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.page, pagination.pageSize],
  );

  const loadStats = useCallback(async () => {
    try {
      const response = await fetchAdminFreelancerStats();
      setStats({
        total: response?.total ?? response?.counts?.total ?? 0,
        active: response?.active ?? response?.counts?.active ?? 0,
        verified: response?.verified ?? response?.counts?.verified ?? 0,
        invited: response?.invited ?? response?.counts?.invited ?? 0,
        suspended: response?.suspended ?? response?.counts?.suspended ?? 0,
      });
    } catch (statsError) {
      setStats((current) => ({ ...current }));
    }
  }, []);

  useEffect(() => {
    loadFreelancers(filters);
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadFreelancers(filters, 1);
  };

  const handleReset = () => {
    const reset = { search: '', status: 'all' };
    setFilters(reset);
    loadFreelancers(reset, 1);
  };

  const handlePageChange = (direction) => {
    const nextPage = Math.max(1, Math.min(pagination.totalPages || 1, pagination.page + direction));
    setPagination((current) => ({ ...current, page: nextPage }));
    loadFreelancers(filters, nextPage);
  };

  const openCreate = () => setEditorState({ open: true, submitting: false, freelancer: null });
  const openEdit = (freelancer) => setEditorState({ open: true, submitting: false, freelancer });
  const closeEditor = () => {
    if (editorState.submitting) return;
    setEditorState({ open: false, submitting: false, freelancer: null });
  };

  const handleSave = async (payload) => {
    setEditorState((current) => ({ ...current, submitting: true }));
    try {
      if (editorState.freelancer?.id) {
        await updateAdminFreelancer(editorState.freelancer.id, payload);
        setFeedback('Freelancer updated successfully.');
      } else {
        await createAdminFreelancer(payload);
        setFeedback('Freelancer added and invited to activate their workspace.');
      }
      setEditorState({ open: false, submitting: false, freelancer: null });
      await Promise.all([loadFreelancers(filters), loadStats()]);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save freelancer.');
      setEditorState((current) => ({ ...current, submitting: false }));
    }
  };

  const handleArchive = async (freelancer) => {
    if (!freelancer?.id) return;
    try {
      await archiveAdminFreelancer(freelancer.id);
      setFeedback(`${freelancer.firstName} was archived.`);
      await Promise.all([loadFreelancers(filters), loadStats()]);
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : 'Unable to archive freelancer.');
    }
  };

  const handleReactivate = async (freelancer) => {
    if (!freelancer?.id) return;
    try {
      await reactivateAdminFreelancer(freelancer.id);
      setFeedback(`${freelancer.firstName} is active again.`);
      await Promise.all([loadFreelancers(filters), loadStats()]);
    } catch (activateError) {
      setError(activateError instanceof Error ? activateError.message : 'Unable to activate freelancer.');
    }
  };

  const handleInvite = async (freelancer) => {
    if (!freelancer?.id) return;
    try {
      await sendAdminFreelancerInvite(freelancer.id);
      setFeedback(`Invite re-sent to ${freelancer.email}.`);
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'Unable to send invite.');
    }
  };

  const summaryCards = useMemo(() => {
    return [
      { title: 'Freelancers', value: stats.total ?? 0, caption: 'Total profiles across the Gigvora network.' },
      { title: 'Active', value: stats.active ?? 0, caption: 'Ready for assignments and matched to gigs.' },
      { title: 'Verified', value: stats.verified ?? 0, caption: 'Completed ID, compliance, and payout checks.' },
      { title: 'Invited', value: stats.invited ?? 0, caption: 'Awaiting onboarding completion or acceptance.' },
      { title: 'Suspended', value: stats.suspended ?? 0, caption: 'Temporarily restricted pending review.' },
    ];
  }, [stats]);

  return (
    <section id="admin-freelancers" className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Freelancer management</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Talent roster</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-500">
            Curate and support the Gigvora freelancer community with full lifecycle controls, compliance visibility, and
            recruitment messaging.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => loadFreelancers(filters)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition hover:border-slate-300"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" /> New freelancer
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

      <div className="grid gap-4 lg:grid-cols-5">
        {summaryCards.map((card) => (
          <div key={card.title} className="rounded-[28px] border border-slate-200 bg-white/95 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{card.title}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.caption}</p>
          </div>
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
            placeholder="Search by name, email, skills"
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
                loadFreelancers(nextFilters, 1);
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
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Freelancer</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Skills</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Rate</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Verification</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                  Loading freelancers…
                </td>
              </tr>
            ) : freelancers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                  No freelancers found.
                </td>
              </tr>
            ) : (
              freelancers.map((freelancer) => {
                const skills = formatList(freelancer.skills);
                const statusLabel = freelancer.status ?? 'active';
                const statusStyles = {
                  active: 'bg-emerald-100 text-emerald-700',
                  onboarding: 'bg-sky-100 text-sky-700',
                  invited: 'bg-blue-100 text-blue-700',
                  suspended: 'bg-amber-100 text-amber-700',
                  archived: 'bg-slate-200 text-slate-600',
                }[statusLabel] || 'bg-slate-200 text-slate-600';

                return (
                  <tr key={freelancer.id} className="hover:bg-blue-50/40">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {freelancer.avatarUrl ? (
                          <img
                            src={freelancer.avatarUrl}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover shadow-sm"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                            {`${freelancer.firstName ?? ''}`.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {freelancer.firstName} {freelancer.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{freelancer.email}</p>
                          <p className="text-xs text-slate-400">{freelancer.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {skills.length ? (
                          skills.slice(0, 4).map((skill) => (
                            <span key={skill} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {freelancer.hourlyRate ? `$${freelancer.hourlyRate}/h` : 'Negotiable'}
                      </p>
                      <p className="text-xs text-slate-500">{freelancer.availability ?? 'immediate'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize', statusStyles)}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {freelancer.verified ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(freelancer)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300"
                        >
                          Edit
                        </button>
                        {statusLabel === 'archived' ? (
                          <button
                            type="button"
                            onClick={() => handleReactivate(freelancer)}
                            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 transition hover:border-emerald-300"
                          >
                            <PlayIcon className="h-4 w-4" aria-hidden="true" /> Activate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleArchive(freelancer)}
                            className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700 transition hover:border-amber-300"
                          >
                            <PauseIcon className="h-4 w-4" aria-hidden="true" /> Archive
                          </button>
                        )}
                        {statusLabel === 'invited' ? (
                          <button
                            type="button"
                            onClick={() => handleInvite(freelancer)}
                            className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700 transition hover:border-sky-300"
                          >
                            <EnvelopeOpenIcon className="h-4 w-4" aria-hidden="true" /> Resend
                          </button>
                        ) : null}
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
            Page {pagination.page} of {pagination.totalPages || 1} • {pagination.total} freelancers
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
          <h3 className="text-base font-semibold text-slate-900">Activation guardrails</h3>
          <p className="mt-2 text-sm text-slate-500">
            Require the following before enabling search visibility for new freelancers.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-3">
              <SparklesIcon className="mt-0.5 h-5 w-5 text-blue-500" aria-hidden="true" />
              Minimum 3 vetted portfolio items or case studies uploaded to the deliverable vault.
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheckIcon className="mt-0.5 h-5 w-5 text-blue-500" aria-hidden="true" />
              Identity verification & global sanctions screening complete.
            </li>
            <li className="flex items-start gap-3">
              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 text-blue-500" aria-hidden="true" />
              No outstanding disputes or unpaid invoices on linked company or agency engagements.
            </li>
          </ul>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-lg">
          <h3 className="text-base font-semibold">Nurture playbook</h3>
          <p className="mt-2 text-sm text-slate-300">
            Maintain freelancer quality and engagement with quarterly check-ins.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            <li>• Review rate competitiveness vs. market benchmarks.</li>
            <li>• Capture new testimonials and update success metrics.</li>
            <li>• Offer targeted learning modules aligned to gig demand.</li>
          </ul>
        </div>
      </div>

      <FreelancerEditor
        open={editorState.open}
        submitting={editorState.submitting}
        defaults={editorState.freelancer}
        onClose={closeEditor}
        onSubmit={handleSave}
      />
    </section>
  );
}

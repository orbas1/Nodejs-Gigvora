import { useMemo, useState } from 'react';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  UsersIcon,
  EnvelopeIcon,
  PhoneIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { APPLICATION_STATUSES } from './volunteeringOptions.js';

const STATUS_FILTERS = [{ value: 'all', label: 'All' }, ...APPLICATION_STATUSES];
const STATUS_LABEL = Object.fromEntries(APPLICATION_STATUSES.map((option) => [option.value, option.label]));

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

export default function VolunteeringPeopleWorkspace({
  applications = [],
  posts = [],
  busy = false,
  onCreateApplication,
  onSelectApplication,
  selectedApplicationId,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [postFilter, setPostFilter] = useState('all');
  const [form, setForm] = useState({
    postId: posts[0]?.id ?? '',
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    status: 'submitted',
  });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const uniquePosts = useMemo(() => {
    const entries = posts.map((post) => ({ value: post.id, label: post.title }));
    return entries;
  }, [posts]);

  const derivedTotals = useMemo(() => {
    const totals = applications.reduce(
      (acc, application) => {
        acc.total += 1;
        acc.byStatus[application.status] = (acc.byStatus[application.status] || 0) + 1;
        return acc;
      },
      { total: 0, byStatus: {} },
    );
    return totals;
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const term = search.trim().toLowerCase();
    return applications.filter((application) => {
      const matchesStatus = statusFilter === 'all' || application.status === statusFilter;
      const matchesPost =
        postFilter === 'all' || application.postId === postFilter || application.post?.id === postFilter;
      const matchesSearch =
        !term ||
        application.candidateName?.toLowerCase().includes(term) ||
        application.candidateEmail?.toLowerCase().includes(term) ||
        application.stage?.toLowerCase().includes(term);
      return matchesStatus && matchesPost && matchesSearch;
    });
  }, [applications, search, statusFilter, postFilter]);

  const handleFormChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.postId || !form.candidateName.trim()) {
      setError('Pick a post and add a name.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        candidateName: form.candidateName,
        candidateEmail: form.candidateEmail || undefined,
        candidatePhone: form.candidatePhone || undefined,
        status: form.status,
      };
      const result = await onCreateApplication?.(form.postId, payload);
      setForm((current) => ({ ...current, candidateName: '', candidateEmail: '', candidatePhone: '' }));
      if (result?.id) {
        onSelectApplication?.(result.id);
      }
    } catch (submissionError) {
      setError(submissionError?.message || 'Could not add candidate.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">People</h2>
        <p className="text-sm text-slate-500">Track every volunteer application and jump into the right record instantly.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Add candidate</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-sm text-slate-600">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Post</span>
                <select
                  value={form.postId}
                  onChange={handleFormChange('postId')}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  <option value="" disabled>
                    Select post
                  </option>
                  {uniquePosts.map((post) => (
                    <option key={post.value} value={post.value}>
                      {post.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</span>
                <input
                  value={form.candidateName}
                  onChange={handleFormChange('candidateName')}
                  placeholder="Candidate name"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
                <input
                  value={form.candidateEmail}
                  onChange={handleFormChange('candidateEmail')}
                  placeholder="name@email.com"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</span>
                <input
                  value={form.candidatePhone}
                  onChange={handleFormChange('candidatePhone')}
                  placeholder="+1 555 123 4567"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</span>
                <select
                  value={form.status}
                  onChange={handleFormChange('status')}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:bg-white focus:outline-none"
                >
                  {APPLICATION_STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
              <button
                type="submit"
                disabled={submitting || busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <PlusIcon className="h-4 w-4" aria-hidden="true" />
                Add
              </button>
            </form>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">Pipeline status</h3>
            <ul className="space-y-1 text-xs text-slate-500">
              <li className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 font-semibold text-slate-700">
                <span>All</span>
                <span>{derivedTotals.total}</span>
              </li>
              {APPLICATION_STATUSES.map((option) => (
                <li key={option.value} className="flex items-center justify-between rounded-xl px-3 py-2">
                  <span>{option.label}</span>
                  <span>{derivedTotals.byStatus[option.value] ?? 0}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex h-full flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email, or stage"
                className="flex-1 bg-transparent py-2 text-sm text-slate-700 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <label className="inline-flex items-center gap-2">
                <FunnelIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
                >
                  {STATUS_FILTERS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <select
                value={postFilter}
                onChange={(event) => setPostFilter(event.target.value === 'all' ? 'all' : Number(event.target.value))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All posts</option>
                {uniquePosts.map((post) => (
                  <option key={post.value} value={post.value}>
                    {post.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid max-h-[640px] grid-cols-1 gap-3 overflow-y-auto pr-1">
            {filteredApplications.length ? (
              filteredApplications.map((application) => {
                const post = application.post ?? posts.find((item) => item.id === application.postId);
                const selected = application.id === selectedApplicationId;
                return (
                  <button
                    key={application.id}
                    type="button"
                    onClick={() => onSelectApplication?.(application.id)}
                    className={`flex w-full flex-col gap-3 rounded-2xl border p-4 text-left transition ${
                      selected
                        ? 'border-blue-500 bg-blue-50/80 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{application.candidateName || 'Unnamed candidate'}</p>
                        <p className="text-xs text-slate-500">{post?.title ?? 'No post assigned'}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                        {STATUS_LABEL[application.status] ?? application.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                        <EnvelopeIcon className="h-4 w-4" aria-hidden="true" />
                        {application.candidateEmail || '—'}
                      </div>
                      <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                        <PhoneIcon className="h-4 w-4" aria-hidden="true" />
                        {application.candidatePhone || '—'}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-500">
                      <div className="rounded-xl bg-slate-100 px-2 py-1 text-center">
                        <p className="font-semibold text-slate-600">Responses</p>
                        <p className="text-sm font-semibold text-slate-900">{application.responses?.length ?? 0}</p>
                      </div>
                      <div className="rounded-xl bg-slate-100 px-2 py-1 text-center">
                        <p className="font-semibold text-slate-600">Interviews</p>
                        <p className="text-sm font-semibold text-slate-900">{application.interviews?.length ?? 0}</p>
                      </div>
                      <div className="rounded-xl bg-slate-100 px-2 py-1 text-center">
                        <p className="font-semibold text-slate-600">Contracts</p>
                        <p className="text-sm font-semibold text-slate-900">{application.contracts?.length ?? 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Applied {formatDate(application.submittedAt)}</span>
                      <span className="inline-flex items-center gap-1 text-blue-600">
                        Open
                        <ArrowRightIcon className="h-3 w-3" aria-hidden="true" />
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-12 text-center text-sm text-slate-500">
                <UsersIcon className="h-10 w-10 text-slate-300" aria-hidden="true" />
                <p className="mt-3 font-semibold text-slate-700">No candidates match these filters.</p>
                <p className="mt-1 text-xs">Adjust filters or add a new person from the panel.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

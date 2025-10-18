import { useMemo, useState } from 'react';
import {
  DocumentPlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PencilSquareIcon,
  TrashIcon,
  UsersIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import VolunteeringPostFormModal from './VolunteeringPostFormModal.jsx';
import { POST_STATUSES } from './volunteeringOptions.js';

const STATUS_FILTERS = [{ value: 'all', label: 'All' }, ...POST_STATUSES];

const STATUS_TONE = {
  draft: 'bg-slate-100 text-slate-600 border border-slate-200',
  open: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  paused: 'bg-amber-50 text-amber-700 border border-amber-200',
  closed: 'bg-slate-100 text-slate-500 border border-slate-200',
  archived: 'bg-slate-50 text-slate-500 border border-slate-200',
};

const STATUS_LABEL = Object.fromEntries(POST_STATUSES.map((option) => [option.value, option.label]));

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

function countActiveContracts(applications) {
  return (applications ?? []).reduce((total, application) => {
    const active = (application.contracts ?? []).filter((contract) => contract.status === 'active');
    return total + active.length;
  }, 0);
}

function sumSpend(applications) {
  return (applications ?? []).reduce((total, application) => {
    const spend = (application.contracts ?? []).reduce((acc, contract) => {
      return (
        acc +
        (contract.spendEntries ?? []).reduce((entryTotal, entry) => entryTotal + (Number(entry.amount) || 0), 0)
      );
    }, 0);
    return total + spend;
  }, 0);
}

function currencyFormatter(amount, currency = 'USD') {
  if (!amount) return '$0';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(Number(amount));
  } catch (error) {
    return `${currency} ${Number(amount).toLocaleString()}`;
  }
}

function PostCard({ post, onEdit, onOpenPipeline, deleting, confirmDelete }) {
  const statusTone = STATUS_TONE[post.status] ?? STATUS_TONE.draft;
  const applications = post.applications ?? [];
  const interviews = applications.reduce((total, application) => total + (application.interviews?.length ?? 0), 0);
  const activeContracts = countActiveContracts(applications);
  const spend = sumSpend(applications);

  return (
    <article className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{post.title}</p>
          {post.summary ? <p className="text-sm text-slate-600">{post.summary}</p> : null}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${statusTone}`}>
              {STATUS_LABEL[post.status] ?? post.status}
            </span>
            {post.location ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1">
                <MapPinIcon className="h-4 w-4" aria-hidden="true" />
                {post.location}
              </span>
            ) : null}
            {post.remoteFriendly ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-blue-700">Remote</span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenPipeline?.(post)}
            className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            Pipeline
          </button>
          <button
            type="button"
            onClick={() => onEdit(post)}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
            Edit
          </button>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-3 text-xs text-slate-500 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="flex items-center gap-1 font-semibold text-slate-600">
            <UsersIcon className="h-4 w-4" />
            Candidates
          </dt>
          <dd className="mt-2 text-lg font-semibold text-slate-900">{applications.length}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="flex items-center gap-1 font-semibold text-slate-600">
            <ClockIcon className="h-4 w-4" />
            Interviews
          </dt>
          <dd className="mt-2 text-lg font-semibold text-slate-900">{interviews}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="flex items-center gap-1 font-semibold text-slate-600">
            <ClipboardDocumentListIcon className="h-4 w-4" />
            Active contracts
          </dt>
          <dd className="mt-2 text-lg font-semibold text-slate-900">{activeContracts}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <dt className="flex items-center gap-1 font-semibold text-slate-600">Spend</dt>
          <dd className="mt-2 text-lg font-semibold text-slate-900">{currencyFormatter(spend)}</dd>
        </div>
      </dl>

      <footer className="flex flex-col gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span>Start {formatDate(post.startDate)}</span>
          <span>End {formatDate(post.endDate)}</span>
          <span>Deadline {formatDate(post.applicationDeadline)}</span>
        </div>
        <div className="flex items-center gap-2">
          {deleting ? (
            <span className="text-rose-600">Removing…</span>
          ) : (
            <button
              type="button"
              onClick={() => confirmDelete(post)}
              className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
            >
              <TrashIcon className="h-4 w-4" aria-hidden="true" />
              Delete
            </button>
          )}
        </div>
      </footer>
    </article>
  );
}

export default function VolunteeringPostBoard({
  posts = [],
  permissions = {},
  onCreatePost,
  onUpdatePost,
  onDeletePost,
  onOpenPipeline,
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [modalState, setModalState] = useState({ open: false, mode: 'create', initial: null });
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);

  const filteredPosts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesStatus = status === 'all' || post.status === status;
      const matchesSearch =
        !term ||
        post.title?.toLowerCase().includes(term) ||
        post.summary?.toLowerCase().includes(term) ||
        post.location?.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }, [posts, search, status]);

  const openCreateModal = () => {
    setModalState({ open: true, mode: 'create', initial: null });
    setModalError(null);
  };

  const openEditModal = (post) => {
    setModalState({ open: true, mode: 'update', initial: post });
    setModalError(null);
  };

  const closeModal = () => {
    if (modalBusy) return;
    setModalState((current) => ({ ...current, open: false }));
  };

  const handleSubmit = async (payload) => {
    setModalBusy(true);
    setModalError(null);
    try {
      if (modalState.mode === 'update' && modalState.initial) {
        await onUpdatePost?.(modalState.initial.id, payload);
      } else {
        await onCreatePost?.(payload);
      }
      setModalState({ open: false, mode: 'create', initial: null });
    } catch (error) {
      setModalError(error?.message || 'Unable to save post');
    } finally {
      setModalBusy(false);
    }
  };

  const confirmDelete = async (post) => {
    if (!post?.id) return;
    setDeletingPostId(post.id);
    try {
      await onDeletePost?.(post.id);
    } finally {
      setDeletingPostId(null);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Posts</h2>
        <p className="text-sm text-slate-500">Create and update volunteer openings without crowding other workspaces.</p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, summary, or location"
              className="flex-1 bg-transparent py-2 text-sm text-slate-700 focus:outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <FunnelIcon className="h-5 w-5 text-slate-400" aria-hidden="true" />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
            >
              {STATUS_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {permissions?.canManagePosts !== false ? (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <DocumentPlusIcon className="h-5 w-5" aria-hidden="true" />
              New post
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredPosts.length ? (
            filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onEdit={openEditModal}
                onDelete={confirmDelete}
                onOpenPipeline={onOpenPipeline}
                deleting={deletingPostId === post.id}
                confirmDelete={confirmDelete}
              />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-12 text-center">
              <p className="text-lg font-semibold text-slate-700">No posts yet</p>
              <p className="text-sm text-slate-500">Start by adding a role to unlock the rest of the workspace.</p>
              {permissions?.canManagePosts !== false ? (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <DocumentPlusIcon className="h-5 w-5" aria-hidden="true" />
                  Add post
                </button>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <VolunteeringPostFormModal
        open={modalState.open}
        mode={modalState.mode === 'update' ? 'update' : 'create'}
        initialValue={modalState.initial}
        onClose={closeModal}
        onSubmit={handleSubmit}
        busy={modalBusy}
        error={modalError}
      />
    </div>
  );
}

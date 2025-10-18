import { useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const COMMENT_STATUSES = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'spam', label: 'Spam' },
  { value: 'archived', label: 'Archived' },
];

const NEW_COMMENT_DEFAULT = Object.freeze({
  postId: '',
  authorName: '',
  authorEmail: '',
  status: 'approved',
  body: '',
  isPinned: false,
});

function statusBadgeClass(status) {
  switch (status) {
    case 'approved':
      return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
    case 'pending':
      return 'bg-amber-50 text-amber-600 border border-amber-200';
    case 'rejected':
      return 'bg-rose-50 text-rose-600 border border-rose-200';
    case 'spam':
      return 'bg-slate-100 text-slate-600 border border-slate-300';
    case 'archived':
      return 'bg-slate-50 text-slate-500 border border-slate-200';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
}

function formatTimestamp(value) {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

export default function BlogCommentsPanel({
  comments,
  loading,
  pagination,
  filters,
  onFilterChange,
  onRefresh,
  posts,
  onCreate,
  onUpdate,
  onDelete,
  onExpand,
  onCloseFullscreen,
  isFullscreen = false,
}) {
  const [newComment, setNewComment] = useState(NEW_COMMENT_DEFAULT);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingBody, setEditingBody] = useState('');
  const [editingStatus, setEditingStatus] = useState('approved');
  const [editingPinned, setEditingPinned] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!newComment.postId || !newComment.body) {
      return;
    }
    setCreating(true);
    try {
      await onCreate(newComment.postId, {
        authorName: newComment.authorName || undefined,
        authorEmail: newComment.authorEmail || undefined,
        status: newComment.status,
        body: newComment.body,
        isPinned: Boolean(newComment.isPinned),
      });
      setNewComment(NEW_COMMENT_DEFAULT);
    } finally {
      setCreating(false);
    }
  };

  const beginEdit = (comment) => {
    setEditingId(comment.id);
    setEditingBody(comment.body ?? '');
    setEditingStatus(comment.status ?? 'approved');
    setEditingPinned(Boolean(comment.isPinned));
  };

  const handleUpdate = async (commentId, updates) => {
    setUpdating(true);
    try {
      await onUpdate(commentId, updates);
      setEditingId(null);
      setEditingBody('');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateSubmit = async (event) => {
    event.preventDefault();
    if (!editingId) {
      return;
    }
    await handleUpdate(editingId, {
      body: editingBody,
      status: editingStatus,
      isPinned: editingPinned,
    });
  };

  const handleDelete = async (commentId) => {
    const confirmed = window.confirm('Delete this comment?');
    if (!confirmed) {
      return;
    }
    await onDelete(commentId);
  };

  const changePage = (nextPage) => {
    onFilterChange({ ...filters, page: nextPage });
  };

  const sectionClass = `rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm ${
    isFullscreen ? 'h-full max-h-full overflow-y-auto' : ''
  }`;

  return (
    <section id="comments" className={sectionClass}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Comments</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin text-accent' : ''}`} />
            Refresh
          </button>
          {isFullscreen ? (
            <button
              type="button"
              onClick={onCloseFullscreen}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-accent hover:text-accent"
            >
              Close view
            </button>
          ) : (
            <button
              type="button"
              onClick={onExpand}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-accent hover:text-accent"
            >
              Full view
            </button>
          )}
        </div>
      </header>

      <div className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
        <div>
          <label htmlFor="comment-status" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </label>
          <select
            id="comment-status"
            value={filters.status}
            onChange={(event) => onFilterChange({ ...filters, status: event.target.value, page: 1 })}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
          >
            {COMMENT_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="comment-post" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Post
          </label>
          <select
            id="comment-post"
            value={filters.postId}
            onChange={(event) => onFilterChange({ ...filters, postId: event.target.value, page: 1 })}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
          >
            <option value="">All posts</option>
            {posts.map((post) => (
              <option key={post.id} value={post.id}>
                {post.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="h-4 w-2/3 rounded-full bg-slate-200" />
                <div className="mt-2 h-3 w-1/3 rounded-full bg-slate-200" />
              </div>
            ))}
          </div>
        ) : null}

        {!loading && comments.length === 0 ? (
          <p className="text-sm text-slate-500">No comments.</p>
        ) : null}

        {!loading && comments.length
          ? comments.map((comment) => {
              const isEditing = Number(editingId) === Number(comment.id);
              return (
                <div key={comment.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{comment.authorName || 'Guest'}</p>
                      <p className="text-xs text-slate-500">{formatTimestamp(comment.createdAt)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(comment.status)}`}>
                      {comment.status ?? 'unknown'}
                    </span>
                  </div>

                  {isEditing ? (
                    <form className="mt-3 space-y-3" onSubmit={handleUpdateSubmit}>
                      <textarea
                        rows={4}
                        value={editingBody}
                        onChange={(event) => setEditingBody(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                        required
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label htmlFor={`edit-status-${comment.id}`} className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                          </label>
                          <select
                            id={`edit-status-${comment.id}`}
                            value={editingStatus}
                            onChange={(event) => setEditingStatus(event.target.value)}
                            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
                          >
                            {COMMENT_STATUSES.filter((status) => status.value !== 'all').map((status) => (
                              <option key={status.value} value={status.value}>
                                {status.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2 pt-6 text-sm text-slate-600">
                          <input
                            id={`edit-pinned-${comment.id}`}
                            type="checkbox"
                            checked={editingPinned}
                            onChange={(event) => setEditingPinned(event.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
                          />
                          <label htmlFor={`edit-pinned-${comment.id}`}>Pin to top</label>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="submit"
                          disabled={updating}
                          className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-accent hover:text-accent"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="mt-3 space-y-3 text-sm text-slate-700">
                      <p className="whitespace-pre-wrap">{comment.body}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => beginEdit(comment)}
                          className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-accent hover:text-accent"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdate(comment.id, { status: 'approved' })}
                          className="rounded-full border border-emerald-200 px-3 py-1 font-semibold text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdate(comment.id, { status: 'rejected' })}
                          className="rounded-full border border-rose-200 px-3 py-1 font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(comment.id)}
                          className="rounded-full border border-slate-200 px-3 py-1 font-semibold text-slate-600 transition hover:border-rose-300 hover:text-rose-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          : null}
      </div>

      {pagination ? (
        <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
          <button
            type="button"
            onClick={() => changePage(Math.max(1, (filters.page ?? 1) - 1))}
            disabled={(filters.page ?? 1) <= 1}
            className="rounded-full border border-slate-200 px-4 py-2 font-semibold uppercase tracking-wide transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            Prev
          </button>
          <span>
            Page {filters.page ?? 1} of {pagination.totalPages ?? 1}
          </span>
          <button
            type="button"
            onClick={() => changePage((filters.page ?? 1) + 1)}
            disabled={filters.page >= (pagination.totalPages ?? 1)}
            className="rounded-full border border-slate-200 px-4 py-2 font-semibold uppercase tracking-wide transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            Next
          </button>
        </div>
      ) : null}

      <form className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" onSubmit={handleCreate}>
        <h3 className="text-sm font-semibold text-slate-900">Add comment</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="new-comment-post" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Post
            </label>
            <select
              id="new-comment-post"
              value={newComment.postId}
              onChange={(event) => setNewComment((current) => ({ ...current, postId: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              required
            >
              <option value="">Select a post</option>
              {posts.map((post) => (
                <option key={post.id} value={post.id}>
                  {post.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="new-comment-status" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </label>
            <select
              id="new-comment-status"
              value={newComment.status}
              onChange={(event) => setNewComment((current) => ({ ...current, status: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            >
              {COMMENT_STATUSES.filter((status) => status.value !== 'all').map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="new-comment-name" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Name
            </label>
            <input
              id="new-comment-name"
              type="text"
              value={newComment.authorName}
              onChange={(event) => setNewComment((current) => ({ ...current, authorName: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </div>
          <div>
            <label htmlFor="new-comment-email" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </label>
            <input
              id="new-comment-email"
              type="email"
              value={newComment.authorEmail}
              onChange={(event) => setNewComment((current) => ({ ...current, authorEmail: event.target.value }))}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            />
          </div>
        </div>
        <div>
          <label htmlFor="new-comment-body" className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Comment
          </label>
          <textarea
            id="new-comment-body"
            rows={4}
            value={newComment.body}
            onChange={(event) => setNewComment((current) => ({ ...current, body: event.target.value }))}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
            required
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <input
            id="new-comment-pinned"
            type="checkbox"
            checked={newComment.isPinned}
            onChange={(event) => setNewComment((current) => ({ ...current, isPinned: event.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent"
          />
          <label htmlFor="new-comment-pinned">Pin to top</label>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accentDark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? 'Adding…' : 'Add comment'}
        </button>
      </form>
    </section>
  );
}

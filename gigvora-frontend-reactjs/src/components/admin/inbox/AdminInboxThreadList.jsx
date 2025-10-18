import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { classNames } from '../../../utils/classNames.js';
import { buildThreadTitle, formatThreadParticipants, isThreadUnread } from '../../../utils/messaging.js';

function ThreadBadge({ label, tone = 'slate' }) {
  const toneClasses = {
    slate: 'bg-slate-100 text-slate-600',
    accent: 'bg-accent/10 text-accent',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    rose: 'bg-rose-100 text-rose-700',
  };
  return (
    <span className={classNames('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', toneClasses[tone] ?? toneClasses.slate)}>
      {label}
    </span>
  );
}

function ThreadRow({ thread, actorId, selected, onSelect }) {
  const participants = formatThreadParticipants(thread, actorId);
  const unread = isThreadUnread(thread);
  const supportStatus = thread.supportCase?.status;
  const priority = thread.supportCase?.priority;

  return (
    <button
      type="button"
      onClick={() => onSelect(thread.id)}
      className={classNames(
        'w-full rounded-2xl border px-4 py-3 text-left transition',
        selected
          ? 'border-accent bg-accentSoft shadow-soft'
          : unread
          ? 'border-slate-200 bg-white shadow-sm hover:border-accent/50'
          : 'border-slate-200 bg-white hover:border-accent/40',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">{buildThreadTitle(thread, actorId)}</p>
          {participants.length ? (
            <div className="mt-1 flex flex-wrap gap-1 text-[11px] uppercase tracking-wide text-slate-500">
              {participants.map((participant) => (
                <span key={participant}>{participant}</span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {unread ? <ThreadBadge tone="accent" label={`${thread.unreadCount ?? 1} new`} /> : null}
          {supportStatus ? <ThreadBadge tone="emerald" label={supportStatus.replace(/_/g, ' ')} /> : null}
          {priority ? <ThreadBadge tone="amber" label={priority} /> : null}
          {Array.isArray(thread.labels)
            ? thread.labels.map((label) => (
                <span
                  key={label.id}
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                  style={{ backgroundColor: `${label.color ?? '#c7d2fe'}22`, color: label.color ?? '#2563eb' }}
                >
                  {label.name}
                </span>
              ))
            : null}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="line-clamp-1">{thread.lastMessagePreview ?? '—'}</span>
        <span>{thread.lastMessageAt ? new Date(thread.lastMessageAt).toLocaleString() : ''}</span>
      </div>
    </button>
  );
}

export default function AdminInboxThreadList({
  threads,
  actorId,
  selectedThreadId,
  onSelect,
  loading,
  error,
  onRefresh,
  pagination,
  onLoadMore,
}) {
  return (
    <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">Threads</p>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
        >
          <ArrowPathIcon className={classNames('h-4 w-4', loading ? 'animate-spin' : '')} /> Refresh
        </button>
      </div>
      {error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-xs text-rose-600" role="alert">
          {error}
        </p>
      ) : null}
      {loading && !threads.length ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : null}
      {!loading && !threads.length ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
          Empty queue.
        </div>
      ) : null}
      <div className="space-y-2">
        {threads.map((thread) => (
          <ThreadRow
            key={thread.id}
            thread={thread}
            actorId={actorId}
            selected={selectedThreadId === thread.id}
            onSelect={onSelect}
          />
        ))}
      </div>
      {pagination && pagination.page < pagination.totalPages ? (
        <button
          type="button"
          onClick={onLoadMore}
          className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
        >
          Load more
        </button>
      ) : null}
    </section>
  );
}

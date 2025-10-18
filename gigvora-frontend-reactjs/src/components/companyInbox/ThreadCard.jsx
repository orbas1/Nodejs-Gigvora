import { formatRelativeTime } from '../../utils/date.js';
import { classNames } from '../../utils/classNames.js';
import LabelBadge from './LabelBadge.jsx';

export default function ThreadCard({ thread, active, onSelect }) {
  const lastActivity = thread.lastMessageAt ? formatRelativeTime(thread.lastMessageAt) : 'Just now';
  const workspaceParticipants = thread.workspaceParticipants ?? thread.participants ?? [];

  return (
    <button
      type="button"
      onClick={() => onSelect(thread.id)}
      className={classNames(
        'w-full rounded-3xl border px-5 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        active
          ? 'border-accent bg-white shadow-soft'
          : thread.unread
          ? 'border-accent/40 bg-white shadow-sm'
          : 'border-slate-200 bg-slate-50 hover:border-accent/50',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{thread.subject || 'Untitled conversation'}</p>
          <p className="mt-1 text-xs text-slate-500 capitalize">{thread.channelType}</p>
        </div>
        <span className="text-xs text-slate-400">{lastActivity}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {thread.unread ? (
          <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-rose-600">
            Unread
          </span>
        ) : null}
        {thread.supportCase ? (
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
            {thread.supportCase.status.replace(/_/g, ' ')}
          </span>
        ) : null}
        {thread.labels.map((label) => (
          <LabelBadge key={label.id} label={label} />
        ))}
      </div>
      <p className="mt-3 text-sm text-slate-600 line-clamp-2">{thread.lastMessagePreview || 'No messages yet.'}</p>
      {workspaceParticipants.length ? (
        <p className="mt-3 text-xs text-slate-500">
          {workspaceParticipants
            .map((participant) => participant.user?.firstName ?? participant.user?.email ?? `User #${participant.userId}`)
            .join(', ')}
        </p>
      ) : null}
    </button>
  );
}

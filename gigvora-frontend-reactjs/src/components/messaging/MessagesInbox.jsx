import PropTypes from 'prop-types';
import {
  ChatBubbleLeftRightIcon,
  InboxIcon,
  StarIcon,
  BellAlertIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';

const FILTERS = [
  { key: 'all', label: 'Inbox', icon: InboxIcon },
  { key: 'unread', label: 'Unread', icon: BellAlertIcon },
  { key: 'starred', label: 'Starred', icon: StarIcon },
];

function formatTimestamp(value) {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function ThreadAvatar({ name, avatarUrl }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt="" className="h-12 w-12 flex-none rounded-full object-cover" />;
  }

  const initials = name
    ?.split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
      {initials || 'GV'}
    </span>
  );
}

ThreadAvatar.propTypes = {
  name: PropTypes.string,
  avatarUrl: PropTypes.string,
};

ThreadAvatar.defaultProps = {
  name: '',
  avatarUrl: null,
};

export function ThreadPreviewCard({ thread, active, onSelect }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect?.(thread.id)}
        className={classNames(
          'flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition',
          active ? 'bg-white shadow-sm ring-1 ring-accent/40' : 'hover:bg-white/70',
        )}
        aria-pressed={active}
        aria-label={thread.title ? `Open conversation with ${thread.title}` : 'Open conversation'}
        data-testid={`thread-${thread.id}`}
      >
        <ThreadAvatar name={thread.title} avatarUrl={thread.avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="flex flex-1 items-center gap-2">
              <p className={classNames('truncate text-sm font-semibold', thread.unread ? 'text-slate-900' : 'text-slate-700')}>
                {thread.title}
              </p>
              {thread.unread ? <span className="h-2.5 w-2.5 flex-none rounded-full bg-accent" aria-hidden="true" /> : null}
            </div>
            <span className="text-xs font-medium text-slate-400">{formatTimestamp(thread.lastActivityAt)}</span>
          </div>
          {thread.meta ? <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-400">{thread.meta}</p> : null}
          <p
            className={classNames(
              'mt-1 line-clamp-2 text-sm leading-5',
              thread.unread ? 'font-medium text-slate-900' : 'text-slate-500',
            )}
          >
            {thread.preview}
          </p>
        </div>
      </button>
    </li>
  );
}

ThreadPreviewCard.propTypes = {
  thread: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string,
    preview: PropTypes.string,
    lastActivityAt: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.instanceOf(Date)]),
    avatarUrl: PropTypes.string,
    unread: PropTypes.bool,
    meta: PropTypes.string,
    participants: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  active: PropTypes.bool,
  onSelect: PropTypes.func,
};

ThreadPreviewCard.defaultProps = {
  active: false,
  onSelect: undefined,
};

export default function MessagesInbox({
  threads,
  selectedThreadId,
  onSelectThread,
  filter,
  onFilterChange,
  searchTerm,
  onSearchChange,
}) {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-slate-50/80">
      <header className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              Messaging
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Inbox</h2>
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-inner" htmlFor="inbox-search">
          <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
          <input
            id="inbox-search"
            type="search"
            placeholder="Search messages"
            value={searchTerm}
            onChange={(event) => onSearchChange?.(event.target.value)}
            className="w-full border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
        </label>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {FILTERS.map((item) => {
            const Icon = item.icon;
            const isActive = filter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onFilterChange?.(item.key)}
                className={classNames(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  isActive ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-white/70',
                )}
                aria-pressed={isActive}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {threads.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-slate-500">No conversations found.</p>
        ) : (
          <ul className="space-y-1" role="list">
            {threads.map((thread) => (
              <ThreadPreviewCard
                key={thread.id}
                thread={thread}
                active={`${thread.id}` === `${selectedThreadId}`}
                onSelect={onSelectThread}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

MessagesInbox.propTypes = {
  threads: PropTypes.arrayOf(ThreadPreviewCard.propTypes.thread),
  selectedThreadId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectThread: PropTypes.func,
  filter: PropTypes.oneOf(FILTERS.map((item) => item.key)),
  onFilterChange: PropTypes.func,
  searchTerm: PropTypes.string,
  onSearchChange: PropTypes.func,
};

MessagesInbox.defaultProps = {
  threads: [],
  selectedThreadId: null,
  onSelectThread: undefined,
  filter: 'all',
  onFilterChange: undefined,
  searchTerm: '',
  onSearchChange: undefined,
};

export { FILTERS as INBOX_FILTERS };

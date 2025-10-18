import {
  ChatBubbleLeftIcon,
  ClockIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { buildThreadTitle, describeLastActivity, isThreadUnread } from '../../../../../utils/messaging.js';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

export default function ThreadPanel({
  threads = [],
  loading,
  error,
  searchValue,
  onSearchChange,
  selectedThreadId,
  onSelectThread,
}) {
  return (
    <section className="flex h-full min-h-[32rem] w-full flex-col overflow-hidden rounded-3xl bg-white/90 shadow-xl ring-1 ring-slate-100">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex h-10 flex-1 items-center rounded-full bg-slate-50 px-3">
          <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="Search"
            className="ml-2 flex-1 bg-transparent text-sm text-slate-700 outline-none"
          />
        </div>
        <ChatBubbleLeftIcon className="h-5 w-5 text-slate-300" />
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : threads.length ? (
          <ul className="space-y-2">
            {threads.map((thread) => {
              const unread = isThreadUnread(thread);
              const isActive = thread.id === selectedThreadId;
              return (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => onSelectThread?.(thread.id)}
                    className={classNames(
                      'flex w-full flex-col gap-1 rounded-2xl border px-4 py-3 text-left transition',
                      isActive
                        ? 'border-accent bg-accentSoft text-accent shadow-soft'
                        : unread
                        ? 'border-accent/40 bg-white text-slate-800 shadow-sm'
                        : 'border-transparent bg-slate-50 text-slate-600 hover:border-accent/40',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-current">{buildThreadTitle(thread)}</span>
                      <span className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-slate-400">
                        <ClockIcon className="h-3.5 w-3.5" />
                        {describeLastActivity(thread)}
                      </span>
                    </div>
                    {thread.lastMessagePreview ? (
                      <p className="line-clamp-2 text-xs text-current/70">{thread.lastMessagePreview}</p>
                    ) : null}
                    {unread ? (
                      <span className="text-xs font-semibold uppercase tracking-wide text-accent">Unread</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-slate-400">
            <ExclamationCircleIcon className="h-5 w-5" />
            <p>No conversations yet</p>
          </div>
        )}
      </div>
      {error ? (
        <div className="border-t border-rose-200 bg-rose-50 px-4 py-2 text-center text-xs font-medium text-rose-600">{error}</div>
      ) : null}
    </section>
  );
}


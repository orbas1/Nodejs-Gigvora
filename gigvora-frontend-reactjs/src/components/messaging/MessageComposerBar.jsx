import { Fragment, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Menu, Transition } from '@headlessui/react';
import {
  ArrowUpCircleIcon,
  BoltIcon,
  PaperClipIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

import { classNames } from '../../utils/classNames.js';

function SavedRepliesMenu({ savedReplies, onSelect }) {
  if (!savedReplies?.length) {
    return null;
  }
  return (
    <Menu as="div" className="relative inline-flex">
      <Menu.Button
        type="button"
        className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <SparklesIcon className="h-4 w-4" /> Saved replies
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        <Menu.Items className="absolute left-0 z-30 mt-2 w-80 origin-top-left space-y-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft focus:outline-none">
          {savedReplies.map((reply) => (
            <Menu.Item key={reply.id ?? reply.title}>
              {({ active }) => (
                <button
                  type="button"
                  className={classNames(
                    'flex w-full flex-col rounded-xl px-3 py-2 text-left text-xs transition',
                    active ? 'bg-accent/10 text-accent' : 'text-slate-600',
                  )}
                  onClick={() => onSelect?.(reply)}
                >
                  <span className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide">
                    {reply.title || 'Reply template'}
                    {reply.shortcut || reply.shortcuts?.[0] ? (
                      <span className="text-[10px] text-slate-400">
                        {reply.shortcut
                          ? `/${reply.shortcut}`
                          : `/${reply.shortcuts[0]}`}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 line-clamp-3 text-[11px] text-slate-500">{reply.body}</span>
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

SavedRepliesMenu.propTypes = {
  savedReplies: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      body: PropTypes.string,
      shortcut: PropTypes.string,
      shortcuts: PropTypes.arrayOf(PropTypes.string),
    }),
  ),
  onSelect: PropTypes.func,
};

SavedRepliesMenu.defaultProps = {
  savedReplies: null,
  onSelect: null,
};

export default function MessageComposerBar({
  value,
  onChange,
  onSubmit,
  disabled,
  sending,
  placeholder,
  onShare,
  savedReplies,
  onInsertSavedReply,
}) {
  const trimmedLength = useMemo(() => value.trim().length, [value]);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!value.trim() || disabled || sending) {
        return;
      }
      onSubmit?.();
    },
    [value, disabled, sending, onSubmit],
  );

  const handleKeyDown = useCallback(
    (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!disabled && !sending) {
          onSubmit?.();
        }
      }
    },
    [disabled, sending, onSubmit],
  );

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <textarea
        rows={4}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-inner transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
        placeholder={placeholder ?? 'Write your reply…'}
        aria-label="Message composer"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <PaperClipIcon className="h-4 w-4" /> Attach
          </button>
          <SavedRepliesMenu savedReplies={savedReplies} onSelect={onInsertSavedReply} />
          <span>{trimmedLength} / 2000 characters</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onShare?.()}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <BoltIcon className="h-4 w-4" /> Share to team
          </button>
          <button
            type="submit"
            className={classNames(
              'inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              disabled || !value.trim() || sending ? 'cursor-not-allowed opacity-60' : 'hover:bg-accentDark',
            )}
            disabled={disabled || !value.trim() || sending}
          >
            <ArrowUpCircleIcon className={classNames('h-5 w-5', sending ? 'animate-spin' : '')} />
            {sending ? 'Sending…' : 'Send message'}
          </button>
        </div>
      </div>
    </form>
  );
}

MessageComposerBar.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  sending: PropTypes.bool,
  placeholder: PropTypes.string,
  onShare: PropTypes.func,
  savedReplies: PropTypes.arrayOf(PropTypes.object),
  onInsertSavedReply: PropTypes.func,
};

MessageComposerBar.defaultProps = {
  disabled: false,
  sending: false,
  placeholder: null,
  onShare: null,
  savedReplies: null,
  onInsertSavedReply: null,
};

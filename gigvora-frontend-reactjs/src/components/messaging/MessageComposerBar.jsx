import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  LinkIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';

export const MAX_COMPOSER_LENGTH = 1500;

function AttachmentChip({ attachment, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
        <PaperClipIcon className="h-3.5 w-3.5" />
        {attachment.title}
      </span>
      <button
        type="button"
        onClick={() => onRemove(attachment.id)}
        className="rounded-full p-0.5 text-slate-400 transition hover:text-rose-500"
        aria-label={`Remove attachment ${attachment.title}`}
      >
        <XMarkIcon className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

AttachmentChip.propTypes = {
  attachment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
  }).isRequired,
  onRemove: PropTypes.func.isRequired,
};

export default function MessageComposerBar({
  threadId,
  value,
  onChange,
  onSend,
  sending,
  disabled,
  savedReplies,
  loadingSavedReplies,
  messageError,
  onSavedReplyUsed,
}) {
  const textAreaRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [linkDraft, setLinkDraft] = useState({ title: '', url: '' });
  const [linkFormOpen, setLinkFormOpen] = useState(false);
  const [savedRepliesOpen, setSavedRepliesOpen] = useState(false);
  const [localError, setLocalError] = useState(null);

  const resolvedValue = value ?? '';
  const remainingCharacters = Math.max(0, MAX_COMPOSER_LENGTH - resolvedValue.length);

  useEffect(() => {
    setAttachments([]);
    setLinkDraft({ title: '', url: '' });
    setLinkFormOpen(false);
    setSavedRepliesOpen(false);
    setLocalError(null);
  }, [threadId]);

  useEffect(() => {
    const element = textAreaRef.current;
    if (!element) {
      return;
    }
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 260)}px`;
  }, [resolvedValue]);

  const handleTextChange = useCallback(
    (event) => {
      const nextValue = event.target.value.slice(0, MAX_COMPOSER_LENGTH);
      onChange(nextValue);
    },
    [onChange],
  );

  const handleAddLink = useCallback(
    (event) => {
      event.preventDefault();
      const trimmedUrl = linkDraft.url.trim();
      const trimmedTitle = linkDraft.title.trim();
      if (!trimmedUrl) {
        setLocalError('Enter a valid link to attach.');
        return;
      }
      try {
        const parsed = new URL(trimmedUrl);
        const attachment = {
          id: `${Date.now()}-${attachments.length}`,
          title: trimmedTitle || parsed.hostname,
          url: parsed.toString(),
        };
        setAttachments((current) => [...current, attachment]);
        setLinkDraft({ title: '', url: '' });
        setLinkFormOpen(false);
        setLocalError(null);
      } catch (error) {
        setLocalError('Links must include a valid protocol (https://).');
      }
    },
    [attachments.length, linkDraft],
  );

  const handleRemoveAttachment = useCallback((id) => {
    setAttachments((current) => current.filter((attachment) => attachment.id !== id));
  }, []);

  const handleSavedReply = useCallback(
    (reply) => {
      if (!reply) {
        return;
      }
      const snippet = typeof reply.body === 'string' ? reply.body.trim() : '';
      if (!snippet) {
        return;
      }
      const base = resolvedValue;
      const needsSpacing = base.trim().length > 0 && !base.trimEnd().endsWith('\n\n');
      const separator = needsSpacing ? '\n\n' : base.endsWith('\n') ? '\n' : '';
      const next = `${base}${separator}${snippet}`.slice(0, MAX_COMPOSER_LENGTH);
      onChange(next);
      setSavedRepliesOpen(false);
      if (onSavedReplyUsed) {
        onSavedReplyUsed(reply);
      }
    },
    [onChange, onSavedReplyUsed, resolvedValue],
  );

  const handleSend = useCallback(
    async (event) => {
      event.preventDefault();
      if (disabled || sending) {
        return;
      }
      const trimmed = resolvedValue.trim();
      if (!trimmed && attachments.length === 0) {
        setLocalError('Add a message or attachment before sending.');
        return;
      }
      setLocalError(null);
      try {
        await onSend({ body: trimmed, attachments });
        setAttachments([]);
        setLinkDraft({ title: '', url: '' });
        setLinkFormOpen(false);
        setSavedRepliesOpen(false);
      } catch (error) {
        const message = error?.body?.message ?? error?.message ?? 'Unable to send message.';
        setLocalError(message);
      }
    },
    [attachments, disabled, onSend, resolvedValue, sending],
  );

  const handleKeyDown = useCallback(
    (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        handleSend(event);
      }
    },
    [handleSend],
  );

  const composerError = useMemo(() => {
    return localError || messageError || null;
  }, [localError, messageError]);

  return (
    <form className="space-y-3" onSubmit={handleSend}>
      <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur">
        <textarea
          ref={textAreaRef}
          rows={3}
          value={resolvedValue}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          placeholder={disabled ? 'Select a conversation to compose your update.' : 'Share agendas, drop saved replies, or attach documents.'}
          className="w-full resize-none rounded-2xl border border-transparent bg-white/70 px-4 py-3 text-sm text-slate-700 transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
          maxLength={MAX_COMPOSER_LENGTH}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSavedRepliesOpen((open) => !open);
                setLinkFormOpen(false);
              }}
              className={classNames(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                savedRepliesOpen
                  ? 'border-accent bg-accent text-white shadow-soft'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-accent/60 hover:text-accent',
              )}
              disabled={disabled}
            >
              <SparklesIcon className="h-4 w-4" /> Saved replies
            </button>
            <button
              type="button"
              onClick={() => {
                setLinkFormOpen((open) => !open);
                setSavedRepliesOpen(false);
              }}
              className={classNames(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                linkFormOpen
                  ? 'border-emerald-400 bg-emerald-100 text-emerald-700 shadow-soft'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-400/70 hover:text-emerald-600',
              )}
              disabled={disabled}
            >
              <LinkIcon className="h-4 w-4" /> Add link
            </button>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>{remainingCharacters} characters left</span>
            <span className="hidden sm:inline">Press ⌘⏎ or Ctrl+Enter to send</span>
          </div>
        </div>
        {savedRepliesOpen ? (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saved replies</p>
              <span className="text-[11px] text-slate-400">
                {loadingSavedReplies ? 'Syncing…' : `${savedReplies.length} templates`}
              </span>
            </div>
            {savedReplies.length ? (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {savedReplies.map((reply) => (
                  <button
                    key={reply.id ?? reply.title}
                    type="button"
                    onClick={() => handleSavedReply(reply)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-accent/60 hover:shadow-sm"
                    disabled={disabled}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{reply.title ?? 'Saved reply'}</p>
                      {reply.shortcut ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">/{reply.shortcut}</span>
                      ) : null}
                    </div>
                    {reply.body ? (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-3">{reply.body}</p>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">No saved replies yet. Collaborate with your team to curate best-practice responses.</p>
            )}
          </div>
        ) : null}
        {linkFormOpen ? (
          <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Link attachment</p>
              <button
                type="button"
                onClick={() => {
                  setLinkFormOpen(false);
                  setLinkDraft({ title: '', url: '' });
                }}
                className="rounded-full p-1 text-emerald-500 transition hover:text-emerald-700"
                aria-label="Close link attachment form"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-[2fr,3fr,auto]">
              <input
                type="text"
                value={linkDraft.title}
                onChange={(event) => setLinkDraft((draft) => ({ ...draft, title: event.target.value }))}
                placeholder="Link title"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
              />
              <input
                type="url"
                value={linkDraft.url}
                onChange={(event) => setLinkDraft((draft) => ({ ...draft, url: event.target.value }))}
                placeholder="https://example.com/resource"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                required
              />
              <button
                type="button"
                onClick={handleAddLink}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-emerald-600"
              >
                Attach
              </button>
            </div>
          </div>
        ) : null}
        {attachments.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {attachments.map((attachment) => (
              <AttachmentChip key={attachment.id} attachment={attachment} onRemove={handleRemoveAttachment} />
            ))}
          </div>
        ) : null}
        {composerError ? (
          <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-2 text-xs text-rose-600" role="alert">
            {composerError}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={disabled || sending}
          className={classNames(
            'inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white shadow-soft transition',
            disabled || sending ? 'cursor-not-allowed opacity-60' : 'hover:bg-accentDark',
          )}
        >
          <PaperAirplaneIcon className={classNames('h-4 w-4', sending ? 'animate-spin' : '')} />
          {sending ? 'Sending…' : 'Send message'}
        </button>
        <span className="text-xs text-slate-500">
          Align quickly with saved replies, attachments, and rich formatting built for premium partnerships.
        </span>
      </div>
    </form>
  );
}

MessageComposerBar.propTypes = {
  threadId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  value: PropTypes.string,
  onChange: PropTypes.func,
  onSend: PropTypes.func,
  sending: PropTypes.bool,
  disabled: PropTypes.bool,
  savedReplies: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string,
      body: PropTypes.string,
      shortcut: PropTypes.string,
    }),
  ),
  loadingSavedReplies: PropTypes.bool,
  messageError: PropTypes.string,
  onSavedReplyUsed: PropTypes.func,
};

MessageComposerBar.defaultProps = {
  threadId: null,
  value: '',
  onChange: () => {},
  onSend: () => Promise.resolve(),
  sending: false,
  disabled: false,
  savedReplies: [],
  loadingSavedReplies: false,
  messageError: null,
  onSavedReplyUsed: null,
};

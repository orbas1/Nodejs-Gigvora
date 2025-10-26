import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  AdjustmentsHorizontalIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  LinkIcon,
  MegaphoneIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { classNames } from '../../utils/classNames.js';
import { formatRelativeTime } from '../../utils/date.js';

export const MAX_COMPOSER_LENGTH = 1500;

const TONE_PRESETS = {
  warm: 'Thanks so much for the collaboration — excited to keep building momentum together.',
  direct: 'Following up on our decisions so we can keep the workstream moving without delay.',
  celebratory: 'Celebrating today’s win with you — sharing highlights and next moves while energy is high.',
};

function LinkChip({ link, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
        <PaperClipIcon className="h-3.5 w-3.5" />
        {link.title}
      </span>
      <button
        type="button"
        onClick={() => onRemove(link.id)}
        className="rounded-full p-0.5 text-slate-400 transition hover:text-rose-500"
        aria-label={`Remove link ${link.title}`}
      >
        <XMarkIcon className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

LinkChip.propTypes = {
  link: PropTypes.shape({
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
  const [links, setLinks] = useState([]);
  const [linkDraft, setLinkDraft] = useState({ title: '', url: '' });
  const [linkFormOpen, setLinkFormOpen] = useState(false);
  const [savedRepliesOpen, setSavedRepliesOpen] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [tone, setTone] = useState('warm');
  const [autoSavedAt, setAutoSavedAt] = useState(null);

  const resolvedValue = value ?? '';
  const remainingCharacters = Math.max(0, MAX_COMPOSER_LENGTH - resolvedValue.length);
  const characterTone = useMemo(() => {
    if (remainingCharacters < 25) {
      return 'text-rose-500';
    }
    if (remainingCharacters < 75) {
      return 'text-amber-500';
    }
    return 'text-slate-400';
  }, [remainingCharacters]);

  useEffect(() => {
    setLinks([]);
    setLinkDraft({ title: '', url: '' });
    setLinkFormOpen(false);
    setSavedRepliesOpen(false);
    setLocalError(null);
    setPreviewOpen(false);
    setTone('warm');
    setAutoSavedAt(null);
  }, [threadId]);

  useEffect(() => {
    const element = textAreaRef.current;
    if (!element) {
      return;
    }
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 260)}px`;
  }, [resolvedValue]);

  useEffect(() => {
    if (disabled) {
      return undefined;
    }
    if (!resolvedValue.trim()) {
      setAutoSavedAt(null);
      return undefined;
    }
    const timer = setTimeout(() => {
      setAutoSavedAt(new Date());
    }, 1500);
    return () => clearTimeout(timer);
  }, [disabled, resolvedValue]);

  const autoSaveLabel = useMemo(() => {
    if (disabled) {
      return 'Composer paused';
    }
    if (!resolvedValue.trim()) {
      return 'Draft not yet saved';
    }
    if (!autoSavedAt) {
      return 'Saving…';
    }
    return `Autosaved ${formatRelativeTime(autoSavedAt)}`;
  }, [autoSavedAt, disabled, resolvedValue]);

  const toneOptions = useMemo(
    () => [
      { value: 'warm', label: 'Warm' },
      { value: 'direct', label: 'Direct' },
      { value: 'celebratory', label: 'Celebratory' },
    ],
    [],
  );

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
        const link = {
          id: `${Date.now()}-${links.length}`,
          title: trimmedTitle || parsed.hostname,
          url: parsed.toString(),
        };
        setLinks((current) => [...current, link]);
        setLinkDraft({ title: '', url: '' });
        setLinkFormOpen(false);
        setLocalError(null);
      } catch (error) {
        setLocalError('Links must include a valid protocol (https://).');
      }
    },
    [links.length, linkDraft],
  );

  const handleRemoveLink = useCallback((id) => {
    setLinks((current) => current.filter((link) => link.id !== id));
  }, []);

  const applyFormatting = useCallback(
    (prefix, suffix = prefix, placeholder = '') => {
      if (disabled) {
        return;
      }
      const element = textAreaRef.current;
      const start = element?.selectionStart ?? resolvedValue.length;
      const end = element?.selectionEnd ?? resolvedValue.length;
      const selected = resolvedValue.slice(start, end) || placeholder;
      const nextValue = `${resolvedValue.slice(0, start)}${prefix}${selected}${suffix}${resolvedValue.slice(end)}`.slice(
        0,
        MAX_COMPOSER_LENGTH,
      );
      onChange(nextValue);
      if (element && typeof element.setSelectionRange === 'function') {
        const positionStart = start + prefix.length;
        const positionEnd = positionStart + selected.length;
        if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
          window.requestAnimationFrame(() => {
            element.focus();
            element.setSelectionRange(positionStart, positionEnd);
          });
        } else {
          element.focus();
          element.setSelectionRange(positionStart, positionEnd);
        }
      }
    },
    [disabled, onChange, resolvedValue],
  );

  const insertSnippet = useCallback(
    (snippet) => {
      if (!snippet || disabled) {
        return;
      }
      const element = textAreaRef.current;
      const start = element?.selectionStart ?? resolvedValue.length;
      const end = element?.selectionEnd ?? resolvedValue.length;
      const before = resolvedValue.slice(0, start);
      const after = resolvedValue.slice(end);
      const needsNewLine = before.trim().length > 0 && !before.endsWith('\n');
      const insertion = `${needsNewLine ? '\n' : ''}${snippet}`;
      const nextValue = `${before}${insertion}${after}`.slice(0, MAX_COMPOSER_LENGTH);
      onChange(nextValue);
      const cursor = Math.min(before.length + insertion.length, MAX_COMPOSER_LENGTH);
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame?.(() => {
          textAreaRef.current?.focus();
          textAreaRef.current?.setSelectionRange(cursor, cursor);
        });
      }
    },
    [disabled, onChange, resolvedValue],
  );

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

  const handleInsertAvailability = useCallback(() => {
    insertSnippet('Availability this week:\n• Monday 09:00–10:30 ET\n• Tuesday 14:00–16:00 ET\n• Thursday 11:00–12:00 ET');
  }, [insertSnippet]);

  const handleInsertSummary = useCallback(() => {
    insertSnippet('Recap:\n• Highlights\n• Decisions\n• Next steps\n• Questions for the room');
  }, [insertSnippet]);

  const handleInsertBullet = useCallback(() => {
    if (disabled) {
      return;
    }
    insertSnippet('• ');
  }, [disabled, insertSnippet]);

  const handleApplyTone = useCallback(() => {
    if (disabled) {
      return;
    }
    const preset = TONE_PRESETS[tone];
    if (!preset) {
      return;
    }
    const trimmed = resolvedValue.trim();
    if (trimmed.startsWith(preset)) {
      return;
    }
    const next = trimmed.length
      ? `${preset}\n\n${trimmed}`.slice(0, MAX_COMPOSER_LENGTH)
      : preset.slice(0, MAX_COMPOSER_LENGTH);
    onChange(next);
  }, [disabled, onChange, resolvedValue, tone]);

  const handleInsertCallToAction = useCallback(() => {
    insertSnippet('Let’s align live — does Wednesday 10:30 ET work to lock the next milestone?');
  }, [insertSnippet]);

  const handleSend = useCallback(
    async (event) => {
      event.preventDefault();
      if (disabled || sending) {
        return;
      }
      const trimmed = resolvedValue.trim();
      if (!trimmed && links.length === 0) {
        setLocalError('Add a message or link before sending.');
        return;
      }
      setLocalError(null);
      try {
        const metadata = links.length
          ? {
              links: links.map((link) => ({ title: link.title, url: link.url })),
            }
          : undefined;
        await onSend({ body: trimmed, metadata });
        setLinks([]);
        setLinkDraft({ title: '', url: '' });
        setLinkFormOpen(false);
        setSavedRepliesOpen(false);
        setPreviewOpen(false);
      } catch (error) {
        const message = error?.body?.message ?? error?.message ?? 'Unable to send message.';
        setLocalError(message);
      }
    },
    [links, disabled, onSend, resolvedValue, sending],
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

  const togglePreview = useCallback(() => {
    setPreviewOpen((open) => !open);
  }, []);

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
          placeholder={
            disabled
              ? 'Select a conversation to compose your update.'
              : 'Share agendas, drop saved replies, or add supporting links.'
          }
          className="w-full resize-none rounded-2xl border border-transparent bg-white/70 px-4 py-3 text-sm text-slate-700 transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-slate-100"
          maxLength={MAX_COMPOSER_LENGTH}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => applyFormatting('**', '**', 'Bold insight')}
                className="rounded-full px-3 py-1 text-xs font-semibold text-slate-500 transition hover:text-accent"
                disabled={disabled}
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => applyFormatting('_', '_', 'Emphasis')}
                className="rounded-full px-3 py-1 text-xs font-semibold text-slate-500 transition hover:text-accent"
                disabled={disabled}
                title="Italic"
              >
                I
              </button>
              <button
                type="button"
                onClick={handleInsertBullet}
                className="rounded-full px-3 py-1 text-xs font-semibold text-slate-500 transition hover:text-accent"
                disabled={disabled}
                title="Bullet"
              >
                •
              </button>
            </div>
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
            <button
              type="button"
              onClick={handleInsertSummary}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
              disabled={disabled}
            >
              <DocumentTextIcon className="h-4 w-4" /> Recap template
            </button>
            <button
              type="button"
              onClick={handleInsertAvailability}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-400/70 hover:text-emerald-600"
              disabled={disabled}
            >
              <CalendarDaysIcon className="h-4 w-4" /> Availability
            </button>
            <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
              {toneOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTone(option.value)}
                  className={classNames(
                    'rounded-full px-3 py-1 text-xs font-semibold transition',
                    tone === option.value
                      ? 'bg-accent text-white shadow-soft'
                      : 'text-slate-500 hover:text-accent',
                  )}
                  disabled={disabled}
                  aria-pressed={tone === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleApplyTone}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
              disabled={disabled}
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" /> Apply tone
            </button>
            <button
              type="button"
              onClick={handleInsertCallToAction}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-emerald-400/70 hover:text-emerald-600"
              disabled={disabled}
            >
              <MegaphoneIcon className="h-4 w-4" /> CTA closer
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
            <button
              type="button"
              onClick={togglePreview}
              className={classNames(
                'rounded-full border px-3 py-1 font-semibold transition',
                previewOpen
                  ? 'border-accent bg-accent text-white shadow-soft'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-accent/60 hover:text-accent',
              )}
            >
              Preview
            </button>
            <span>{autoSaveLabel}</span>
            <span className={classNames('font-semibold', characterTone)}>{remainingCharacters} characters left</span>
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
        {previewOpen ? (
          <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Preview</p>
              <span className="text-[11px] text-slate-400">
                {resolvedValue.trim().length ? `${resolvedValue.trim().split(/\s+/).length} words` : 'Empty message'}
              </span>
            </div>
            {resolvedValue.trim().length ? (
              <div className="mt-2 space-y-2 whitespace-pre-wrap text-sm text-slate-600">
                {resolvedValue.trim().split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-400">Add a message to preview it.</p>
            )}
            {links.length ? (
              <ul className="mt-3 space-y-1 text-xs text-slate-500">
                {links.map((link) => (
                  <li key={`preview-${link.id}`} className="flex items-center gap-2">
                    <LinkIcon className="h-3.5 w-3.5 text-accent" />
                    <span className="truncate">{link.title}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        {links.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {links.map((link) => (
              <LinkChip key={link.id} link={link} onRemove={handleRemoveLink} />
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
          Align quickly with saved replies, curated links, and rich formatting built for premium partnerships.
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

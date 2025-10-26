import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckIcon,
  ClockIcon,
  FaceSmileIcon,
  HashtagIcon,
  PhotoIcon,
  ShareIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import UserAvatar from '../../UserAvatar.jsx';
import EmojiQuickPickerPopover from '../../popovers/EmojiQuickPickerPopover.jsx';
import GifSuggestionPopover from '../../popovers/GifSuggestionPopover.jsx';
import { formatRelativeTime } from '../../../utils/date.js';
import {
  ContentModerationError,
  moderateFeedComposerPayload,
  sanitiseExternalLink,
} from '../../../utils/contentModeration.js';
import { COMPOSER_OPTIONS } from '../../../constants/feedMeta.js';
import {
  COMPOSER_AUDIENCE_OPTIONS,
  COMPOSER_PERSONA_PROMPTS,
  COMPOSER_SUGGESTED_HASHTAGS,
  MAX_CONTENT_LENGTH,
  resolvePersonaKey,
} from './feedUtils.js';

function MediaAttachmentPreview({ attachment, onRemove }) {
  if (!attachment) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-inner">
      <div className="relative">
        <img
          src={attachment.url}
          alt={attachment.alt || 'Feed media attachment'}
          className="h-48 w-full object-cover"
          loading="lazy"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-4 top-4 inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-white"
        >
          Remove media
        </button>
      </div>
      {attachment.alt ? (
        <p className="border-t border-slate-200 px-4 py-2 text-xs text-slate-500">{attachment.alt}</p>
      ) : null}
    </div>
  );
}

export default function FeedComposer({ onCreate, session }) {
  const personaKey = useMemo(() => resolvePersonaKey(session), [session]);
  const personaPrompts = useMemo(
    () => COMPOSER_PERSONA_PROMPTS[personaKey] ?? COMPOSER_PERSONA_PROMPTS.default,
    [personaKey],
  );
  const defaultPromptId = personaPrompts[0]?.id ?? null;
  const [mode, setMode] = useState('update');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentAlt, setAttachmentAlt] = useState('');
  const [audience, setAudience] = useState('network');
  const [shareToDigest, setShareToDigest] = useState(false);
  const [scheduleMode, setScheduleMode] = useState('now');
  const [scheduledFor, setScheduledFor] = useState('');
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [selectedPromptId, setSelectedPromptId] = useState(defaultPromptId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [draftStatus, setDraftStatus] = useState('loading');
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [showGifTray, setShowGifTray] = useState(false);
  const textareaId = useId();
  const linkInputId = useId();
  const mediaAltId = useId();
  const scheduleInputId = useId();
  const composerStorageKey = useMemo(() => `timeline:composer:${session?.id ?? 'guest'}`, [session?.id]);
  const storageReadyRef = useRef(false);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      storageReadyRef.current = true;
      setDraftStatus('clean');
      return;
    }
    try {
      const raw = window.localStorage.getItem(composerStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setMode(parsed.mode ?? 'update');
        setContent(parsed.content ?? '');
        setLink(parsed.link ?? '');
        setAttachment(parsed.attachment ?? null);
        setAttachmentAlt(parsed.attachmentAlt ?? '');
        setAudience(parsed.audience ?? 'network');
        setShareToDigest(Boolean(parsed.shareToDigest));
        setScheduleMode(parsed.scheduleMode ?? 'now');
        setScheduledFor(parsed.scheduledFor ?? '');
        setSelectedHashtags(Array.isArray(parsed.hashtags) ? parsed.hashtags : []);
        setSelectedPromptId(parsed.promptId ?? defaultPromptId ?? null);
        if (parsed.updatedAt) {
          const updatedAt = new Date(parsed.updatedAt);
          if (!Number.isNaN(updatedAt.getTime())) {
            setLastSavedAt(updatedAt);
          }
        }
        setDraftStatus('saved');
      } else {
        setDraftStatus('clean');
      }
    } catch (storageError) {
      setDraftStatus('error');
    } finally {
      storageReadyRef.current = true;
    }
  }, [composerStorageKey, defaultPromptId]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!storageReadyRef.current || typeof window === 'undefined') {
      return undefined;
    }
    setDraftStatus((previous) => (previous === 'loading' ? 'loading' : 'saving'));
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      try {
        const payload = {
          mode,
          content,
          link,
          attachment: attachment
            ? {
                id: attachment.id ?? null,
                type: attachment.type ?? null,
                url: attachment.url ?? null,
                alt: attachment.alt ?? attachmentAlt ?? null,
              }
            : null,
          attachmentAlt,
          audience,
          shareToDigest,
          scheduleMode,
          scheduledFor,
          hashtags: selectedHashtags,
          promptId: selectedPromptId,
          updatedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(composerStorageKey, JSON.stringify(payload));
        const savedAt = new Date(payload.updatedAt);
        if (!Number.isNaN(savedAt.getTime())) {
          setLastSavedAt(savedAt);
        }
        setDraftStatus('saved');
      } catch (storageError) {
        setDraftStatus('error');
      }
    }, 600);
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    attachment,
    attachmentAlt,
    audience,
    composerStorageKey,
    content,
    link,
    mode,
    scheduleMode,
    scheduledFor,
    selectedHashtags,
    selectedPromptId,
    shareToDigest,
  ]);

  const selectedOption = useMemo(
    () => COMPOSER_OPTIONS.find((option) => option.id === mode) ?? COMPOSER_OPTIONS[0],
    [mode],
  );
  const remainingCharacters = Math.max(0, MAX_CONTENT_LENGTH - content.length);

  const toggleHashtag = useCallback((tag) => {
    setSelectedHashtags((previous) => {
      if (previous.includes(tag)) {
        return previous.filter((existing) => existing !== tag);
      }
      setContent((current) => {
        if (!current.toLowerCase().includes(tag.toLowerCase())) {
          return current ? `${current} ${tag}` : tag;
        }
        return current;
      });
      return [...previous, tag];
    });
    setError(null);
  }, []);

  const handlePromptInsert = useCallback((prompt) => {
    if (!prompt) {
      return;
    }
    setSelectedPromptId(prompt.id);
    setContent((current) => {
      if (!current.trim()) {
        return `${prompt.headline}\n\n${prompt.body}`;
      }
      if (current.includes(prompt.body)) {
        return current;
      }
      return `${current.trim()}\n\n${prompt.body}`;
    });
    setError(null);
  }, []);

  const handleClearDraft = useCallback(() => {
    setMode('update');
    setContent('');
    setLink('');
    setAttachment(null);
    setAttachmentAlt('');
    setAudience('network');
    setShareToDigest(false);
    setScheduleMode('now');
    setScheduledFor('');
    setSelectedHashtags([]);
    setSelectedPromptId(defaultPromptId ?? null);
    setDraftStatus('clean');
    setLastSavedAt(null);
    setShowEmojiTray(false);
    setShowGifTray(false);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(composerStorageKey);
    }
  }, [composerStorageKey, defaultPromptId]);

  const scheduledTimestamp =
    scheduleMode === 'schedule' && scheduledFor ? new Date(scheduledFor).toISOString() : null;

  const publishDisabled =
    submitting || !content.trim() || (scheduleMode === 'schedule' && !scheduledTimestamp);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting || publishDisabled) {
      if (!content.trim()) {
        setError({ message: 'Compose an update before publishing.' });
      }
      if (scheduleMode === 'schedule' && !scheduledTimestamp) {
        setError({ message: 'Choose a future time to schedule your post.' });
      }
      return;
    }

    if (scheduleMode === 'schedule' && scheduledTimestamp) {
      const scheduledDate = new Date(scheduledTimestamp);
      if (Number.isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
        setError({ message: 'Scheduled time must be in the future.' });
        return;
      }
    }

    const draftPayload = {
      type: mode,
      content,
      summary: content,
      link: sanitiseExternalLink(link),
      mediaAttachments: attachment
        ? [
            {
              id: attachment.id,
              type: attachment.type,
              url: attachment.url,
              alt: attachmentAlt?.trim() || attachment.alt,
            },
          ]
        : [],
    };

    let moderated;
    try {
      moderated = moderateFeedComposerPayload(draftPayload);
    } catch (moderationError) {
      if (moderationError instanceof ContentModerationError) {
        setError({
          message: moderationError.message,
          reasons: moderationError.reasons,
        });
        return;
      }
      setError({
        message: moderationError?.message || 'We could not publish your update. Please try again in a moment.',
      });
      return;
    }

    const payload = {
      type: mode,
      content: moderated.content,
      link: moderated.link,
      mediaAttachments: moderated.attachments,
      hashtags: selectedHashtags,
      visibility: audience === 'public' ? 'public' : audience === 'mentors' ? 'mentors' : 'connections',
      shareToDigest,
      scheduleMode,
      scheduledFor: scheduledTimestamp,
      promptId: selectedPromptId,
      composerPersona: personaKey,
    };

    if (!payload.scheduledFor) {
      delete payload.scheduledFor;
    }

    setSubmitting(true);
    setError(null);
    try {
      await Promise.resolve(onCreate(payload));
      handleClearDraft();
    } catch (composerError) {
      if (composerError instanceof ContentModerationError) {
        setError({ message: composerError.message, reasons: composerError.reasons });
      } else {
        const message =
          composerError?.message || 'We could not publish your update. Please try again in a moment.';
        setError({ message });
      }
    } finally {
      setSubmitting(false);
      setShowEmojiTray(false);
      setShowGifTray(false);
    }
  };

  const activeAudience =
    COMPOSER_AUDIENCE_OPTIONS.find((option) => option.id === audience) ?? COMPOSER_AUDIENCE_OPTIONS[0];
  const publishLabel = scheduleMode === 'schedule' ? 'Schedule update' : 'Publish to timeline';
  const personaInsight =
    personaPrompts.find((prompt) => prompt.id === selectedPromptId) ?? personaPrompts[0] ?? null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <UserAvatar name={session?.name} seed={session?.avatarSeed ?? session?.name} size="md" />
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-800">
                {personaInsight ? personaInsight.headline : 'Share with your network'}
              </p>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
                {activeAudience.label}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {personaInsight
                ? personaInsight.body
                : 'Celebrate a win, spotlight an opportunity, or invite the community to collaborate.'}
            </div>
            <div className="relative">
              <label htmlFor={textareaId} className="sr-only">
                Compose timeline update
              </label>
              <textarea
                id={textareaId}
                value={content}
                onChange={(event) => {
                  setContent(event.target.value.slice(0, MAX_CONTENT_LENGTH));
                  setError(null);
                }}
                rows={5}
                maxLength={MAX_CONTENT_LENGTH}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-base text-slate-900 shadow-inner transition focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/20"
                placeholder={`Share an update about ${selectedOption.label.toLowerCase()}…`}
                disabled={submitting}
              />
              <div className="pointer-events-none absolute bottom-3 right-4 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                {remainingCharacters}
              </div>
            </div>
            <p className="text-xs text-slate-500">{selectedOption.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-y border-slate-200 py-4">
          {COMPOSER_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = option.id === mode;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  if (!submitting) {
                    setMode(option.id);
                  }
                }}
                disabled={submitting}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-accent text-white shadow-soft'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </button>
            );
          })}
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
            <div className="space-y-2">
              <label htmlFor={linkInputId} className="text-xs font-medium text-slate-600">
                Attach a resource (deck, doc, or listing URL)
              </label>
              <input
                id={linkInputId}
                value={link}
                onChange={(event) => {
                  setLink(event.target.value);
                  setError(null);
                }}
                placeholder="https://"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                disabled={submitting}
              />
            </div>
            <div className="space-y-2 text-xs text-slate-500">
              <p className="font-medium text-slate-600">Need inspiration?</p>
              <p>
                Opportunity posts automatically appear inside Explorer with the right filters so talent can discover them alongside
                jobs, gigs, projects, volunteering missions, and Launchpad cohorts.
              </p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tailored prompts</p>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {personaPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    type="button"
                    onClick={() => handlePromptInsert(prompt)}
                    className={`flex h-full flex-col justify-between rounded-2xl border px-4 py-3 text-left transition ${
                      selectedPromptId === prompt.id
                        ? 'border-accent bg-accent/5 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-accent/40 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800">{prompt.headline}</p>
                      <p className="mt-2 text-xs text-slate-500 line-clamp-3">{prompt.body}</p>
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wide text-accent">
                      <SparklesIcon className="h-3.5 w-3.5" />
                      Insert prompt
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Suggested hashtags</p>
              <div className="flex flex-wrap gap-2">
                {COMPOSER_SUGGESTED_HASHTAGS.map((tag) => {
                  const isActive = selectedHashtags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleHashtag(tag)}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.7rem] font-semibold transition ${
                        isActive
                          ? 'border-accent bg-accent text-white shadow-sm'
                          : 'border-slate-200 bg-slate-100 text-slate-600 hover:border-accent/40 hover:text-accent'
                      }`}
                    >
                      <HashtagIcon className="h-3.5 w-3.5" />
                      {tag.replace('#', '')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Audience</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {COMPOSER_AUDIENCE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = option.id === audience;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setAudience(option.id);
                        setError(null);
                      }}
                      className={`flex h-full flex-col items-start gap-2 rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? 'border-accent bg-accent/5 text-accent shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-accent/40 hover:shadow-sm'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-semibold text-slate-800">{option.label}</span>
                      <span className="text-[0.7rem] text-slate-500">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Delivery</p>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-inner">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleMode('now');
                      setError(null);
                    }}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide transition ${
                      scheduleMode === 'now'
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <ClockIcon className="h-3.5 w-3.5" />
                    Share now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleMode('schedule');
                      setError(null);
                    }}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide transition ${
                      scheduleMode === 'schedule'
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <CalendarDaysIcon className="h-3.5 w-3.5" />
                    Schedule
                  </button>
                </div>
                {scheduleMode === 'schedule' ? (
                  <div className="mt-3 space-y-2">
                    <label htmlFor={scheduleInputId} className="text-xs font-medium text-slate-600">
                      Pick a time (local timezone)
                    </label>
                    <input
                      id={scheduleInputId}
                      type="datetime-local"
                      min={new Date().toISOString().slice(0, 16)}
                      value={scheduledFor}
                      onChange={(event) => {
                        setScheduledFor(event.target.value);
                        setError(null);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => setShareToDigest((previous) => !previous)}
                  className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide transition ${
                    shareToDigest ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  Include in weekly digest
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowGifTray(false);
                  setShowEmojiTray((previous) => !previous);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-transparent bg-slate-100 px-3 py-2 font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <FaceSmileIcon className="h-4 w-4" />
                Emoji
              </button>
              <EmojiQuickPickerPopover
                open={showEmojiTray}
                onClose={() => setShowEmojiTray(false)}
                onSelect={(emoji) => setContent((previous) => `${previous}${emoji}`)}
                labelledBy="composer-emoji-trigger"
              />
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowEmojiTray(false);
                  setShowGifTray((previous) => !previous);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-transparent bg-slate-100 px-3 py-2 font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <PhotoIcon className="h-4 w-4" />
                GIF & media
              </button>
              <GifSuggestionPopover
                open={showGifTray}
                onClose={() => setShowGifTray(false)}
                onSelect={(gif) => {
                  setAttachment({ id: gif.id, type: 'gif', url: gif.url, alt: gif.tone });
                  setAttachmentAlt(gif.tone);
                  setError(null);
                }}
                labelledBy="composer-gif-trigger"
              />
            </div>
          </div>
          {attachment ? (
            <div className="space-y-2">
              <label htmlFor={mediaAltId} className="text-xs font-medium text-slate-600">
                Media alt text
              </label>
              <input
                id={mediaAltId}
                value={attachmentAlt}
                onChange={(event) => setAttachmentAlt(event.target.value)}
                maxLength={120}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-inner focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="Describe the media for improved accessibility"
              />
              <MediaAttachmentPreview
                attachment={{ ...attachment, alt: attachmentAlt }}
                onRemove={() => {
                  setAttachment(null);
                  setAttachmentAlt('');
                }}
              />
            </div>
          ) : null}
          {error ? (
            <div
              className="space-y-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-inner"
              role="alert"
            >
              <p className="font-semibold">{error.message}</p>
              {Array.isArray(error.reasons) && error.reasons.length ? (
                <ul className="list-disc space-y-1 pl-5 text-xs text-rose-600">
                  {error.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
            <span>
              {draftStatus === 'saving'
                ? 'Saving draft…'
                : draftStatus === 'error'
                ? 'Draft not saved'
                : lastSavedAt
                ? `Saved ${formatRelativeTime(lastSavedAt)}`
                : 'Autosave ready'}
            </span>
            <button
              type="button"
              onClick={handleClearDraft}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500 transition hover:border-rose-200 hover:text-rose-500"
            >
              Clear draft
            </button>
          </div>
          <button
            type="submit"
            disabled={publishDisabled}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-soft transition ${
              publishDisabled ? 'cursor-not-allowed bg-accent/50' : 'bg-accent hover:bg-accentDark'
            }`}
          >
            {submitting ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ShareIcon className="h-4 w-4" />}
            {submitting ? (scheduleMode === 'schedule' ? 'Scheduling…' : 'Publishing…') : publishLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

import { useId, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  FaceSmileIcon,
  PhotoIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import UserAvatar from '../UserAvatar.jsx';
import EmojiQuickPickerPopover from '../popovers/EmojiQuickPickerPopover.jsx';
import GifSuggestionPopover from '../popovers/GifSuggestionPopover.jsx';
import {
  ContentModerationError,
  moderateFeedComposerPayload,
  sanitiseExternalLink,
} from '../../utils/contentModeration.js';
import { COMPOSER_OPTIONS } from '../../constants/feedMeta.js';

const MAX_CONTENT_LENGTH = 2200;

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

MediaAttachmentPreview.propTypes = {
  attachment: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    url: PropTypes.string,
    alt: PropTypes.string,
  }),
  onRemove: PropTypes.func,
};

MediaAttachmentPreview.defaultProps = {
  attachment: null,
  onRemove: undefined,
};

function FeedComposer({ onCreate, session }) {
  const [mode, setMode] = useState('update');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentAlt, setAttachmentAlt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [showGifTray, setShowGifTray] = useState(false);
  const textareaId = useId();
  const linkInputId = useId();
  const mediaAltId = useId();

  const selectedOption = COMPOSER_OPTIONS.find((option) => option.id === mode) ?? COMPOSER_OPTIONS[0];
  const remainingCharacters = MAX_CONTENT_LENGTH - content.length;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) {
      return;
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
    };

    setSubmitting(true);
    setError(null);
    try {
      await Promise.resolve(onCreate(payload));
      setContent('');
      setLink('');
      setAttachment(null);
      setAttachmentAlt('');
      setMode('update');
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

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <UserAvatar name={session?.name} seed={session?.avatarSeed ?? session?.name} size="md" />
          <div className="flex-1 space-y-4">
            <p className="text-sm font-semibold text-slate-800">Share with your network</p>
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
                }}
                labelledBy="composer-gif-trigger"
              />
            </div>
          </div>
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
                Opportunity posts automatically appear inside Explorer with the right filters so talent can discover them alongside jobs, gigs, projects, volunteering missions, and Launchpad cohorts.
              </p>
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
          <p>Your update is routed to followers, connections, and workspace partners.</p>
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-soft transition ${
              submitting || !content.trim()
                ? 'cursor-not-allowed bg-accent/50'
                : 'bg-accent hover:bg-accentDark'
            }`}
          >
            {submitting ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <ShareIcon className="h-4 w-4" />}
            {submitting ? 'Publishing…' : 'Publish to timeline'}
          </button>
        </div>
      </form>
    </div>
  );
}

FeedComposer.propTypes = {
  onCreate: PropTypes.func.isRequired,
  session: PropTypes.shape({
    name: PropTypes.string,
    avatarSeed: PropTypes.string,
  }),
};

FeedComposer.defaultProps = {
  session: null,
};

export default FeedComposer;
export { MAX_CONTENT_LENGTH };

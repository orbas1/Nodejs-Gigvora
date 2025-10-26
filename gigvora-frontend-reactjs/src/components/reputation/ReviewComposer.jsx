import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PaperClipIcon,
  SparklesIcon,
  StarIcon,
  UserCircleIcon,
} from '@heroicons/react/24/solid';
import { ListBulletIcon, MegaphoneIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useDataFetchingLayer } from '../../context/DataFetchingLayer.js';
import { useTheme } from '../../context/ThemeProvider.tsx';
import analytics from '../../services/analytics.js';

const FALLBACK_PERSONA_OPTIONS = [
  { value: 'client', label: 'Client sponsor' },
  { value: 'mentor', label: 'Mentor / advisor' },
  { value: 'teammate', label: 'Collaborator' },
];

const FALLBACK_PROMPTS = [
  {
    id: 'prompt-delivery',
    persona: 'client',
    label: 'Delivery transformation',
    headline: 'Share the before-and-after impact of this engagement.',
    template:
      'Before working together we were facing… After the engagement we achieved… Specific moments that stood out were… I would recommend this partner to…',
  },
  {
    id: 'prompt-mentor',
    persona: 'mentor',
    label: 'Mentorship journey',
    headline: 'Celebrate coaching breakthroughs and growth.',
    template:
      'Over the last quarter we collaborated on… The most impressive shift I saw was… They consistently demonstrated… Our next milestone is…',
  },
  {
    id: 'prompt-collab',
    persona: 'teammate',
    label: 'Cross-functional collaboration',
    headline: 'Highlight partnership moments across pods.',
    template:
      'We partnered to deliver… Their unique contribution was… When obstacles surfaced they… Teams across product, design, and ops benefited by…',
  },
];

const FALLBACK_TAGS = [
  { value: 'strategy', label: 'Strategy' },
  { value: 'delivery', label: 'Delivery excellence' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'operations', label: 'Operations' },
  { value: 'mentorship', label: 'Mentorship' },
];

const FALLBACK_GUIDELINES = [
  'Keep feedback specific—call out transformation moments, measurable outcomes, and collaboration quality.',
  'Respect confidentiality. Remove sensitive client data unless approval is logged.',
  'Aim for 80–200 words so prospects gain depth without overwhelming detail.',
  'Flag private insights by toggling visibility—private notes still fuel reputation insights.',
];

const FALLBACK_AUDIENCE = [
  { value: 'public', label: 'Public network' },
  { value: 'gigvora', label: 'Gigvora members only' },
  { value: 'private', label: 'Private feedback (only talent)' },
];

function isBrowser() {
  return typeof window !== 'undefined';
}

const MIN_REVIEW_LENGTH = 60;
const MAX_REVIEW_LENGTH = 1200;

export default function ReviewComposer({
  freelancerId,
  personaOptions,
  promptLibrary,
  tagLibrary,
  guidelines,
  defaultAudience,
  defaultVisibility,
  ratingBaseline,
  totalReviews,
  onReviewCreated,
}) {
  const personas = useMemo(() => (Array.isArray(personaOptions) && personaOptions.length ? personaOptions : FALLBACK_PERSONA_OPTIONS), [personaOptions]);
  const prompts = useMemo(() => (Array.isArray(promptLibrary) && promptLibrary.length ? promptLibrary : FALLBACK_PROMPTS), [promptLibrary]);
  const tags = useMemo(() => (Array.isArray(tagLibrary) && tagLibrary.length ? tagLibrary : FALLBACK_TAGS), [tagLibrary]);
  const guardrails = useMemo(() => (Array.isArray(guidelines) && guidelines.length ? guidelines : FALLBACK_GUIDELINES), [guidelines]);
  const audiences = useMemo(() => (Array.isArray(defaultAudience) && defaultAudience.length ? defaultAudience : FALLBACK_AUDIENCE), [defaultAudience]);

  const initialPersona = personas[0]?.value ?? 'client';
  const [form, setForm] = useState({
    persona: initialPersona,
    rating: 5,
    title: '',
    comment: '',
    tags: [],
    attachments: [],
    recommend: true,
    visibility: defaultVisibility ?? 'public',
    audience: audiences[0]?.value ?? 'public',
    promptId: null,
  });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [shareableDraftRestored, setShareableDraftRestored] = useState(false);
  const [attachmentDraft, setAttachmentDraft] = useState({ label: '', url: '' });

  const draftKey = useMemo(() => (freelancerId ? `gigvora:review-composer:${freelancerId}` : 'gigvora:review-composer:draft'), [freelancerId]);

  const { mutateResource, buildKey } = useDataFetchingLayer();
  const { tokens, registerComponentTokens, removeComponentTokens, resolveComponentTokens } = useTheme();
  const themeTokens = useMemo(() => resolveComponentTokens?.('ReviewComposer') ?? {}, [resolveComponentTokens, tokens?.colors?.accent]);
  const accent = themeTokens.colors?.accent ?? tokens?.colors?.accent ?? '#2563eb';

  useEffect(() => {
    registerComponentTokens?.('ReviewComposer', {
      colors: {
        accent: tokens?.colors?.accent ?? '#2563eb',
      },
    });
    return () => removeComponentTokens?.('ReviewComposer');
  }, [registerComponentTokens, removeComponentTokens, tokens?.colors?.accent]);

  useEffect(() => {
    if (!isBrowser()) {
      return;
    }
    try {
      const stored = window.localStorage.getItem(draftKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setForm((previous) => ({ ...previous, ...parsed }));
        setShareableDraftRestored(true);
      }
    } catch (storageError) {
      console.warn('Unable to restore review composer draft', storageError);
    }
  }, [draftKey]);

  useEffect(() => {
    if (!isBrowser()) {
      return undefined;
    }
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(draftKey, JSON.stringify(form));
      } catch (storageError) {
        console.warn('Unable to persist review composer draft', storageError);
      }
    }, 200);
    return () => window.clearTimeout(timeout);
  }, [draftKey, form]);

  const activePrompts = useMemo(
    () => prompts.filter((prompt) => !prompt.persona || prompt.persona === form.persona),
    [prompts, form.persona],
  );

  const reviewsPath = useMemo(() => {
    if (!freelancerId) {
      return null;
    }
    return `/reputation/freelancers/${encodeURIComponent(freelancerId)}/reviews`;
  }, [freelancerId]);

  const reviewsCacheKey = useMemo(() => {
    if (!reviewsPath) {
      return null;
    }
    return buildKey('GET', reviewsPath, { limit: 50 });
  }, [buildKey, reviewsPath]);

  const remainingCharacters = Math.max(0, MAX_REVIEW_LENGTH - form.comment.length);
  const meetsMinimum = form.comment.trim().length >= MIN_REVIEW_LENGTH;

  const handlePersonaChange = (value) => {
    setForm((previous) => ({ ...previous, persona: value, promptId: null }));
    analytics.track('review_composer_persona_selected', { persona: value });
  };

  const handleRatingChange = (value) => {
    setForm((previous) => ({ ...previous, rating: value }));
  };

  const handlePromptApply = (prompt) => {
    setForm((previous) => ({
      ...previous,
      promptId: prompt.id,
      comment: previous.comment?.length ? `${previous.comment.trim()}\n\n${prompt.template}` : prompt.template,
      title: previous.title?.length ? previous.title : prompt.headline ?? previous.title,
    }));
    analytics.track('review_composer_prompt_applied', { promptId: prompt.id, persona: prompt.persona });
  };

  const handleTagToggle = (tagValue) => {
    setForm((previous) => {
      const hasTag = previous.tags.includes(tagValue);
      return {
        ...previous,
        tags: hasTag ? previous.tags.filter((tag) => tag !== tagValue) : [...previous.tags, tagValue],
      };
    });
  };

  const handleAttachmentAdd = () => {
    const label = attachmentDraft.label.trim();
    const url = attachmentDraft.url.trim();
    if (!label || !url) {
      return;
    }
    setForm((previous) => ({
      ...previous,
      attachments: [...previous.attachments, { id: `${Date.now()}`, label, url }],
    }));
    setAttachmentDraft({ label: '', url: '' });
  };

  const handleAttachmentRemove = (id) => {
    setForm((previous) => ({
      ...previous,
      attachments: previous.attachments.filter((attachment) => attachment.id !== id),
    }));
  };

  const handleClearDraft = () => {
    setForm({
      persona: initialPersona,
      rating: 5,
      title: '',
      comment: '',
      tags: [],
      attachments: [],
      recommend: true,
      visibility: defaultVisibility ?? 'public',
      audience: audiences[0]?.value ?? 'public',
      promptId: null,
    });
    setStatus('idle');
    setError(null);
    if (isBrowser()) {
      window.localStorage.removeItem(draftKey);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (!freelancerId) {
      setError('You must be signed in to publish a review.');
      return;
    }
    if (!meetsMinimum) {
      setError(`Please provide at least ${MIN_REVIEW_LENGTH} characters of detail.`);
      return;
    }
    if (form.comment.length > MAX_REVIEW_LENGTH) {
      setError('Reviews must be concise—trim your feedback before publishing.');
      return;
    }

    setStatus('saving');
    setError(null);

    const payload = {
      rating: form.rating,
      title: form.title?.trim() || null,
      comment: form.comment.trim(),
      persona: form.persona,
      tags: form.tags,
      attachments: form.attachments,
      recommend: form.recommend,
      visibility: form.visibility,
      audience: form.audience,
      promptId: form.promptId,
      context: {
        length: form.comment.trim().length,
        attachments: form.attachments.length,
        restoredDraft: shareableDraftRestored,
        ratingBaseline,
        totalReviews,
      },
    };

    try {
      await mutateResource(reviewsPath, {
        method: 'POST',
        body: payload,
        invalidate: reviewsCacheKey ? [reviewsCacheKey] : undefined,
        metadata: { component: 'ReviewComposer', persona: form.persona },
      });
      analytics.track('review_composer_submitted', {
        freelancerId,
        persona: form.persona,
        rating: form.rating,
        tags: form.tags,
        attachments: form.attachments.length,
        promptId: form.promptId,
      });
      setStatus('success');
      if (isBrowser()) {
        window.localStorage.removeItem(draftKey);
      }
      setForm((previous) => ({
        ...previous,
        title: '',
        comment: '',
        tags: [],
        attachments: [],
        promptId: null,
      }));
      onReviewCreated?.(payload);
    } catch (mutationError) {
      setStatus('error');
      setError(mutationError?.message ?? 'We could not publish your review. Please try again.');
    }
  };

  return (
    <section className="rounded-4xl border border-slate-200 bg-white/95 p-6 shadow-soft">
      <form className="space-y-6" onSubmit={submitReview}>
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent/80">Review composer</p>
            <h3 className="text-xl font-semibold text-slate-900">Capture a spotlight-worthy testimonial</h3>
            <p className="max-w-xl text-sm text-slate-600">
              Guided prompts, persona-aware tone, and attachment slots help clients and mentors share vivid stories that elevate
              reputation signals across LinkedIn-class surfaces.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-xs text-slate-500">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              <SparklesIcon className="h-4 w-4 text-amber-500" aria-hidden="true" />
              {ratingBaseline != null ? `${ratingBaseline.toFixed(1)} / 5.0 avg rating` : 'Publish premium feedback'}
            </div>
            {totalReviews != null ? <span>{totalReviews} reviews live</span> : null}
            {shareableDraftRestored ? <span className="text-emerald-600">Draft restored</span> : null}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
          <div className="space-y-5">
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Persona</label>
              <div className="flex flex-wrap gap-2">
                {personas.map((persona) => (
                  <button
                    key={persona.value}
                    type="button"
                    onClick={() => handlePersonaChange(persona.value)}
                    className={clsx(
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
                      form.persona === persona.value
                        ? 'border-accent bg-accent text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-accent/60 hover:text-accent',
                    )}
                  >
                    <UserCircleIcon className="h-4 w-4" aria-hidden="true" />
                    {persona.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rating</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleRatingChange(rating)}
                    className={clsx(
                      'flex h-10 w-10 items-center justify-center rounded-full border transition',
                      rating <= form.rating
                        ? 'border-amber-200 bg-amber-50 text-amber-600'
                        : 'border-slate-200 bg-white text-slate-400 hover:border-amber-200 hover:text-amber-600',
                    )}
                    aria-label={`Rate ${rating} star${rating === 1 ? '' : 's'}`}
                  >
                    <StarIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                ))}
                <label className="ml-4 inline-flex items-center gap-2 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-accent"
                    checked={form.recommend}
                    onChange={(event) => setForm((previous) => ({ ...previous, recommend: event.target.checked }))}
                  />
                  Recommend to network
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="review-title" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Title
              </label>
              <input
                id="review-title"
                type="text"
                value={form.title}
                onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
                placeholder="Headline that summarises the impact"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                maxLength={160}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="review-comment" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Story
                </label>
                <span className={clsx('text-xs', remainingCharacters < 60 ? 'text-rose-500' : 'text-slate-400')}>
                  {remainingCharacters} characters remaining
                </span>
              </div>
              <textarea
                id="review-comment"
                value={form.comment}
                onChange={(event) => setForm((previous) => ({ ...previous, comment: event.target.value }))}
                placeholder="Capture context, outcomes, and how this collaboration felt to partners."
                className="h-40 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                maxLength={MAX_REVIEW_LENGTH}
              />
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <MegaphoneIcon className="h-4 w-4 text-accent" aria-hidden="true" />
                {meetsMinimum ? 'Great detail! ' : `Add ${MIN_REVIEW_LENGTH - form.comment.trim().length} more characters for publishing.`}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Focus tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => handleTagToggle(tag.value)}
                    className={clsx(
                      'rounded-full px-4 py-2 text-xs font-semibold transition',
                      form.tags.includes(tag.value)
                        ? 'bg-accent text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-accent/60 hover:text-accent',
                    )}
                  >
                    #{tag.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attachments</label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Attachment label"
                  value={attachmentDraft.label}
                  onChange={(event) => setAttachmentDraft((previous) => ({ ...previous, label: event.target.value }))}
                  className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <input
                  type="url"
                  placeholder="https://"
                  value={attachmentDraft.url}
                  onChange={(event) => setAttachmentDraft((previous) => ({ ...previous, url: event.target.value }))}
                  className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="button"
                  onClick={handleAttachmentAdd}
                  className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent/90"
                >
                  <PaperClipIcon className="h-4 w-4" aria-hidden="true" />
                  Add asset
                </button>
              </div>
              {form.attachments.length ? (
                <ul className="space-y-2 text-sm text-slate-600">
                  {form.attachments.map((attachment) => (
                    <li
                      key={attachment.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <PaperClipIcon className="h-4 w-4 text-accent" aria-hidden="true" />
                        <span className="font-semibold text-slate-900">{attachment.label}</span>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent underline"
                        >
                          {attachment.url}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAttachmentRemove(attachment.id)}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-600"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col space-y-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Visibility
                <select
                  value={form.visibility}
                  onChange={(event) => setForm((previous) => ({ ...previous, visibility: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="public">Public showcase</option>
                  <option value="private">Private feedback</option>
                  <option value="workspace">Workspace only</option>
                </select>
              </label>
              <label className="flex flex-col space-y-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Audience
                <select
                  value={form.audience}
                  onChange={(event) => setForm((previous) => ({ ...previous, audience: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  {audiences.map((audience) => (
                    <option key={audience.value} value={audience.value}>
                      {audience.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <aside className="space-y-5 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">Guided prompts</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                {activePrompts.map((prompt) => (
                  <li key={prompt.id} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{prompt.label}</p>
                        <p className="text-xs text-slate-500">{prompt.headline}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handlePromptApply(prompt)}
                        className="text-xs font-semibold text-accent hover:text-accent/80"
                      >
                        Apply
                      </button>
                    </div>
                    <p className="mt-3 whitespace-pre-line text-xs text-slate-500">{prompt.template}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-900">Guidelines</h4>
              <ul className="space-y-2 text-xs text-slate-500">
                {guardrails.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <ListBulletIcon className="mt-0.5 h-4 w-4 text-accent" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-700">
              <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
              Drafts save automatically. Toggle visibility for private coaching moments; they still power trust telemetry.
            </div>
          </aside>
        </div>

        {error ? (
          <div className="inline-flex w-full items-start gap-3 rounded-3xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">We couldn&apos;t publish this review</p>
              <p className="text-xs text-rose-600/90">{error}</p>
            </div>
          </div>
        ) : null}

        {status === 'success' ? (
          <div className="inline-flex w-full items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-700">
            <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold">Review submitted</p>
              <p className="text-xs text-emerald-600/90">Thanks for sharing a premium story. It will appear in the endorsement wall shortly.</p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={status === 'saving' || !meetsMinimum}
            className={clsx(
              'inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm transition',
              status === 'saving'
                ? 'bg-slate-400'
                : meetsMinimum
                ? 'bg-accent hover:bg-accent/90'
                : 'bg-slate-300',
            )}
          >
            {status === 'saving' ? <ArrowPathIcon className="h-4 w-4 animate-spin" aria-hidden="true" /> : <SparklesIcon className="h-4 w-4" aria-hidden="true" />}
            {status === 'saving' ? 'Publishing…' : 'Publish review'}
          </button>
          <button
            type="button"
            onClick={handleClearDraft}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/60 hover:text-accent"
          >
            Clear draft
          </button>
        </div>
      </form>
    </section>
  );
}

ReviewComposer.propTypes = {
  freelancerId: PropTypes.string,
  personaOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  promptLibrary: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      persona: PropTypes.string,
      label: PropTypes.string,
      headline: PropTypes.string,
      template: PropTypes.string,
    }),
  ),
  tagLibrary: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  guidelines: PropTypes.arrayOf(PropTypes.string),
  defaultAudience: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  defaultVisibility: PropTypes.string,
  ratingBaseline: PropTypes.number,
  totalReviews: PropTypes.number,
  onReviewCreated: PropTypes.func,
};

ReviewComposer.defaultProps = {
  freelancerId: undefined,
  personaOptions: undefined,
  promptLibrary: undefined,
  tagLibrary: undefined,
  guidelines: undefined,
  defaultAudience: undefined,
  defaultVisibility: 'public',
  ratingBaseline: undefined,
  totalReviews: undefined,
  onReviewCreated: undefined,
};

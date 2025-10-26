import { useMemo, useState } from 'react';
import {
  ArrowUpTrayIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  XMarkIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/solid';
import { PhotoIcon, TagIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import UserAvatar from '../UserAvatar.jsx';
import classNames from '../../utils/classNames.js';

const RATING_SCALE = [1, 2, 3, 4, 5];

function RatingStar({ value, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={selected}
      aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
      className={classNames(
        'flex h-12 w-12 items-center justify-center rounded-full border text-lg font-semibold transition',
        selected
          ? 'border-amber-300 bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 text-amber-900 shadow-[0_10px_30px_rgba(250,204,21,0.45)]'
          : 'border-slate-200 bg-white/80 text-slate-400 hover:border-amber-200 hover:text-amber-400',
      )}
    >
      {value}
    </button>
  );
}

RatingStar.propTypes = {
  value: PropTypes.number.isRequired,
  selected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};

RatingStar.defaultProps = {
  selected: false,
};

function PromptCard({ prompt, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(prompt)}
      className={classNames(
        'rounded-3xl border px-4 py-3 text-left text-sm transition',
        active
          ? 'border-blue-300 bg-blue-50/70 text-blue-700 shadow-sm'
          : 'border-slate-200 bg-white/70 text-slate-600 hover:border-blue-200 hover:text-blue-600',
      )}
    >
      <p className="font-semibold text-slate-900">{prompt.title}</p>
      <p className="mt-1 text-xs text-slate-500">{prompt.subtitle}</p>
    </button>
  );
}

PromptCard.propTypes = {
  prompt: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    persona: PropTypes.string,
  }).isRequired,
  active: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};

PromptCard.defaultProps = {
  active: false,
};

function AttachmentList({ attachments, onRemove }) {
  if (!attachments.length) return null;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {attachments.map((file) => (
        <li key={file.id} className="relative flex items-center gap-3 rounded-3xl bg-white/70 p-3 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
            <PhotoIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="flex-1 text-sm text-slate-700">
            <p className="truncate font-medium text-slate-900">{file.name}</p>
            <p className="text-xs text-slate-400">{file.sizeLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(file.id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
            aria-label={`Remove ${file.name}`}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

AttachmentList.propTypes = {
  attachments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      sizeLabel: PropTypes.string,
    }),
  ),
  onRemove: PropTypes.func.isRequired,
};

AttachmentList.defaultProps = {
  attachments: [],
};

function GuidelineList({ guidelines }) {
  if (!guidelines?.length) return null;
  return (
    <ul className="grid gap-3 rounded-3xl border border-slate-100 bg-white/70 p-4">
      {guidelines.map((guideline) => (
        <li key={guideline.id} className="flex items-start gap-3 text-sm text-slate-600">
          <ShieldCheckIcon className="mt-0.5 h-5 w-5 text-blue-500" aria-hidden="true" />
          <div>
            <p className="font-semibold text-slate-900">{guideline.title}</p>
            <p className="text-xs text-slate-500">{guideline.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

GuidelineList.propTypes = {
  guidelines: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
    }),
  ),
};

GuidelineList.defaultProps = {
  guidelines: [],
};

function formatFileSize(bytes) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[exponent]}`;
}

function mapFilesToAttachments(files) {
  return Array.from(files).map((file) => ({
    id: `${file.name}-${file.lastModified}`,
    name: file.name,
    sizeLabel: formatFileSize(file.size),
  }));
}

export default function ReviewComposer({
  subject,
  prompts,
  guidelines,
  availableTags,
  persona,
  initialReview,
  onSubmit,
  onSaveDraft,
}) {
  const [rating, setRating] = useState(initialReview.rating ?? 0);
  const [selectedPrompt, setSelectedPrompt] = useState(() => {
    if (initialReview.promptId) {
      return prompts.find((prompt) => prompt.id === initialReview.promptId) ?? null;
    }
    return prompts.find((prompt) => prompt.persona === persona) ?? null;
  });
  const [reviewText, setReviewText] = useState(initialReview.review ?? '');
  const [selectedTags, setSelectedTags] = useState(new Set(initialReview.tags ?? []));
  const [attachments, setAttachments] = useState(initialReview.attachments ?? []);
  const [errors, setErrors] = useState({});

  const charCount = reviewText.length;
  const charLimit = 1200;

  const personaPrompts = useMemo(() => {
    if (!persona) return prompts;
    return prompts.filter((prompt) => !prompt.persona || prompt.persona === persona);
  }, [persona, prompts]);

  const tagList = useMemo(() => availableTags ?? [], [availableTags]);

  const toggleTag = (tag) => {
    setSelectedTags((current) => {
      const clone = new Set(current);
      if (clone.has(tag)) {
        clone.delete(tag);
      } else {
        clone.add(tag);
      }
      return clone;
    });
  };

  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (!files?.length) return;
    setAttachments((current) => {
      const mapped = mapFilesToAttachments(files);
      const unique = new Map(current.map((file) => [file.id, file]));
      mapped.forEach((file) => {
        unique.set(file.id, file);
      });
      return Array.from(unique.values());
    });
    event.target.value = '';
  };

  const handleRemoveAttachment = (id) => {
    setAttachments((current) => current.filter((file) => file.id !== id));
  };

  const validate = () => {
    const nextErrors = {};
    if (!rating) {
      nextErrors.rating = 'Select a rating to anchor your review.';
    }
    if (reviewText.trim().length < 50) {
      nextErrors.review = 'Share at least 50 characters to help others understand your experience.';
    }
    if (reviewText.length > charLimit) {
      nextErrors.review = `Keep your review within ${charLimit} characters.`;
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      rating,
      review: reviewText.trim(),
      tags: Array.from(selectedTags),
      attachments,
      promptId: selectedPrompt?.id ?? null,
      persona,
    });
  };

  const handleDraft = () => {
    onSaveDraft({
      rating,
      review: reviewText,
      tags: Array.from(selectedTags),
      attachments,
      promptId: selectedPrompt?.id ?? null,
      persona,
    });
  };

  return (
    <section className="relative overflow-hidden rounded-[36px] border border-slate-100 bg-gradient-to-br from-white via-blue-50/40 to-white p-8 shadow-xl">
      <div className="absolute inset-y-0 right-0 -z-10 w-1/2 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_65%)]" />
      <div className="flex flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <UserAvatar name={subject.name} imageUrl={subject.avatarUrl} size="lg" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-blue-400">Compose a review</p>
              <h2 className="text-2xl font-semibold text-slate-900">Share your experience with {subject.name}</h2>
              <p className="text-sm text-slate-500">{subject.role}</p>
            </div>
          </div>
          <div className="rounded-full bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-600">
            Persona: {persona ?? 'General'}
          </div>
        </header>

        <section className="grid gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-slate-400">Overall rating</p>
              {errors.rating ? <p className="text-xs font-semibold text-rose-500">{errors.rating}</p> : null}
            </div>
            <div className="flex flex-wrap gap-3">
              {RATING_SCALE.map((value) => (
                <RatingStar key={value} value={value} selected={rating === value} onSelect={setRating} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-slate-400">Story prompts</p>
              {selectedPrompt ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  <SparklesIcon className="h-4 w-4" /> {selectedPrompt.title}
                </span>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {personaPrompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  active={selectedPrompt?.id === prompt.id}
                  onSelect={setSelectedPrompt}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-slate-400">Review</p>
              <span className={classNames('text-xs font-medium', charCount > charLimit ? 'text-rose-500' : 'text-slate-400')}>
                {charCount}/{charLimit}
              </span>
            </div>
            <div className="relative">
              <textarea
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                rows={6}
                className={classNames(
                  'w-full rounded-3xl border px-5 py-4 text-sm leading-relaxed shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100',
                  errors.review ? 'border-rose-300' : 'border-slate-200 bg-white/80',
                )}
                placeholder="Paint the story—what was the challenge, what did they unlock, how did it make you feel?"
              />
              {errors.review ? (
                <p className="mt-2 text-xs font-semibold text-rose-500">{errors.review}</p>
              ) : (
                <p className="mt-2 text-xs text-slate-400">
                  Bring balance: call out breakthrough moments and a constructive idea for what’s next.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-slate-400">Highlight tags</p>
            <div className="flex flex-wrap gap-2">
              {tagList.map((tag) => {
                const active = selectedTags.has(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={classNames(
                      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition',
                      active
                        ? 'border-blue-300 bg-blue-50/80 text-blue-700 shadow-sm'
                        : 'border-slate-200 bg-white/80 text-slate-500 hover:border-blue-200 hover:text-blue-600',
                    )}
                  >
                    <TagIcon className="h-4 w-4" /> {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-slate-400">Attachments</p>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
                <ArrowUpTrayIcon className="h-4 w-4" /> Add proof
                <input type="file" accept="image/*,video/*,audio/*" multiple className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
            <AttachmentList attachments={attachments} onRemove={handleRemoveAttachment} />
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-slate-400">Review guardrails</p>
            <GuidelineList guidelines={guidelines} />
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-white/80 px-5 py-4 shadow-inner">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CheckCircleIcon className="h-5 w-5 text-emerald-500" aria-hidden="true" />
            {rating >= 4
              ? 'High-impact praise—mention a signature outcome to inspire confidence.'
              : 'Balanced reviews help the community grow. Highlight a win and a next step.'}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDraft}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:brightness-110"
            >
              <PaperAirplaneIcon className="h-4 w-4" /> Publish review
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}

ReviewComposer.propTypes = {
  subject: PropTypes.shape({
    name: PropTypes.string.isRequired,
    avatarUrl: PropTypes.string,
    role: PropTypes.string,
  }).isRequired,
  prompts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      subtitle: PropTypes.string,
      persona: PropTypes.string,
    }),
  ),
  guidelines: PropTypes.array,
  availableTags: PropTypes.arrayOf(PropTypes.string),
  persona: PropTypes.string,
  initialReview: PropTypes.shape({
    rating: PropTypes.number,
    review: PropTypes.string,
    promptId: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    attachments: PropTypes.array,
  }),
  onSubmit: PropTypes.func,
  onSaveDraft: PropTypes.func,
};

ReviewComposer.defaultProps = {
  prompts: [
    {
      id: 'impact',
      title: 'How did they transform the project? ',
      subtitle: 'Describe the before and after in two vivid sentences.',
      persona: 'client',
    },
    {
      id: 'collaboration',
      title: 'What collaboration rituals stood out? ',
      subtitle: 'Share how communication, rituals, or tools made the work flow.',
      persona: 'partner',
    },
    {
      id: 'community',
      title: 'What makes them magnetic to communities? ',
      subtitle: 'Highlight a moment when others rallied around their leadership.',
      persona: 'mentor',
    },
  ],
  guidelines: [
    { id: 'authentic', title: 'Lead with authenticity', description: 'Be specific about context, outcomes, and names you can share.' },
    { id: 'constructive', title: 'Stay constructive', description: 'Pair praise with one opportunity to elevate the next engagement.' },
    { id: 'proof', title: 'Attach proof points', description: 'Charts, clips, or docs add credibility and help prospects feel the story.' },
  ],
  availableTags: ['Visionary', 'Detail-obsessed', 'Lightning fast', 'Mentor energy', 'Strategic thinker'],
  persona: undefined,
  initialReview: {
    rating: 0,
    review: '',
    promptId: null,
    tags: [],
    attachments: [],
  },
  onSubmit: () => {},
  onSaveDraft: () => {},
};

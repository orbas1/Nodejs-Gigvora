import { useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  PaperClipIcon,
  SparklesIcon,
  StarIcon as StarOutlineIcon,
  TagIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowUturnLeftIcon,
  EyeIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  ClockIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import UserAvatar from '../UserAvatar.jsx';

function classNames(...values) {
  return values.filter(Boolean).join(' ');
}

const DEFAULT_CHARACTER_LIMIT = 1200;

function RatingSelector({ rating, max, onChange, disabled }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, index) => {
        const value = index + 1;
        const active = value <= rating;
        return (
          <button
            key={value}
            type="button"
            className={classNames(
              'inline-flex h-10 w-10 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400',
              active ? 'bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/40' : 'bg-white/10 text-white/70 hover:bg-white/20',
            )}
            onClick={() => onChange(value)}
            onKeyUp={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                onChange(value);
              }
            }}
            disabled={disabled}
            aria-label={`Rate ${value} out of ${max}`}
          >
            {active ? <StarSolidIcon className="h-6 w-6" aria-hidden="true" /> : <StarOutlineIcon className="h-6 w-6" aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}

RatingSelector.propTypes = {
  rating: PropTypes.number.isRequired,
  max: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

RatingSelector.defaultProps = {
  max: 5,
  disabled: false,
};

function PromptCard({ prompt, onInsert }) {
  return (
    <button
      type="button"
      onClick={() => onInsert(prompt.text)}
      className="group flex w-full items-start gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/80 transition hover:border-white/20 hover:bg-white/10"
    >
      <SparklesIcon className="mt-0.5 h-5 w-5 text-sky-300 transition group-hover:text-sky-200" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-semibold text-white">{prompt.title}</p>
        <p className="text-xs text-white/60">{prompt.text}</p>
      </div>
    </button>
  );
}

PromptCard.propTypes = {
  prompt: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  }).isRequired,
  onInsert: PropTypes.func.isRequired,
};

function TagPill({ tag, selected, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(tag)}
      className={classNames(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400',
        selected ? 'bg-sky-500/20 text-sky-100 border border-sky-400/40' : 'border border-white/15 bg-white/5 text-white/60 hover:border-white/30 hover:text-white',
      )}
    >
      <TagIcon className="h-4 w-4" aria-hidden="true" />
      {tag.label}
    </button>
  );
}

TagPill.propTypes = {
  tag: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  }).isRequired,
  selected: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
};

TagPill.defaultProps = {
  selected: false,
};

function AttachmentList({ attachments, onRemove }) {
  if (!attachments.length) return null;
  return (
    <ul className="space-y-2 text-sm text-white/80">
      {attachments.map((file) => (
        <li
          key={file.id}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
        >
          <div className="flex items-center gap-3">
            <PaperClipIcon className="h-5 w-5 text-sky-300" aria-hidden="true" />
            <div>
              <p className="font-semibold text-white">{file.name}</p>
              <p className="text-xs text-white/50">{(file.size / 1024).toFixed(1)} KB • {file.status}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRemove(file.id)}
            className="rounded-full border border-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white/60 transition hover:border-rose-300 hover:text-rose-200"
          >
            Remove
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
      size: PropTypes.number.isRequired,
      status: PropTypes.string,
    }),
  ),
  onRemove: PropTypes.func.isRequired,
};

AttachmentList.defaultProps = {
  attachments: [],
};

function GuidelinePanel({ guidelines }) {
  if (!guidelines?.length) return null;
  return (
    <aside className="space-y-3 rounded-3xl border border-sky-500/30 bg-sky-500/10 p-5 text-sm text-sky-100">
      <header className="flex items-center gap-2 text-xs uppercase tracking-wide text-sky-200">
        <ShieldCheckIcon className="h-5 w-5" aria-hidden="true" />
        Community guardrails
      </header>
      <ul className="space-y-2 text-sm">
        {guidelines.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-200" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

GuidelinePanel.propTypes = {
  guidelines: PropTypes.arrayOf(PropTypes.string),
};

GuidelinePanel.defaultProps = {
  guidelines: [],
};

let attachmentIncrement = 0;

export default function ReviewComposer({
  profile,
  personaPrompts,
  defaultPersona,
  tagLibrary,
  guidelines,
  attachmentsEnabled,
  maxAttachmentSize,
  characterLimit,
  onSubmit,
  onCancel,
  onSaveDraft,
  defaultVisibility,
  initialValue,
}) {
  const fileInputRef = useRef(null);
  const [rating, setRating] = useState(initialValue?.rating ?? 0);
  const [title, setTitle] = useState(initialValue?.title ?? '');
  const [body, setBody] = useState(initialValue?.body ?? '');
  const [selectedPersona, setSelectedPersona] = useState(defaultPersona ?? Object.keys(personaPrompts)[0]);
  const [selectedTags, setSelectedTags] = useState(initialValue?.tags ?? []);
  const [attachments, setAttachments] = useState(initialValue?.attachments ?? []);
  const [visibility, setVisibility] = useState(defaultVisibility ?? 'public');
  const [requestFollowUp, setRequestFollowUp] = useState(initialValue?.requestFollowUp ?? true);
  const [shareToProfile, setShareToProfile] = useState(initialValue?.shareToProfile ?? true);

  const prompts = personaPrompts[selectedPersona]?.prompts ?? [];
  const personaSummary = personaPrompts[selectedPersona]?.summary;
  const personaLabel = personaPrompts[selectedPersona]?.label ?? selectedPersona;
  const remaining = useMemo(() => characterLimit - body.length, [characterLimit, body.length]);
  const disabled = rating === 0 || body.trim().length < 80;

  const handleToggleTag = (tag) => {
    setSelectedTags((current) =>
      current.some((item) => item.id === tag.id)
        ? current.filter((item) => item.id !== tag.id)
        : [...current, tag],
    );
  };

  const handleAddAttachment = (event) => {
    const files = Array.from(event.target.files ?? []);
    const accepted = files
      .filter((file) => !maxAttachmentSize || file.size <= maxAttachmentSize)
      .map((file) => ({
        id: `attachment-${attachmentIncrement++}`,
        name: file.name,
        size: file.size,
        status: 'Ready to upload',
        file,
      }));
    if (accepted.length) {
      setAttachments((current) => [...current, ...accepted]);
    }
    event.target.value = '';
  };

  const handleRemoveAttachment = (id) => {
    setAttachments((current) => current.filter((item) => item.id !== id));
  };

  const handleInsertPrompt = (text) => {
    setBody((current) => {
      if (!current.trim()) return `${text}\n\n`;
      return `${current.trim()}\n\n${text}\n`;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (disabled) return;
    onSubmit?.({
      rating,
      title: title.trim(),
      body: body.trim(),
      tags: selectedTags,
      attachments,
      visibility,
      requestFollowUp,
      shareToProfile,
      persona: selectedPersona,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative space-y-8 rounded-[2.5rem] border border-white/10 bg-[radial-gradient(circle_at_top,#0f172a,#020617)] p-8 text-white shadow-2xl shadow-slate-950/60"
    >
      <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden="true">
        <div className="absolute -left-24 top-8 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute right-0 top-20 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
      </div>
      <div className="relative space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.35em] text-white/40">Compose endorsement</p>
            <h2 className="text-3xl font-bold tracking-tight text-white">Share a premium review</h2>
            <p className="max-w-xl text-sm text-white/70">
              Celebrate measurable outcomes, detail collaboration moments, and capture actionable advice so fellow leaders know exactly why this professional excels.
            </p>
          </div>
          {profile ? (
            <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/80">
              <UserAvatar name={profile.name} imageUrl={profile.avatar} size="sm" />
              <div>
                <p className="font-semibold text-white">{profile.name}</p>
                <p className="text-xs uppercase tracking-wide text-white/40">{profile.headline}</p>
              </div>
            </div>
          ) : null}
        </header>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-8">
            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-inner shadow-white/5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/50">Overall rating</p>
                  <p className="text-sm text-white/70">Tap a star to reflect overall impact</p>
                </div>
                <RatingSelector rating={rating} onChange={setRating} max={5} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(personaPrompts).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedPersona(key)}
                    className={classNames(
                      'flex items-start gap-3 rounded-3xl border px-4 py-3 text-left text-sm transition',
                      selectedPersona === key
                        ? 'border-sky-400/60 bg-sky-500/20 text-sky-100'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10',
                    )}
                  >
                    <ChatBubbleBottomCenterTextIcon className="mt-0.5 h-5 w-5" aria-hidden="true" />
                    <div className="space-y-1">
                      <p className="font-semibold text-white">{value.label}</p>
                      <p className="text-xs text-white/60">{value.summary}</p>
                    </div>
                  </button>
                ))}
              </div>
              {personaSummary ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
                  Tailored prompts for <span className="font-semibold text-white">{personaLabel}</span> ensure your review reads like an executive testimonial.
                </div>
              ) : null}
            </div>

            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-inner shadow-white/5">
              <label className="block space-y-3">
                <span className="text-xs uppercase tracking-wide text-white/50">Headline</span>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value.slice(0, 120))}
                  placeholder="Summarise the impact in one headline"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-sky-400 focus:outline-none"
                />
              </label>
              <label className="block space-y-3">
                <span className="text-xs uppercase tracking-wide text-white/50">Narrative</span>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value.slice(0, characterLimit))}
                  rows={8}
                  placeholder="Walk through the collaboration, measurable outcomes, and why you would recommend working together again."
                  className="w-full rounded-3xl border border-white/10 bg-slate-900/60 px-4 py-4 text-sm leading-relaxed text-white placeholder:text-white/30 focus:border-sky-400 focus:outline-none"
                />
              </label>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
                <span>{remaining >= 0 ? `${remaining} characters remaining` : 'Limit reached'}</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold uppercase tracking-wide">
                  <InformationCircleIcon className="h-4 w-4" aria-hidden="true" /> Reviews with 3+ insights convert 2.8× better
                </span>
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-inner shadow-white/5">
              <header className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/50">Structured prompts</p>
                  <p className="text-sm text-white/70">Use these cues to guide a balanced, insight-rich testimonial.</p>
                </div>
                <SparklesIcon className="h-5 w-5 text-sky-300" aria-hidden="true" />
              </header>
              <div className="grid gap-3 sm:grid-cols-2">
                {prompts.map((prompt) => (
                  <PromptCard key={prompt.id} prompt={prompt} onInsert={handleInsertPrompt} />
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-inner shadow-white/5">
              <header className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-white/50">Tags &amp; proof points</p>
                  <p className="text-sm text-white/70">Highlight the competencies you witnessed in action.</p>
                </div>
                <TagIcon className="h-5 w-5 text-sky-300" aria-hidden="true" />
              </header>
              <div className="flex flex-wrap gap-2">
                {tagLibrary.map((tag) => (
                  <TagPill
                    key={tag.id}
                    tag={tag}
                    selected={selectedTags.some((item) => item.id === tag.id)}
                    onToggle={handleToggleTag}
                  />
                ))}
              </div>
            </div>

            {attachmentsEnabled ? (
              <div className="space-y-4 rounded-3xl border border-dashed border-white/20 bg-white/5 p-6 shadow-inner shadow-white/5">
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/50">Supporting artefacts</p>
                    <p className="text-sm text-white/70">Attach presentations, scorecards, or proof of results.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:border-white/30 hover:text-white"
                  >
                    <CloudArrowUpIcon className="h-4 w-4" aria-hidden="true" /> Upload evidence
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    hidden
                    onChange={handleAddAttachment}
                    aria-hidden="true"
                  />
                </header>
                <AttachmentList attachments={attachments} onRemove={handleRemoveAttachment} />
                {maxAttachmentSize ? (
                  <p className="text-xs text-white/40">Max file size {Math.round(maxAttachmentSize / (1024 * 1024))}MB per attachment.</p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <GuidelinePanel guidelines={guidelines} />
            <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
              <header className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/50">
                <EyeIcon className="h-4 w-4" aria-hidden="true" /> Visibility
              </header>
              <div className="space-y-2">
                {[
                  { id: 'public', title: 'Public profile & feed', description: 'Promote this endorsement to your public profile, discovery feed, and search.' },
                  { id: 'members', title: 'Members-only', description: 'Visible to verified mentors, partners, and shared workspaces only.' },
                  { id: 'private', title: 'Private share', description: 'Send privately to the recipient and your internal success teams.' },
                ].map((option) => (
                  <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:border-white/20">
                    <input
                      type="radio"
                      name="visibility"
                      value={option.id}
                      checked={visibility === option.id}
                      onChange={(event) => setVisibility(event.target.value)}
                      className="mt-1 h-4 w-4 accent-sky-400"
                    />
                    <div className="space-y-1">
                      <p className="font-semibold text-white">{option.title}</p>
                      <p className="text-xs text-white/60">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
              <header className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/50">
                <DocumentTextIcon className="h-4 w-4" aria-hidden="true" /> Post-review actions
              </header>
              <label className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3">
                <span className="text-sm">Request a follow-up testimonial once published</span>
                <input
                  type="checkbox"
                  checked={requestFollowUp}
                  onChange={(event) => setRequestFollowUp(event.target.checked)}
                  className="h-4 w-4 accent-sky-400"
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3">
                <span className="text-sm">Showcase on {profile?.name?.split(' ')[0] ?? 'their'} profile automatically</span>
                <input
                  type="checkbox"
                  checked={shareToProfile}
                  onChange={(event) => setShareToProfile(event.target.checked)}
                  className="h-4 w-4 accent-sky-400"
                />
              </label>
              <div className="flex items-start gap-3 rounded-2xl bg-sky-500/10 px-4 py-3 text-xs text-sky-100">
                <ClockIcon className="mt-0.5 h-4 w-4" aria-hidden="true" />
                Reviews typically go live within 45 minutes. You will receive analytics on reach, sentiment, and endorsements unlocked.
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
              <header className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/50">
                <InformationCircleIcon className="h-4 w-4" aria-hidden="true" /> Submission checklist
              </header>
              <ul className="space-y-2 text-xs text-white/70">
                <li className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Mention quantified outcomes or verified milestones.
                </li>
                <li className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Reference collaboration style, responsiveness, or leadership qualities.
                </li>
                <li className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Confirm tone stays aspirational yet candid; avoid confidential details.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-white/50">
            <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden="true" />
            Drafts autosave every 30 seconds.
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onSaveDraft?.({ rating, title, body, selectedTags, attachments, visibility })}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-white/20 hover:text-white"
            >
              <DocumentTextIcon className="h-5 w-5" aria-hidden="true" /> Save draft
            </button>
            <button
              type="button"
              onClick={() => onCancel?.()}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/0 px-4 py-2 text-sm font-semibold text-white/60 transition hover:border-white/20 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={disabled}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Submit review
            </button>
          </div>
        </footer>
      </div>
    </form>
  );
}

ReviewComposer.propTypes = {
  profile: PropTypes.shape({
    name: PropTypes.string,
    headline: PropTypes.string,
    avatar: PropTypes.string,
  }),
  personaPrompts: PropTypes.objectOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      summary: PropTypes.string,
      prompts: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          title: PropTypes.string.isRequired,
          text: PropTypes.string.isRequired,
        }),
      ),
    }),
  ).isRequired,
  defaultPersona: PropTypes.string,
  tagLibrary: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }),
  ),
  guidelines: PropTypes.arrayOf(PropTypes.string),
  attachmentsEnabled: PropTypes.bool,
  maxAttachmentSize: PropTypes.number,
  characterLimit: PropTypes.number,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  onSaveDraft: PropTypes.func,
  defaultVisibility: PropTypes.oneOf(['public', 'members', 'private']),
  initialValue: PropTypes.shape({
    rating: PropTypes.number,
    title: PropTypes.string,
    body: PropTypes.string,
    tags: PropTypes.array,
    attachments: PropTypes.array,
    requestFollowUp: PropTypes.bool,
    shareToProfile: PropTypes.bool,
  }),
};

ReviewComposer.defaultProps = {
  profile: null,
  defaultPersona: undefined,
  tagLibrary: [],
  guidelines: [],
  attachmentsEnabled: true,
  maxAttachmentSize: 5 * 1024 * 1024,
  characterLimit: DEFAULT_CHARACTER_LIMIT,
  onSubmit: undefined,
  onCancel: undefined,
  onSaveDraft: undefined,
  defaultVisibility: 'public',
  initialValue: null,
};
